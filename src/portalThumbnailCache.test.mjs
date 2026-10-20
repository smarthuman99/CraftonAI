import test from "node:test";
import assert from "node:assert/strict";
import { createThumbnailCache, preloadThumbnailImage } from "./portalThumbnailCache.mjs";
import { thumbnailReferenceKey, thumbnailSourceVersion } from "../shared/portalThumbnailIdentity.mjs";
const pause = (ms = 15) => new Promise((r) => setTimeout(r, ms));
const response = (body, time = Date.now()) => ({
  images: body.references.map((ref) => ({
    key: thumbnailReferenceKey(ref),
    status: "ready",
    url: `https://private/${ref.jobId}/${ref.index}`,
    expiresAt: time + 600000
  }))
});

test("batches at most 24 references per project; deduplicates, caches and isolates accounts", async () => {
  const calls = [];
  let active = 0,
    peak = 0,
    time = Date.now();
  const request = async (body) => {
    calls.push(body);
    peak = Math.max(peak, ++active);
    await pause();
    active--;
    return response(body, time);
  };
  const cache = createThumbnailCache(request, { batchDelay: 1, now: () => time });
  const ref = { jobId: "a", projectId: "p", index: 0 };
  const one = cache.subscribe(ref),
    same = cache.subscribe(ref);
  assert.equal(one.promise, same.promise);
  const items = Array.from({ length: 50 }, (_, index) => cache.subscribe({ jobId: "b", projectId: "q", index }));
  await Promise.all([one.promise, ...items.map((item) => item.promise)]);
  assert.equal(peak, 2);
  assert.equal(calls.length, 4);
  assert.ok(
    calls.every((body) => body.references.length <= 24 && body.references.every((r) => r.projectId === body.projectId))
  );
  one.cancel();
  same.cancel();
  items.forEach((item) => item.cancel());
  await cache.subscribe(ref).promise;
  assert.equal(calls.length, 4);
  await createThumbnailCache(request, { batchDelay: 1 }).subscribe(ref).promise;
  assert.equal(calls.length, 5);
  time += 600001;
  await cache.subscribe(ref).promise;
  assert.equal(calls.length, 6);
});

test("visible images precede next-screen work; leaving a project cancels unstarted and in-flight batches", async () => {
  const calls = [];
  const cache = createThumbnailCache(
    async (body) => {
      calls.push(body);
      return response(body);
    },
    { batchDelay: 1 }
  );
  const obsolete = cache.subscribe({ jobId: "old", index: 0 });
  const rejected = assert.rejects(obsolete.promise, { name: "AbortError" });
  obsolete.cancel();
  await rejected;
  const next = cache.subscribe({ jobId: "next", index: 1 }, 1);
  const visible = cache.subscribe({ jobId: "visible", index: 0 }, 0);
  await Promise.all([next.promise, visible.promise]);
  assert.deepEqual(
    calls.map((b) => b.references[0].jobId),
    ["visible", "next"]
  );
  let signal;
  const running = createThumbnailCache(
    (_body, options) => {
      signal = options.signal;
      return new Promise((_resolve, reject) =>
        signal.addEventListener("abort", () => reject(Object.assign(new Error(), { name: "AbortError" })))
      );
    },
    { batchDelay: 1 }
  );
  const item = running.subscribe({ jobId: "old", index: 1 });
  const failed = assert.rejects(item.promise, { name: "AbortError" });
  await pause();
  item.cancel();
  await failed;
  assert.equal(signal.aborted, true);
});

test("failed authorization retries and image-only version changes invalidate cache", async () => {
  let fail = true,
    calls = 0;
  const cache = createThumbnailCache(
    async (body) => {
      calls++;
      if (fail) throw new Error("offline");
      return response(body);
    },
    { batchDelay: 1 }
  );
  const image = { bucket: "private", path: "chair" };
  const ref = { jobId: "a", index: 0, version: thumbnailSourceVersion(image, "hash1") };
  await assert.rejects(cache.subscribe(ref).promise, /offline/);
  fail = false;
  await cache.subscribe(ref).promise;
  await cache.subscribe({ ...ref, notes: "changed" }).promise;
  assert.equal(calls, 2);
  await cache.subscribe({ ...ref, version: thumbnailSourceVersion(image, "hash2") }).promise;
  assert.equal(calls, 3);
});

test("pending generation retries without fetching a full original", async () => {
  let calls = 0;
  const cache = createThumbnailCache(
    async (body) =>
      ++calls === 1
        ? { images: body.references.map((r) => ({ key: thumbnailReferenceKey(r), status: "pending" })) }
        : response(body),
    { batchDelay: 1 }
  );
  assert.equal(await cache.subscribe({ jobId: "pending", index: 0 }).promise, "https://private/pending/0");
  assert.equal(calls, 2);
});

test("background downloads finish without scrolling, reserve foreground capacity and reuse loaded images", async () => {
  const loads = [],
    calls = [];
  const cache = createThumbnailCache(
    async (body) => {
      calls.push(body);
      return response(body);
    },
    {
      batchDelay: 1,
      loadImage: (url, options) => new Promise((resolve) => loads.push({ url, ...options, resolve }))
    }
  );
  const references = Array.from({ length: 8 }, (_, index) => ({ jobId: "project", index }));
  const background = references.map((ref) => cache.subscribe(ref, 2));
  await pause();
  assert.equal(calls.length, 1);
  assert.equal(loads.length, 3, "background leaves a connection free");
  let displayed = false;
  background[0].promise.then(() => {
    displayed = true;
  });
  await pause();
  assert.equal(displayed, false, "a URL alone is not a completed image download");
  background[7].prioritize();
  assert.equal(loads.length, 3);
  await pause();
  assert.equal(loads.length, 4);
  assert.equal(loads[3].url, "https://private/project/7");
  assert.equal(loads[3].priority, 0);
  // Complete each wave: the rest must start automatically with no scroll event.
  let completed = 0;
  while (completed < references.length) {
    const wave = loads.slice(completed);
    assert.ok(wave.length);
    wave.forEach((load) => load.resolve());
    completed += wave.length;
    await pause();
  }
  await Promise.all(background.map((item) => item.promise));
  assert.equal(loads.length, 8);
  assert.equal(await cache.subscribe(references[0], 0).promise, "https://private/project/0");
  assert.equal(calls.length, 1);
  assert.equal(loads.length, 8);
  background.forEach((item) => item.cancel());
});

test("leaving a project cancels background image downloads and prevents queued downloads", async () => {
  const loads = [];
  const cache = createThumbnailCache(async (body) => response(body), {
    batchDelay: 1,
    loadImage: (url, { signal }) =>
      new Promise((_resolve, reject) => {
        loads.push({ url, signal });
        signal.addEventListener("abort", () => reject(Object.assign(new Error(), { name: "AbortError" })));
      })
  });
  const items = Array.from({ length: 12 }, (_, index) => cache.subscribe({ jobId: "old", index }, 2));
  const failures = items.map((item) => assert.rejects(item.promise, { name: "AbortError" }));
  await pause();
  assert.equal(loads.length, 3);
  items.forEach((item) => item.cancel());
  await Promise.all(failures);
  await pause();
  assert.equal(loads.length, 3);
  assert.ok(loads.every((load) => load.signal.aborted));
});

test("a transient image failure refreshes authorization and retries only the thumbnail", async () => {
  let calls = 0,
    loads = 0;
  const cache = createThumbnailCache(
    async (body) => {
      calls++;
      return response(body);
    },
    {
      batchDelay: 1,
      loadImage: async (url) => {
        assert.equal(url, "https://private/retry/0");
        if (++loads === 1) throw new Error("temporary network error");
      }
    }
  );
  assert.equal(await cache.subscribe({ jobId: "retry", index: 0 }, 2).promise, "https://private/retry/0");
  assert.equal(calls, 2);
  assert.equal(loads, 2);
});

test("browser preload waits for decoding and releases abandoned or stalled image requests", async () => {
  const image = {
    removeAttribute(name) {
      assert.equal(name, "src");
      this.src = null;
    }
  };
  let decoded;
  image.decode = () =>
    new Promise((resolve) => {
      decoded = resolve;
    });
  const controller = new AbortController();
  const options = { signal: controller.signal, priority: 0, createImage: () => image };
  let complete = false;
  const promise = preloadThumbnailImage("/private.webp", options).then(() => {
    complete = true;
  });
  assert.equal(image.src, "/private.webp");
  assert.equal(image.fetchPriority, "high");
  image.onload();
  await pause();
  assert.equal(complete, false);
  decoded();
  await promise;
  const cancelled = preloadThumbnailImage("/next.webp", options);
  const failure = assert.rejects(cancelled, { name: "AbortError" });
  controller.abort();
  await failure;
  assert.equal(image.src, null);
  assert.equal(image.onload, null);
  await assert.rejects(
    preloadThumbnailImage("/stalled.webp", { ...options, signal: new AbortController().signal, timeout: 1 }),
    /timed out/
  );
  assert.equal(image.src, null);
});
