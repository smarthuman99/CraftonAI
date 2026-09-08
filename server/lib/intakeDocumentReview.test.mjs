import test from "node:test";
import assert from "node:assert/strict";
import { applyDocumentReviews, reviewIntakePdf, rankProductPhotos } from "./intakeDocumentReview.mjs";
import { prepareInitialClientCompletion } from "./intakeClientCompletion.mjs";

const bbox = { x_min: 80, y_min: 200, x_max: 120, y_max: 240 };
const item = {
  item_ref: "PT20",
  quantity: 338,
  dimensions_text: "To confirm",
  evidence_text: "PT20 Chest of drawers 338"
};
const manifest = [{ item_ref: "PT20" }];
const row = {
  source_page: 2,
  group_ref: "FT1",
  room: "bedroom",
  unit_count: 2,
  quantity_per_unit: 1,
  optional: true,
  evidence_text: "Chest of drawers (optional) 1"
};
const patch = (extra = {}) => ({
  item_ref: "PT20",
  dimensions: [],
  variants: [],
  quantity_rows: [],
  photos: [],
  issues: [],
  ...extra
});
const batch = (items, text = "SOURCE PAGE 2\nChest of drawers (optional) 1", pages = [2]) => ({
  pages,
  text,
  review: { items, issues: [] }
});

test("detail audit preserves master quantities, optional rows and conflicts, and blocks approval internally", () => {
  const result = applyDocumentReviews(
    { items: [item], questions: [], quality_gate: { status: "passed" } },
    {
      manifest,
      batches: [batch([patch({ quantity_rows: [row, row] })])]
    }
  );
  assert.equal(result.items[0].quantity, 338);
  assert.equal(result.items[0].requirement_status, "optional");
  assert.equal(result.items[0].quantity_reconciliation.breakdown_quantity, 2);
  assert.equal(result.items[0].quantity_reconciliation.rows.length, 1);
  assert.equal(result.quality_gate.status, "manual_review_required");
  const completion = prepareInitialClientCompletion({ result });
  assert.equal(completion.readyForApproval, false);
  assert.equal(completion.clientItems.length, 0);
  assert.equal(completion.adminExceptions.length, 1);
});

test("untrusted review cannot add items, change quantities or accept unsupported dimensions", () => {
  const result = applyDocumentReviews(
    { items: [item] },
    {
      manifest,
      batches: [
        batch([
          patch({ dimensions: [{ value: "900 x 800 mm", source_page: 2, evidence_text: "900 x 800 mm" }] }),
          { item_ref: "INVENTED", quantity: 1 }
        ])
      ]
    }
  );
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].dimensions_text, "To confirm");
  assert.equal(result.items[0].quantity, 338);
  assert.equal(result.quality_gate.status, "manual_review_required");
});

test("verified partial dimensions and separately labelled variants survive review", () => {
  const result = applyDocumentReviews(
    { items: [item] },
    {
      manifest,
      batches: [
        batch(
          [
            patch({
              dimensions: [{ value: "450 x 420 mm", source_page: 2, evidence_text: "450 x 420 mm" }],
              variants: [
                {
                  label: "Collection 1",
                  description: "Brown (visual estimate)",
                  source_page: 2,
                  evidence_text: "Collection 1"
                },
                {
                  label: "Collection 2",
                  description: "Cream (visual estimate)",
                  source_page: 2,
                  evidence_text: "Collection 2"
                }
              ]
            })
          ],
          "SOURCE PAGE 2\n450 x 420 mm\nCollection 1\nCollection 2"
        )
      ]
    }
  );
  assert.equal(result.items[0].dimensions_text, "450 x 420 mm");
  assert.equal(result.items[0].variant_options.length, 2);
  assert.equal(result.items[0].quantity_reconciliation.status, "not_verified");
});

test("photo selection prefers large isolated products and rejects placeholder/scene boxes", () => {
  const photos = [
    null,
    { source_page: 28, bbox, kind: "isolated_product", label: "Missing confidence" },
    { source_page: 28, bbox, kind: "thumbnail", confidence: 1, label: "Sofa" },
    {
      source_page: 5,
      bbox: { ...bbox, x_max: 400, y_max: 600 },
      kind: "isolated_product",
      confidence: 0.95,
      label: "Sofa"
    },
    { source_page: 28, bbox, kind: "isolated_product", confidence: 1, label: "I M G T B C" },
    { source_page: 2, bbox, kind: "room_scene", confidence: 1, label: "Living room" }
  ];
  assert.deepEqual(
    rankProductPhotos(photos).map((p) => p.source_page),
    [5, 28]
  );
});

test("a placeholder never retains the original Gemini crop", () => {
  const result = applyDocumentReviews(
    { items: [{ ...item, evidence_text: "PT20 I M G T B C", photo_page: 28, photo_bbox: bbox }] },
    { manifest, batches: [] }
  );
  assert.equal(result.items[0].photo_page, 0);
  assert.equal(result.items[0].image_mapping_status, "source_placeholder");
});

test("detail review uses small high-resolution page groups, and an incomplete batch fails closed", async () => {
  const calls = [];
  const reader = {
    totalPages: 4,
    readPages: async (pages) => ({ sourceText: `SOURCE PAGE ${pages[0]}` }),
    renderPages: async (pages, options) => {
      calls.push({ pages, options });
      return { pages: pages.map((p) => ({ pageNumber: p, width: 2400 })) };
    }
  };
  const result = await reviewIntakePdf({
    result: { items: [item] },
    reader,
    reviewBatch: async ({ sourceMedia }) => ({
      reviewed_pages: sourceMedia.pages[0].pageNumber === 1 ? [1, 2] : [4],
      items: [],
      issues: []
    })
  });
  assert.deepEqual(
    calls.map((c) => c.pages),
    [[1, 2, 3], [4]]
  );
  assert.equal(calls[0].options.desiredWidth, 2400);
  assert.deepEqual(result.document_review.failed_pages, [1, 2, 3]);
  assert.equal(result.quality_gate.status, "manual_review_required");
});
