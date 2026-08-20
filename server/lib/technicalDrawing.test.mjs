import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTechnicalDrawingSvg,
  extractGeminiImage,
  formalizeTechnicalDrawing,
  refreshTechnicalDrawingPng,
  renderTechnicalDrawingPng,
  technicalDrawingEligible
} from "./technicalDrawing.mjs";

const image = { mimeType: "image/png", dataBase64: Buffer.alloc(256, 1).toString("base64") };

test("extracts an image from Gemini interaction output", () => {
  const result = extractGeminiImage({ output_image: { mime_type: image.mimeType, data: image.dataBase64 } });
  assert.deepEqual(result, image);
});

test("builds separate system-generated and formal drawing sheets", () => {
  const input = {
    item: {
      item_type_en: "Curved Lounge Chair",
      quantity: 10,
      dimensions_text: "W 650 x D 650 x H 690 mm",
      material_en: "Linen / walnut base"
    },
    job: { id: "job-123", project_name: "Luna Project" },
    references: [image],
    generatedImage: image
  };
  const draft = buildTechnicalDrawingSvg(input);
  const formal = buildTechnicalDrawingSvg({ ...input, formal: true });
  assert.match(draft, /系统自动生成/);
  assert.match(draft, /PENDING ADMIN CONFIRMATION/);
  assert.match(formal, /正式图纸/);
  assert.match(formal, /CONFIRMED BY CRAFTON/);
  assert.match(formal, /W 650 x D 650 x H 690 mm/);
  assert.match(draft, /ITEM TRACEABILITY/);
  assert.match(draft, /CRF-LP-/);
  assert.match(draft, /TRK-/);
  assert.match(draft, /data:image\/svg\+xml;base64/);
});

test("renders the composed drawing sheet as a PNG", async () => {
  const png = await renderTechnicalDrawingPng(
    '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1300"><rect width="2000" height="1300" fill="white"/></svg>'
  );
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const refreshed = await refreshTechnicalDrawingPng(png, {
    item: { item_type_en: "Chair", quantity: 10, material_en: "A very long material description that must fit" },
    job: { id: "550c6980-96f5-499e-a6cd-6026b43779e4", project_name: "Luna Project" }
  });
  assert.deepEqual([...refreshed.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

test("only queues items with a reference and no active drawing", () => {
  assert.equal(technicalDrawingEligible({ item: { image_storage_path: "client/item.png" } }), true);
  assert.equal(
    technicalDrawingEligible({
      item: { image_storage_path: "client/item.png", technical_drawing: { status: "system_generated" } }
    }),
    false
  );
  assert.equal(technicalDrawingEligible({ item: {} }), false);
  assert.equal(
    technicalDrawingEligible({
      item: {
        image_storage_path: "client/item.png",
        technical_drawing: { status: "waiting_for_quota", retry_after: new Date(Date.now() + 60000).toISOString() }
      }
    }),
    false
  );
});

test("formalizes the prebuilt formal asset", () => {
  const formal = formalizeTechnicalDrawing(
    { status: "system_generated", draft_storage_path: "draft.svg", formal_storage_path: "formal.svg" },
    { approvedBy: "Cho" }
  );
  assert.equal(formal.status, "formal");
  assert.equal(formal.drawing_storage_path, "formal.svg");
  assert.equal(formal.approved_by, "Cho");
});
