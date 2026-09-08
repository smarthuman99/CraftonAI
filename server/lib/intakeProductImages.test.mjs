import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { attachRenderedItemCrops } from "./intakeProductImages.mjs";

const box = { x_min: 85, y_min: 228, x_max: 116, y_max: 260 };
const item = { item_ref: "PT01", photo_page: 28, photo_bbox: box, evidence_text: "PT01 Sofa" };

test("Portal's tiny summary photo triggers rerender and is saved instead of silently discarded", async () => {
  const widths = [],
    uploads = [];
  const result = await attachRenderedItemCrops({
    job: { id: "job" },
    userId: "user",
    result: { items: [item] },
    getRenderedPage: async (page, width) => {
      widths.push(width);
      const data = await sharp({
        create: { width, height: Math.round((width * 788) / 1400), channels: 3, background: "#ab7654" }
      })
        .png()
        .toBuffer();
      return { dataBase64: data.toString("base64") };
    },
    storage: {
      from: () => ({
        upload: async (path, data) => {
          uploads.push({ path, metadata: await sharp(data).metadata() });
          return {};
        }
      })
    }
  });
  assert.equal(widths.length, 2);
  assert.ok(widths[1] > widths[0]);
  assert.equal(uploads.length, 1);
  assert.ok(uploads[0].metadata.height >= 48);
  assert.equal(result.image_extraction.item_image_count, 1);
  assert.ok(result.items[0].image_storage_path);
});

test("render failures are recorded and block the quality gate, source placeholders do not upload", async () => {
  let uploads = 0;
  const result = await attachRenderedItemCrops({
    job: { id: "job" },
    result: { items: [item, { ...item, item_ref: "PT17", evidence_text: "PT17 I M G T B C" }] },
    getRenderedPage: async () => null,
    storage: {
      from: () => ({
        upload: async () => {
          uploads++;
          return {};
        }
      })
    }
  });
  assert.equal(uploads, 0);
  assert.equal(result.items[0].image_extraction_attempts[0].reason, "page_render_unavailable");
  assert.equal(result.items[1].image_mapping_status, "source_placeholder");
  assert.equal(result.quality_gate.status, "manual_review_required");
});
