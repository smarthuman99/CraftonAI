import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { saveNativeImages, nativeImageFields, attachSpreadsheetImages } from "./intakeNativeImages.mjs";
import { sourcesForSummary } from "./portalThumbnailAssets.mjs";

const image = async () => ({
  data: await sharp({ create: { width: 120, height: 100, channels: 3, background: "red" } })
    .png()
    .toBuffer(),
  mimeType: "image/png",
  page: 1,
  sourceRow: 6,
  worksheet: "Room",
  sourceCell: "B6"
});
function storage({ failDownload = false } = {}) {
  const files = new Map();
  let uploads = 0;
  return {
    files,
    get uploads() {
      return uploads;
    },
    from() {
      return {
        async upload(key, bytes, options) {
          uploads++;
          assert.equal(options.upsert, false);
          if (files.has(key)) return { error: { statusCode: "409" } };
          files.set(key, bytes);
          return {};
        },
        async download(key) {
          return { data: new Blob([failDownload ? "wrong" : files.get(key)]) };
        }
      };
    }
  };
}
test("native originals are immutable, verified and compatible with thumbnail summary identity", async () => {
  const backend = storage(),
    original = await image();
  const first = await saveNativeImages({
    storage: backend,
    job: { id: "job" },
    userId: "owner",
    images: [original, original]
  });
  assert.equal(first.references.length, 1);
  assert.deepEqual(first.failures, []);
  const retry = await saveNativeImages({ storage: backend, job: { id: "job" }, userId: "owner", images: [original] });
  assert.equal(retry.references[0].storage_path, first.references[0].storage_path);
  const fields = nativeImageFields(first.references, { row_id: "Room:6" });
  assert.equal(fields.image_sha256, first.references[0].sha256);
  const summary = {
    items: [{ bucket: fields.image_storage_bucket, path: fields.image_storage_path, revision: fields.image_sha256 }]
  };
  assert.equal(sourcesForSummary(summary)[0].revision, fields.image_sha256);
});
test("failed readback never produces a published image reference", async () => {
  const backend = storage({ failDownload: true });
  const result = await saveNativeImages({
    storage: backend,
    job: { id: "job" },
    userId: "owner",
    images: [await image()]
  });
  assert.equal(result.references.length, 0);
  assert.equal(result.failures.length, 1);
  assert.equal(backend.uploads, 2);
});
test("invalid image bytes cannot be uploaded", async () => {
  const backend = storage();
  const result = await saveNativeImages({
    storage: backend,
    job: { id: "job" },
    userId: "owner",
    images: [{ data: Buffer.from("bad"), mimeType: "image/png", page: 1 }]
  });
  assert.equal(backend.uploads, 0);
  assert.equal(result.failures.length, 1);
});
test("native attachment preserves manual images and customer fields, and allows shared source photos", async () => {
  const original = await image(),
    backend = storage();
  const manifest = {
    rows: [
      { id: "a", image_refs: [1] },
      { id: "b", image_refs: [1] },
      { id: "c", image_refs: [1] }
    ]
  };
  const manual = { source_row_id: "a", image_storage_path: "manual", quantity: 44, notes_en: "customer" };
  const result = await attachSpreadsheetImages({
    result: {
      project: { name: "Keep" },
      items: [manual, { source_row_id: "b", quantity: 8 }, { source_row_id: "c", quantity: 9 }]
    },
    manifest,
    images: [original],
    storage: backend,
    job: { id: "job" },
    userId: "owner"
  });
  assert.strictEqual(result.items[0], manual);
  assert.deepEqual(
    result.items.map((i) => i.quantity),
    [44, 8, 9]
  );
  assert.equal(result.items[1].image_storage_path, result.items[2].image_storage_path);
  assert.equal(result.project.name, "Keep");
});
