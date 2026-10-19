import test from "node:test";
import assert from "node:assert/strict";
import { createThumbnailCache } from "./portalThumbnailCache.mjs";
test("thumbnail browser queue is bounded, deduplicated, retryable and isolated per account", async () => {
  let running = 0,
    peak = 0,
    calls = 0,
    fail = false;
  const request = async () => {
    calls++;
    running++;
    peak = Math.max(peak, running);
    await new Promise((r) => setImmediate(r));
    running--;
    if (fail) throw new Error("offline");
    return { image: "data:image/webp;base64,AA==" };
  };
  const cache = createThumbnailCache(request);
  const first = cache({ jobId: "a", index: 0 });
  assert.equal(cache({ jobId: "a", index: 0 }), first);
  await Promise.all([first, ...Array.from({ length: 20 }, (_, index) => cache({ jobId: "b", index }))]);
  assert.equal(peak, 3);
  assert.equal(calls, 21);
  await cache({ jobId: "a", index: 0 });
  assert.equal(calls, 21);
  await createThumbnailCache(request)({ jobId: "a", index: 0 });
  assert.equal(calls, 22);
  fail = true;
  await assert.rejects(cache({ jobId: "x", index: 0 }));
  fail = false;
  await cache({ jobId: "x", index: 0 });
  assert.equal(calls, 24);
});
