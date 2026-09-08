import test from "node:test";
import assert from "node:assert/strict";
import {
  createEvidenceUnits,
  evaluateEvidenceGate,
  buildRiskReviewPlan,
  runRiskBasedReview,
  mergeRiskReviewReplies
} from "./intakeRiskReview.mjs";
import { prepareInitialClientCompletion } from "./intakeClientCompletion.mjs";
import { createReviewSource } from "./intakeReviewSource.mjs";

const box = { x_min: 100, y_min: 100, x_max: 600, y_max: 800 };
const zero = { x_min: 0, y_min: 0, x_max: 0, y_max: 0 };
const text = "Dining Chair. Qty: 20 pcs. Size: 520 x 560 x 820 mm. Material: Oak + Fabric. Required.";
const data = () => {
  const item = {
    item_ref: "CH01",
    item_type_en: "Dining Chair",
    quantity: 20,
    dimensions_text: "520 x 560 x 820 mm",
    material_en: "Oak + Fabric",
    requirement_status: "required",
    source_page: 1,
    source_pages: [1],
    confidence: 1,
    image_storage_path: "source/chair.png",
    image_width: 600,
    image_height: 600
  };
  item.field_evidence = Object.entries({
    product: item.item_type_en,
    quantity: "20",
    dimensions: item.dimensions_text,
    material: item.material_en,
    optional: "required"
  }).map(([field, value]) => ({
    field,
    value,
    quote: text,
    source_page: 1,
    locator: "row 1",
    source_kind: "text",
    bbox: zero
  }));
  return { items: [item], questions: [], quality_gate: { status: "passed" } };
};
const context = (kind = "image") => ({
  ...createEvidenceUnits({
    sourceText: text,
    sourceKind: kind,
    sourceMedia: kind === "image" ? { dataBase64: "png" } : null
  }),
  fingerprint: "test"
});
const sourceReader = (ctx) => async (ids) => ({
  units: ctx.units.filter((u) => ids.includes(u.id)),
  sourceMedia: { pages: ids.map((id) => ({ pageNumber: id, dataBase64: "png" })) }
});
const patch = (fields = [], extra = {}) => ({
  item_ref: "REVIEW-ITEM-1",
  fields,
  photos: [],
  quantity_rows: [],
  issues: [],
  ...extra
});
const record = (field, value, extra = {}) => ({
  field,
  value,
  quote: text,
  source_page: 1,
  locator: "row 1",
  source_kind: "text",
  bbox: zero,
  status: "supported",
  explanation: "",
  ...extra
});

for (const kind of ["pdf", "spreadsheet", "docx", "image"])
  test(`${kind}: complete simple source passes the program gate without a second AI call`, async () => {
    let calls = 0;
    const result = await runRiskBasedReview({
      result: data(),
      context: context(kind),
      readReviewUnits: sourceReader(context(kind)),
      reviewBatch: async () => {
        calls++;
        throw Error("should not call");
      }
    });
    assert.equal(calls, 0);
    assert.equal(result.evidence_gate.initial.evidence_coverage_percent, 100);
    assert.equal(result.review_routing.route, "ready_for_approval");
  });

test("100% model confidence without traceable evidence cannot pass", () => {
  const result = data();
  result.items[0].field_evidence = [];
  assert.equal(evaluateEvidenceGate({ result, context: context() }).status, "ai_review_required");
});
test("partial dimensions remain partial and a confirmed missing height asks for completion without deleting known values", async () => {
  const draft = data(),
    ctx = context();
  draft.items[0].dimensions_text = "520 x 560 mm";
  ctx.units[0].text = text.replace("520 x 560 x 820 mm", "520 x 560 mm");
  draft.items[0].field_evidence.forEach((e) => {
    e.quote = ctx.units[0].text;
    if (e.field === "dimensions") e.value = "520 x 560 mm";
  });
  const result = await runRiskBasedReview({
    result: draft,
    context: ctx,
    readReviewUnits: sourceReader(ctx),
    reviewBatch: async () => ({
      reviewed_pages: [1],
      issues: [],
      items: [
        patch([
          record("dimensions", "", {
            status: "not_in_source",
            explanation: "Width and depth are stated; height is not stated."
          })
        ])
      ]
    })
  });
  assert.equal(result.items[0].dimensions_text, "520 x 560 mm");
  assert.equal(result.review_routing.route, "client_clarification");
  assert.match(result.questions[0], /height/);
});
test("quantity 20 is not substantiated by the number 2000 in a dimension", () => {
  const result = data();
  result.items[0].field_evidence[1].quote = "Size 2000 mm";
  const ctx = context();
  ctx.units[0].text += " Size 2000 mm";
  assert.equal(
    evaluateEvidenceGate({ result, context: ctx }).items[0].fields.find((f) => f.field === "quantity").status,
    "unverified"
  );
});
test("risk selection checks only the relevant page when the risk is localized", () => {
  const result = data();
  result.items[0].source_page = 3;
  result.items[0].source_pages = [3];
  result.items[0].confidence = 0.6;
  result.items[0].field_evidence.forEach((e) => (e.source_page = 3));
  const ctx = {
    ...context("pdf"),
    units: [1, 2, 3, 4].map((id) => ({ id, text: id === 3 ? text : "Cover", label: `Page ${id}` }))
  };
  const plan = buildRiskReviewPlan(evaluateEvidenceGate({ result, context: ctx }), ctx, result);
  assert.deepEqual(plan.source_units, [3]);
  assert.equal(plan.full_source_search, false);
});
test("complex Excel and Word sources enter AI review just like PDFs", () => {
  for (const kind of ["spreadsheet", "docx"]) {
    const result = data();
    result.items.push({ ...result.items[0], item_ref: "CH02" });
    const ctx = context(kind);
    ctx.sourceMetadata = { mergedCellCount: 2 };
    const gate = evaluateEvidenceGate({ result, context: ctx });
    assert.equal(gate.status, "ai_review_required");
    assert.ok(gate.risks.some((r) => r.code === "multiple_products"));
    assert.ok(gate.risks.some((r) => r.code === "complex_table"));
  }
});
test("service failure is internal and never sends first-pass questions to the client", async () => {
  const draft = data();
  draft.items[0].field_evidence = [];
  draft.questions = ["Please upload the photos again."];
  const result = await runRiskBasedReview({
    result: draft,
    context: context(),
    readReviewUnits: sourceReader(context()),
    reviewBatch: async () => {
      throw Error("Unavailable");
    }
  });
  assert.equal(result.review_routing.route, "internal_review");
  assert.equal(result.risk_review.status, "failed");
  assert.deepEqual(result.review_routing.proposed_client_questions, draft.questions);
  assert.equal(prepareInitialClientCompletion({ result }).clientItems.length, 0);
});
test("missing source field can reach the client only after complete source absence checks", async () => {
  const draft = data();
  draft.items[0].material_en = "To confirm";
  draft.items[0].field_evidence = draft.items[0].field_evidence.filter((e) => e.field !== "material");
  const ctx = context();
  ctx.units[0].text = text.replace("Material: Oak + Fabric. ", "");
  draft.items[0].field_evidence.forEach((e) => (e.quote = ctx.units[0].text));
  const result = await runRiskBasedReview({
    result: draft,
    context: ctx,
    readReviewUnits: sourceReader(ctx),
    reviewBatch: async () => ({
      reviewed_pages: [1],
      issues: [],
      items: [patch([record("material", "", { status: "not_in_source", explanation: "Composition is not stated." })])]
    })
  });
  assert.equal(result.review_routing.route, "client_clarification");
  assert.equal(result.evidence_gate.final.items[0].fields.find((f) => f.field === "material").status, "source_missing");
  assert.equal(prepareInitialClientCompletion({ result }).clientItems.length, 1);
});
test("absence in one of two source units cannot become a customer missing-data question", () => {
  const draft = data(),
    ctx = context();
  ctx.units.push({ id: 2, text: "Details" });
  const plan = { item_indices: [0], source_units: [1, 2], full_source_search: true, risk_codes: [] };
  const result = mergeRiskReviewReplies(draft, {
    context: ctx,
    plan,
    failures: [],
    replies: [
      {
        ids: [1, 2],
        source: { units: ctx.units },
        reply: { issues: [], items: [patch([record("material", "", { status: "not_in_source" })])] }
      }
    ]
  });
  assert.equal(result.items[0].confirmed_source_gaps.length, 0);
});
test("positive evidence on another page overrides an absence observation", () => {
  const draft = data(),
    ctx = context();
  ctx.units.push({ id: 2, text });
  const result = mergeRiskReviewReplies(draft, {
    context: ctx,
    plan: { item_indices: [0], source_units: [1, 2], full_source_search: true, risk_codes: [] },
    failures: [],
    replies: [
      {
        ids: [1, 2],
        source: { units: ctx.units },
        reply: {
          issues: [],
          items: [
            patch([
              record("material", "", { status: "not_in_source" }),
              record("material", "Oak + Fabric", { source_page: 2 })
            ])
          ]
        }
      }
    ]
  });
  assert.equal(result.items[0].confirmed_source_gaps.length, 0);
});
test("visual evidence requires a supplied image, not just a fabricated page and bbox", async () => {
  const draft = data();
  draft.items[0].material_en = "To confirm";
  const result = await runRiskBasedReview({
    result: draft,
    context: context("docx"),
    readReviewUnits: async () => ({ units: context("docx").units, sourceMedia: null }),
    reviewBatch: async () => ({
      reviewed_pages: [1],
      issues: [],
      items: [patch([record("material", "Steel", { source_kind: "visual", bbox: box })])]
    })
  });
  assert.equal(result.review_routing.route, "internal_review");
  assert.equal(result.items[0].material_en, "To confirm");
});
test("conflicting evidence is retained internally instead of overwriting a known value", async () => {
  const draft = data();
  draft.items[0].confidence = 0.5;
  const ctx = context();
  ctx.units[0].text += " Qty: 25";
  const result = await runRiskBasedReview({
    result: draft,
    context: ctx,
    readReviewUnits: sourceReader(ctx),
    reviewBatch: async () => ({
      reviewed_pages: [1],
      issues: [],
      items: [patch([record("quantity", "25", { quote: "Qty: 25" })])]
    })
  });
  assert.equal(result.items[0].quantity, 20);
  assert.equal(result.review_routing.route, "internal_review");
});
test("post-review storage/crop failures cannot inherit the prior pass", async () => {
  const result = await runRiskBasedReview({
    result: data(),
    context: context(),
    readReviewUnits: sourceReader(context()),
    attachImages: async (r) => ({
      ...r,
      items: r.items.map((i) => ({ ...i, image_storage_path: "", image_mapping_status: "crop_failed" }))
    })
  });
  assert.equal(result.review_routing.route, "internal_review");
});
test("summary reconciliation is not waived just because an AI reply completed", async () => {
  const ctx = context();
  ctx.units[0].text += " Summary per apartment";
  const result = await runRiskBasedReview({
    result: data(),
    context: ctx,
    readReviewUnits: sourceReader(ctx),
    reviewBatch: async () => ({ reviewed_pages: [1], issues: [], items: [patch()] })
  });
  assert.ok(result.evidence_gate.final.unresolved_risks.some((r) => r.code === "quantity_rollup"));
  assert.equal(result.review_routing.route, "internal_review");
});
test("review source retains all PDF page identities and renders only the requested units", async () => {
  const calls = [];
  const reader = {
    totalPages: 3,
    readPages: async () => ({ sourceText: `SOURCE PAGE 2\n${text}` }),
    renderPages: async (ids) => {
      calls.push(ids);
      return { pages: ids.map((id) => ({ pageNumber: id, width: 2400, dataBase64: "png" })) };
    }
  };
  const source = await createReviewSource({ source: { sourceKind: "pdf" }, reader });
  assert.deepEqual(
    source.context.units.map((u) => u.id),
    [1, 2, 3]
  );
  const review = await source.readReviewUnits([2]);
  assert.deepEqual(calls, [[2]]);
  assert.equal(review.units[0].id, 2);
});

test("text-only review cannot claim that a Word document contains no product images", async () => {
  const draft = data();
  delete draft.items[0].image_storage_path;
  const ctx = context("docx");
  const result = await runRiskBasedReview({
    result: draft,
    context: ctx,
    readReviewUnits: async () => ({ units: ctx.units, sourceMedia: null }),
    reviewBatch: async () => ({
      reviewed_pages: [1],
      issues: [],
      items: [patch([record("image", "", { status: "not_in_source" })])]
    })
  });
  assert.equal(result.review_routing.route, "internal_review");
  assert.equal(result.items[0].confirmed_source_gaps.length, 0);
});
test("a completed AI reply does not waive an image that remains too small", async () => {
  const draft = data();
  draft.items[0].image_width = 40;
  draft.items[0].image_height = 30;
  const ctx = context();
  const result = await runRiskBasedReview({
    result: draft,
    context: ctx,
    readReviewUnits: sourceReader(ctx),
    reviewBatch: async () => ({ reviewed_pages: [1], issues: [], items: [patch()] })
  });
  assert.equal(result.review_routing.route, "internal_review");
  assert.ok(result.evidence_gate.final.unresolved_risks.some((r) => r.code === "small_product_image"));
});

test("confirmed item gaps do not silently discard unrelated project clarification proposals", async () => {
  const draft = data();
  draft.items[0].material_en = "To confirm";
  draft.items[0].field_evidence = draft.items[0].field_evidence.filter((e) => e.field !== "material");
  draft.questions = ["Please confirm the delivery address."];
  const ctx = context();
  ctx.units[0].text = text.replace("Material: Oak + Fabric. ", "");
  draft.items[0].field_evidence.forEach((e) => (e.quote = ctx.units[0].text));
  const result = await runRiskBasedReview({
    result: draft,
    context: ctx,
    readReviewUnits: sourceReader(ctx),
    reviewBatch: async () => ({
      reviewed_pages: [1],
      issues: [],
      items: [patch([record("material", "", { status: "not_in_source" })])]
    })
  });
  assert.equal(result.review_routing.route, "internal_review");
  assert.deepEqual(result.review_routing.proposed_client_questions, draft.questions);
  assert.equal(prepareInitialClientCompletion({ result }).clientItems.length, 0);
});
