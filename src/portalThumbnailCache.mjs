import { thumbnailReferenceKey } from "../shared/portalThumbnailIdentity.mjs";

const aborted = () => Object.assign(new Error("Preview no longer needed"), { name: "AbortError" });
export function createThumbnailCache(
  request,
  { maxEntries = 480, now = Date.now, batchDelay = 40, onTiming = () => {} } = {}
) {
  const cache = new Map(),
    queued = new Set();
  let active = 0,
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
  function pump() {
    while (active < 2 && queued.size) {
      const candidates = [...queued]
        .filter((e) => e.watchers.size)
        .sort((a, b) => a.priority - b.priority || a.created - b.created);
      if (!candidates.length) return;
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
            if (image?.status === "ready" && image.expiresAt > now() + 30000)
              finish(entry, image.url, image.expiresAt - 30000);
            else if (image?.status === "pending" && entry.attempts++ < 6) {
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
        attempts: 0
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
      prioritize() {
        entry.priority = 0;
      },
      cancel() {
        entry.watchers.delete(watcher);
        if (entry.watchers.size || entry.state === "done") return;
        clearTimeout(entry.retry);
        queued.delete(entry);
        if (cache.get(key) === entry) cache.delete(key);
        entry.reject(aborted());
        if (entry.batch?.entries.every((e) => !e.watchers.size)) entry.batch.controller.abort();
      }
    };
  }
  return { subscribe, invalidate: (reference) => cache.delete(thumbnailReferenceKey(reference)) };
}
