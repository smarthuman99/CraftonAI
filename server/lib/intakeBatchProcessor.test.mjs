import assert from "node:assert/strict";
import test from "node:test";

import {
  bindBatchSourcePages,
  buildPdfCheckpoint,
  createPageBatches,
  mergeIntakeBatchResults,
  readPdfCheckpoint
} from "./intakeBatchProcessor.mjs";

test("creates pending PDF page batches without repeating checkpointed pages", () => {
  assert.deepEqual(createPageBatches(10, 4, [1, 2, 3, 4]), [
    [5, 6, 7, 8],
    [9, 10]
  ]);
});

test("round-trips a compatible PDF processing checkpoint", () => {
  const checkpoint = buildPdfCheckpoint({
    totalPages: 8,
    batchSize: 4,
    fingerprint: "pdf-123",
    completedPages: [4, 2, 1, 3],
    batches: [{ pages: [1, 2, 3, 4], result: { items: [] } }]
  });
  const restored = readPdfCheckpoint(checkpoint, { totalPages: 8, fingerprint: "pdf-123" });

  assert.deepEqual(restored.completedPages, [1, 2, 3, 4]);
  assert.equal(restored.batches.length, 1);
  assert.equal(readPdfCheckpoint(checkpoint, { totalPages: 9, fingerprint: "pdf-123" }), null);
  assert.equal(
    readPdfCheckpoint(
      { schema_version: "pdf_batch_checkpoint_v1", processing: { version: 1, total_pages: 8 } },
      { totalPages: 8, fingerprint: "pdf-123" }
    ),
    null
  );
});

test("binds missing source pages to the current batch and merges results globally", () => {
  const first = bindBatchSourcePages(
    {
      project: { name: "Portal Outdoor Amenity", client_name: "The Crafton Ltd", destination: "Level 10 Terrace" },
      items: [fixtureItem({ item_type_en: "Outdoor Sofa", quantity: 4, source_page: 0 })],
      questions: ["Please confirm delivery date."],
      source_notes: "Pages 1-2"
    },
    [1, 2]
  );
  const second = {
    project: { name: "Portal Outdoor Amenity", client_name: "The Crafton Ltd", destination: "Level 10 Terrace" },
    items: [fixtureItem({ item_type_en: "Outdoor Dining Table", quantity: 3, source_page: 4 })],
    questions: ["Please confirm delivery date.", "Please confirm finish."],
    source_notes: "Pages 3-4"
  };

  const merged = mergeIntakeBatchResults({
    job: {},
    file: { original_name: "portal.pdf" },
    totalPages: 4,
    batchEntries: [
      { pages: [1, 2], result: first },
      { pages: [3, 4], result: second }
    ]
  });

  assert.equal(first.items[0].source_page, 1);
  assert.equal(merged.project.name, "Portal Outdoor Amenity");
  assert.equal(merged.items.length, 2);
  assert.deepEqual(merged.items.map((item) => item.source_page), [1, 4]);
  assert.equal(merged.questions.filter((question) => question === "Please confirm delivery date.").length, 1);
  assert.equal(merged.processing.state, "completed");
  assert.deepEqual(merged.processing.completed_pages, [1, 2, 3, 4]);
});

test("fails the PDF extraction quality gate when all processed pages yield zero furniture lines", () => {
  const merged = mergeIntakeBatchResults({
    job: { project_name: "Portal Amenity" },
    file: { original_name: "portal.pdf" },
    totalPages: 2,
    batchEntries: [
      {
        pages: [1, 2],
        result: {
          project: { name: "Portal Amenity", client_name: "The Crafton Ltd", destination: "London" },
          items: [],
          questions: ["Please upload the furniture schedule again."],
          visual_analysis: { status: "completed" }
        }
      }
    ]
  });

  assert.equal(merged.items.length, 0);
  assert.equal(merged.processing.state, "manual_review_required");
  assert.equal(merged.processing.quality_gate_passed, false);
  assert.equal(merged.visual_analysis.reason, "no_furniture_lines_extracted");
  assert.equal(merged.questions.length, 1);
  assert.match(merged.questions[0], /Crafton must review/i);
  assert.doesNotMatch(merged.questions[0], /upload the furniture schedule again/i);
});

function fixtureItem(overrides = {}) {
  return {
    item_type_cn: overrides.item_type_en || "Furniture",
    item_type_en: "Furniture",
    quantity: 1,
    material_cn: "Solid timber",
    material_en: "Solid timber",
    original_unit_price: 0,
    unit_price: 0,
    dimensions_text: "W 1000 x D 800 x H 700 mm",
    usage_location: "Terrace",
    source_page: 0,
    notes_cn: "",
    notes_en: "",
    ...overrides
  };
}
