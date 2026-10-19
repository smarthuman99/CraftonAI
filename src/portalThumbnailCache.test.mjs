import test from "node:test";
import assert from "node:assert/strict";
import { createThumbnailCache } from "./portalThumbnailCache.mjs";
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
