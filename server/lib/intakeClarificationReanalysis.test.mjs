import assert from "node:assert/strict";
import test from "node:test";

import {
  applyClarificationAnalysis,
  normalizeClarificationRequest,
  validateUpdatedDraft
} from "./intakeClarificationReanalysis.mjs";

const baseResult = () => ({
  project: {
    name: "Portal Outdoor Amenity",
    client_name: "Fossey Arora",
    destination: "London",
    delivery_address: "To confirm",
    desired_delivery_date: "To confirm"
  },
  items: [
    {
      id: "ITEM-SOFA",
      sku: "CRF-SOFA-01",
      item_type_en: "Outdoor Sofa",
      quantity: 4,
      dimensions_text: "2000mm x 860mm x 730mm",
      material_en: "Hand-woven rattan",
      finish: "To confirm",
      technical_drawing: { status: "system_generated", drawing_storage_path: "drawings/sofa.png" }
    }
  ],
  questions: [
    "Please confirm the delivery address.",
    "Please confirm the target delivery date.",
    "Please confirm the finish for Outdoor Sofa."
  ],
  open_questions: [
    "Please confirm the delivery address.",
    "Please confirm the target delivery date.",
    "Please confirm the finish for Outdoor Sofa."
  ],
  clarification_request: {
    id: "CLR-1",
    status: "sent",
    questions: [
      "Please confirm the delivery address.",
      "Please confirm the target delivery date.",
      "Please confirm the finish for Outdoor Sofa."
    ],
    items: [
      { id: "Q1", question: "Please confirm the delivery address.", scope: "project" },
      { id: "Q2", question: "Please confirm the target delivery date.", scope: "project" },
      {
        id: "Q3",
        question: "Please confirm the finish for Outdoor Sofa.",
        scope: "item",
        item_id: "ITEM-SOFA",
        item_index: 0
      }
    ]
  }
});

test("applies client-supported patches, replaces resolved questions and preserves drawing metadata", () => {
  const result = baseResult();
  const request = normalizeClarificationRequest(result, { id: "JOB-1" });
  const answeredQuestions = request.items.map((item, index) => ({
    ...item,
    answer: ["Level 10 Terrace, 1 Portal Road, London", "2026-10-20", "Natural rattan, clear matte coat"][index]
  }));
  const applied = applyClarificationAnalysis({
    result,
    request,
    answeredQuestions,
    analyzedAt: "2026-08-22T10:00:00.000Z",
    modelResult: {
      project_patch: {
        delivery_address: "Level 10 Terrace, 1 Portal Road, London",
        desired_delivery_date: "2026-10-20"
      },
      item_patches: [{ item_index: 0, patch: { finish: "Natural rattan, clear matte coat" } }],
      resolved_question_ids: ["Q1", "Q2", "Q3"],
      remaining_questions: [],
      new_questions: [],
      change_summary: ["Delivery address, date and sofa finish confirmed."],
      confidence: 0.96
    }
  });

  assert.equal(applied.workflow.status, "ready_for_approval");
  assert.equal(applied.workflow.bom_draft_ready, true);
  assert.deepEqual(applied.questions, []);
  assert.equal(applied.result.project.desired_delivery_date, "2026-10-20");
  assert.equal(applied.result.items[0].finish, "Natural rattan, clear matte coat");
  assert.equal(applied.result.items[0].technical_drawing.drawing_storage_path, "drawings/sofa.png");
  assert.equal(applied.result.clarification_history.length, 1);
  assert.deepEqual(applied.result.clarification_history[0].applied_patch.project.desired_delivery_date, {
    from: "To confirm",
    to: "2026-10-20"
  });
});

test("keeps unanswered and ambiguous questions instead of approving automatically", () => {
  const result = baseResult();
  const request = normalizeClarificationRequest(result, { id: "JOB-1" });
  const answeredQuestions = request.items.map((item, index) => ({
    ...item,
    answer: index === 0 ? "Level 10 Terrace, London" : ""
  }));
  const applied = applyClarificationAnalysis({
    result,
    request,
    answeredQuestions,
    modelResult: {
      project_patch: { delivery_address: "Level 10 Terrace, London" },
      resolved_question_ids: ["Q1", "Q2"],
      remaining_questions: ["Please confirm the target delivery date."],
      new_questions: [],
      confidence: 0.7
    }
  });

  assert.equal(applied.workflow.status, "clarification_required");
  assert.equal(applied.workflow.resolved_question_count, 1);
  assert.equal(applied.workflow.continue_client_clarification, true);
  assert.deepEqual(applied.result.clarification_request.questions, [
    "Please confirm the target delivery date.",
    "Please confirm the finish for Outdoor Sofa."
  ]);
  assert.deepEqual(applied.result.client_answers, {});
  assert.ok(applied.questions.includes("Please confirm the target delivery date."));
  assert.ok(applied.questions.includes("Please confirm the finish for Outdoor Sofa."));
});

test("deterministic validation blocks incomplete structured fields", () => {
  assert.deepEqual(
    validateUpdatedDraft({
      project: { client_name: "Fossey Arora", destination: "London", desired_delivery_date: "2026-10-20" },
      items: [{ item_type_en: "Outdoor Bench", quantity: 0, dimensions_text: "To confirm", material_en: "Pending" }]
    }),
    [
      "Please confirm the quantity for Outdoor Bench.",
      "Please confirm the dimensions for Outdoor Bench.",
      "Please confirm the material for Outdoor Bench."
    ]
  );
});

test("does not resolve a question from a TBC-style answer even if the model requests it", () => {
  const result = baseResult();
  const request = normalizeClarificationRequest(result, { id: "JOB-1" });
  const answeredQuestions = request.items.map((item, index) => ({
    ...item,
    answer: index === 2 ? "TBC" : ""
  }));
  const applied = applyClarificationAnalysis({
    result,
    request,
    answeredQuestions,
    modelResult: { resolved_question_ids: ["Q3"], remaining_questions: [], confidence: 0.9 }
  });

  assert.equal(applied.workflow.resolved_question_count, 0);
  assert.ok(applied.questions.includes("Please confirm the finish for Outdoor Sofa."));
});
