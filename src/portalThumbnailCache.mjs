import { thumbnailReferenceKey } from "../shared/portalThumbnailIdentity.mjs";

const aborted = () => Object.assign(new Error("Preview no longer needed"), { name: "AbortError" });
export function createThumbnailCache(
  request,
  { maxEntries = 480, now = Date.now, batchDelay = 40, onTiming = () => {}, loadImage = async () => {} } = {}
) {
  const cache = new Map(),
    queued = new Set(),
    downloads = new Set();
  let active = 0,
    downloading = 0,
    timer;
  const schedule = () => {
    if (!timer)
      timer = setTimeout(() => {
        timer = null;
        pump();
      }, batchDelay);
  };
  function finish(entry, value, expiresAt) {
    entry.state = "done";
    entry.expiresAt = expiresAt;
    entry.resolve(value);
    for (const [key, item] of cache) if (cache.size > maxEntries && item.state === "done") cache.delete(key);
  }
  function pumpDownloads() {
    while (downloading < 4 && downloads.size) {
      const entry = [...downloads]
        .filter((item) => item.watchers.size)
        .sort((a, b) => a.priority - b.priority || a.created - b.created)[0];
      // Keep a connection available for images the user scrolls into view.
      if (!entry || (entry.priority === 2 && downloading >= 3)) return;
      downloads.delete(entry);
      if (entry.expiresAt <= now() + 5000) {
        entry.state = "queued";
        queued.add(entry);
        schedule();
        continue;
      }
      entry.state = "downloading";
      entry.downloadController = new AbortController();
      downloading++;
      const started = now();
      Promise.resolve()
        .then(() => loadImage(entry.url, { signal: entry.downloadController.signal, priority: entry.priority }))
        .then((metrics) => {
          if (!entry.watchers.size || cache.get(entry.key) !== entry) return;
          onTiming({ phase: "preload", priority: entry.priority, ms: now() - started, ...metrics });
          finish(entry, entry.url, entry.expiresAt);
        })
        .catch((error) => {
          if (cache.get(entry.key) !== entry) return;
          if (error.name !== "AbortError" && entry.watchers.size && entry.downloadAttempts++ < 1) {
            entry.state = "waiting";
            entry.retry = setTimeout(() => {
              if (!entry.watchers.size) return;
              entry.state = "queued";
              queued.add(entry);
              schedule();
            }, 500);
            return;
          }
          cache.delete(entry.key);
          entry.reject(error);
        })
        .finally(() => {
          downloading--;
          pumpDownloads();
        });
    }
  }
  function pump() {
    while (active < 2 && queued.size) {
      const candidates = [...queued]
        .filter((e) => e.watchers.size)
        .sort((a, b) => a.priority - b.priority || a.created - b.created);
      if (!candidates.length) return;
      // Background authorization must not occupy both request slots.
      if (candidates[0].priority === 2 && active >= 1) return;
      const group = candidates[0].group;
      const batch = candidates.filter((e) => e.group === group).slice(0, 24);
      const controller = new AbortController();
      for (const entry of batch) {
        queued.delete(entry);
        entry.state = "active";
        entry.batch = { entries: batch, controller };
      }
      active++;
      const started = now();
      Promise.resolve()
        .then(() =>
          request(
            {
              action: "portal_thumbnail_batch",
              projectId: batch[0].reference.projectId || undefined,
              references: batch.map((e) => e.reference)
            },
            { signal: controller.signal }
          )
        )
        .then((data) => {
          const images = new Map((data.images || []).map((image) => [image.key, image]));
          onTiming({
            phase: "batch",
            count: batch.length,
            ready: (data.images || []).filter((i) => i.status === "ready").length,
            ms: now() - started
          });
          for (const entry of batch) {
            if (!entry.watchers.size || cache.get(entry.key) !== entry) continue;
            const image = images.get(entry.key);
            if (image?.status === "ready" && image.expiresAt > now() + 30000) {
              entry.url = image.url;
              entry.expiresAt = image.expiresAt - 30000;
              entry.state = "download-queued";
              downloads.add(entry);
            } else if (image?.status === "pending" && entry.attempts++ < 6) {
              entry.state = "waiting";
              entry.retry = setTimeout(
                () => {
                  if (entry.watchers.size) {
                    entry.state = "queued";
                    queued.add(entry);
                    schedule();
                  }
                },
                Math.min(1000 * 2 ** entry.attempts, 10000)
              );
            } else finish(entry, "", now() + 30000);
          }
          pumpDownloads();
        })
        .catch((error) => {
          for (const entry of batch)
            if (cache.get(entry.key) === entry) {
              cache.delete(entry.key);
              entry.reject(error);
            }
        })
        .finally(() => {
          active--;
          schedule();
        });
    }
  }
  function subscribe(reference, priority = 1) {
    const key = thumbnailReferenceKey(reference);
    let entry = cache.get(key);
    if (entry?.state === "done" && entry.expiresAt <= now()) {
      cache.delete(key);
      entry = null;
    }
    if (!entry) {
      entry = {
        key,
        reference,
        group: reference.projectId || reference.jobId,
        watchers: new Set(),
        state: "queued",
        priority,
        created: now(),
        attempts: 0,
        downloadAttempts: 0
      };
      entry.promise = new Promise((resolve, reject) => {
        entry.resolve = resolve;
        entry.reject = reject;
      });
      cache.set(key, entry);
      queued.add(entry);
    }
    const watcher = {};
    entry.watchers.add(watcher);
    entry.priority = Math.min(entry.priority, priority);
    if (entry.state === "queued") schedule();
    return {
      promise: entry.promise,
      prioritize(priority = 0) {
        entry.priority = Math.min(entry.priority, priority);
        if (entry.state === "queued") schedule();
        if (entry.state === "download-queued") pumpDownloads();
      },
      cancel() {
        entry.watchers.delete(watcher);
        if (entry.watchers.size || entry.state === "done") return;
        clearTimeout(entry.retry);
        queued.delete(entry);
        downloads.delete(entry);
        if (cache.get(key) === entry) cache.delete(key);
        entry.reject(aborted());
        entry.downloadController?.abort();
        if (entry.batch?.entries.every((e) => !e.watchers.size)) entry.batch.controller.abort();
      }
    };
  }
  return { subscribe, invalidate: (reference) => cache.delete(thumbnailReferenceKey(reference)) };
}

// Fetch and decode private thumbnails before revealing their existing <img>.
// The normal browser cache then serves that same URL without another download.
export function preloadThumbnailImage(url, { signal, priority, createImage = () => new Image(), timeout = 20000 }) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(aborted());
    const image = createImage();
    let settled = false,
      metrics;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      image.onload = image.onerror = null;
      if (error) {
        image.removeAttribute("src");
        reject(error);
      } else resolve(metrics);
    };
    const cancel = () => finish(aborted());
    const timer = setTimeout(() => finish(new Error("Preview download timed out")), timeout);
    image.decoding = "async";
    image.fetchPriority = priority === 0 ? "high" : "low";
    image.onload = () => {
      const resource = performance.getEntriesByName(image.currentSrc || image.src).at(-1);
      metrics = {
        downloadMs: resource ? Math.round(resource.duration) : null,
        transferBytes: resource?.transferSize ?? null,
        webpBytes: resource?.decodedBodySize ?? null
      };
      if (image.decode)
        image.decode().then(
          () => finish(),
          (error) => finish(error)
        );
      else finish();
    };
    image.onerror = () => finish(new Error("Preview download failed"));
    signal.addEventListener("abort", cancel, { once: true });
    image.src = url;
  });
}
