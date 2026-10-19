import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createThumbnailService, resizePortalThumbnail } from "./portalThumbnail.mjs";
const jobId = "11111111-1111-4111-8111-111111111111";
test("real thumbnail is a bounded WebP and leaves original untouched", async () => {
  const source = await sharp({ create: { width: 2400, height: 1600, channels: 3, background: "#737a34" } })
    .png()
    .toBuffer();
  const image = await resizePortalThumbnail(source),
    meta = await sharp(image).metadata();
  assert.equal(meta.format, "webp");
  assert.ok(meta.width <= 320 && meta.height <= 240);
  assert.ok(image.length < source.length);
  assert.equal((await sharp(source).metadata()).width, 2400);
});
test("thumbnail authorizes before cached reads, deduplicates generation and invalidates on image change", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "crafton-thumb-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  let calls = 0,
    version = "one";
  const row = () => ({ owner_id: "owner", items: [{ bucket: "private", path: "owner/photo" }], updated_at: version });
  const client = {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row() }) }) }) }),
    storage: {
      from: (bucket) => ({
        download: async (p) => {
          assert.equal(bucket, "private");
          assert.equal(p, "owner/photo");
          calls++;
          return { data: new Blob(["original"]) };
        }
      })
    }
  };
  const service = createThumbnailService({ cacheDir: dir, resize: async () => Buffer.from("small") });
  const input = { supabase: client, user: { id: "owner" }, body: { jobId, index: 0 } };
  await Promise.all([service(input), service(input)]);
  assert.equal(calls, 1);
  await service(input);
  assert.equal(calls, 1);
  await assert.rejects(service({ ...input, user: { id: "other" } }), (e) => e.statusCode === 404);
  assert.equal(calls, 1);
  await assert.rejects(
    service({ ...input, body: { jobId: "../secret", index: 0, url: "http://localhost" } }),
    (e) => e.statusCode === 400
  );
  version = "two";
  await service(input);
  assert.equal(calls, 2);
});
