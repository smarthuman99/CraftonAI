import test from "node:test";
import assert from "node:assert/strict";
import { prepareInitialClientCompletion } from "./intakeClientCompletion.mjs";

test("routes client-owned gaps directly into Client Completion", () => {
  const prepared = prepareInitialClientCompletion({
    jobId: "job-1",
    createdAt: "2026-08-22T10:00:00.000Z",
    result: {
      project: { name: "Terrace", client_name: "Fossey Arora", destination: "London" },
      items: [{ id: "sofa", item_type_en: "Outdoor Sofa", quantity: 4 }],
      questions: [
        "Please confirm the target delivery date.",
        "Please confirm the finish for Outdoor Sofa.",
        "Please provide unit pricing for each item."
      ]
    }
  });

  assert.equal(prepared.jobState.step, "client_completion");
  assert.equal(prepared.jobState.reviewStatus, "revision_requested");
  assert.equal(prepared.clientItems.length, 2);
  assert.equal(prepared.craftonTasks.length, 1);
  assert.equal(prepared.result.clarification_request.items[1].scope, "item");
  assert.equal(prepared.result.clarification_request.items[1].item_id, "sofa");
});

test("sends complete drafts directly to approval", () => {
  const prepared = prepareInitialClientCompletion({
    jobId: "job-2",
    result: {
      project: { name: "Terrace", client_name: "Fossey Arora", destination: "London" },
      items: [{ id: "sofa", item_type_en: "Outdoor Sofa", quantity: 4 }],
      questions: []
    }
  });

  assert.equal(prepared.readyForApproval, true);
  assert.equal(prepared.jobState.step, "ai_intake_ready_for_approval");
  assert.equal(prepared.result.clarification_workflow.status, "ready_for_approval");
});

test("keeps unreadable-file failures as admin exceptions", () => {
  const prepared = prepareInitialClientCompletion({
    jobId: "job-3",
    result: {
      items: [{ id: "item", item_type_en: "Custom Item", quantity: 1 }],
      questions: ["Automated image understanding was not completed. Cho must review the uploaded image manually."]
    }
  });

  assert.equal(prepared.clientItems.length, 0);
  assert.equal(prepared.adminExceptions.length, 1);
  assert.equal(prepared.jobState.step, "ai_intake_exception_review");
  assert.equal(prepared.readyForApproval, false);
});
