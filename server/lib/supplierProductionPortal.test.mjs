import test from "node:test";
import assert from "node:assert/strict";
import { analyzeProductionTask, buildProjectProductionAnalysis, supplierIdentity } from "./supplierProductionPortal.mjs";

const plannedEvidence = {
  type: "ai_plan",
  required: ["Dated frame photos", "Key dimension measurements"]
};

test("accepts only users with an explicit supplier role and supplier binding", () => {
  assert.deepEqual(
    supplierIdentity({ id: "user-1", email: "factory@example.com", app_metadata: { role: "supplier", supplier_id: "s-1" } }),
    { userId: "user-1", email: "factory@example.com", supplierId: "s-1" }
  );
  assert.equal(supplierIdentity({ id: "user-2", app_metadata: { role: "supplier" } }), null);
  assert.equal(supplierIdentity({ id: "user-3", app_metadata: { role: "staff", supplier_id: "s-1" } }), null);
});

test("caps production confidence at evidence completeness and exposes missing proof", () => {
  const result = analyzeProductionTask(
    {
      progress_percent: 100,
      expected_at: "2026-08-20T00:00:00.000Z",
      reported_at: "2026-08-09T00:00:00.000Z",
      evidence: [
        plannedEvidence,
        {
          type: "supplier_upload",
          requirement: "Dated frame photos",
          sha256: "hash-a",
          uploaded_at: "2026-08-09T00:00:00.000Z"
        }
      ]
    },
    { now: "2026-08-10T00:00:00.000Z" }
  );
  assert.equal(result.evidenceCoveragePercent, 50);
  assert.deepEqual(result.missingEvidence, ["Key dimension measurements"]);
  assert.equal(result.readyForReview, false);
  assert.equal(result.controllerStatus, "awaiting_supplier_evidence");
});

test("raises overdue missing evidence as a high production risk", () => {
  const result = analyzeProductionTask(
    {
      progress_percent: 70,
      expected_at: "2026-08-08T00:00:00.000Z",
      reported_at: "2026-08-07T00:00:00.000Z",
      evidence: [plannedEvidence]
    },
    { now: "2026-08-10T00:00:00.000Z" }
  );
  assert.equal(result.riskLevel, "high");
  assert.match(result.reasons.join(" "), /due date has passed/i);
  assert.match(result.reasons.join(" "), /evidence remains missing/i);
});

test("marks a complete evidence set ready for Cho rather than auto-approving it", () => {
  const result = analyzeProductionTask(
    {
      progress_percent: 100,
      expected_at: "2026-08-20T00:00:00.000Z",
      evidence: [
        plannedEvidence,
        { type: "supplier_upload", requirement: "Dated frame photos", sha256: "hash-a" },
        { type: "supplier_upload", requirement: "Key dimension measurements", sha256: "hash-b" }
      ]
    },
    { now: "2026-08-10T00:00:00.000Z" }
  );
  assert.equal(result.readyForReview, true);
  assert.equal(result.controllerStatus, "ready_for_cho_review");
  assert.equal(result.evidenceCoveragePercent, 100);
});

test("detects evidence reused across work packages", () => {
  const analysis = buildProjectProductionAnalysis(
    [
      {
        id: "task-1",
        progress_percent: 30,
        evidence: [plannedEvidence, { type: "supplier_upload", requirement: "Dated frame photos", sha256: "same" }]
      },
      {
        id: "task-2",
        progress_percent: 40,
        evidence: [plannedEvidence, { type: "supplier_upload", requirement: "Dated frame photos", sha256: "same" }]
      }
    ],
    { now: "2026-08-10T00:00:00.000Z" }
  );
  assert.equal(analysis.summary.duplicateEvidenceCount, 1);
  assert.equal(analysis.summary.highRiskCount, 2);
});
