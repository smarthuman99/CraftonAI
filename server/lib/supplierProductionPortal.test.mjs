import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeProductionTask,
  buildProjectProductionAnalysis,
  productionCompletionState,
  productionEvidenceApprovalGate,
  productionEvidenceReviewState,
  productionPlanState,
  supplierIdentity,
  validateSupplierProductionPlan
} from "./supplierProductionPortal.mjs";

const plannedEvidence = {
  type: "ai_plan",
  required: ["Dated frame photos", "Key dimension measurements"]
};

const approvedPlanEvidence = [
  {
    type: "supplier_plan",
    version: 1,
    starts_at: "2026-08-01T00:00:00.000Z",
    expected_at: "2026-08-20T00:00:00.000Z"
  },
  { type: "ai_plan_review", version: 1, status: "ready_for_cho_review" },
  { type: "cho_plan_approval", version: 1, approved_at: "2026-08-02T00:00:00.000Z" }
];

test("accepts only users with an explicit supplier role and supplier binding", () => {
  assert.deepEqual(
    supplierIdentity({
      id: "user-1",
      email: "factory@example.com",
      app_metadata: { role: "supplier", supplier_id: "s-1" }
    }),
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
        ...approvedPlanEvidence,
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
      evidence: [plannedEvidence, ...approvedPlanEvidence]
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
        ...approvedPlanEvidence,
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

test("treats a current Cho approval as the completed production gate", () => {
  const task = {
    progress_percent: 100,
    expected_at: "2026-08-20T00:00:00.000Z",
    evidence: [
      plannedEvidence,
      ...approvedPlanEvidence,
      {
        type: "supplier_upload",
        requirement: "Dated frame photos",
        sha256: "hash-a",
        uploaded_at: "2026-08-09T09:00:00.000Z"
      },
      {
        type: "supplier_upload",
        requirement: "Key dimension measurements",
        sha256: "hash-b",
        uploaded_at: "2026-08-09T09:05:00.000Z"
      },
      {
        type: "cho_evidence_review",
        decision: "approved",
        reviewed_at: "2026-08-09T10:00:00.000Z"
      }
    ]
  };
  const result = analyzeProductionTask(task, { now: "2026-08-10T00:00:00.000Z" });
  assert.equal(result.readyForReview, false);
  assert.equal(result.completionReview.status, "approved");
  assert.equal(result.controllerStatus, "completed");
});

test("keeps a rejection active until the supplier uploads newer evidence", () => {
  const evidence = [
    plannedEvidence,
    ...approvedPlanEvidence,
    {
      type: "supplier_upload",
      requirement: "Dated frame photos",
      sha256: "hash-a",
      uploaded_at: "2026-08-09T09:00:00.000Z"
    },
    {
      type: "supplier_upload",
      requirement: "Key dimension measurements",
      sha256: "hash-b",
      uploaded_at: "2026-08-09T09:05:00.000Z"
    },
    {
      type: "cho_evidence_review",
      decision: "changes_required",
      note: "Replace the blurred frame photo.",
      reviewed_at: "2026-08-09T10:00:00.000Z"
    }
  ];
  const rejected = analyzeProductionTask(
    { progress_percent: 100, expected_at: "2026-08-20T00:00:00.000Z", evidence },
    { now: "2026-08-10T00:00:00.000Z" }
  );
  assert.equal(rejected.completionReview.status, "changes_required");
  assert.equal(rejected.controllerStatus, "evidence_changes_required");
  assert.equal(rejected.riskLevel, "medium");

  const correctedEvidence = [
    ...evidence,
    {
      type: "supplier_upload",
      requirement: "Dated frame photos",
      sha256: "hash-c",
      uploaded_at: "2026-08-09T11:00:00.000Z"
    }
  ];
  const resubmitted = analyzeProductionTask(
    { progress_percent: 100, expected_at: "2026-08-20T00:00:00.000Z", evidence: correctedEvidence },
    { now: "2026-08-10T00:00:00.000Z" }
  );
  assert.equal(productionEvidenceReviewState({ evidence: correctedEvidence }).status, "pending");
  assert.equal(resubmitted.readyForReview, true);
  assert.equal(resubmitted.controllerStatus, "ready_for_cho_review");
});

test("releases production only when every work package has a current Cho approval", () => {
  const approved = (id) => ({
    id,
    process_name: id,
    evidence: [
      plannedEvidence,
      { type: "supplier_upload", uploaded_at: "2026-08-09T09:00:00.000Z" },
      { type: "cho_evidence_review", decision: "approved", reviewed_at: "2026-08-09T10:00:00.000Z" }
    ]
  });
  assert.deepEqual(productionCompletionState([approved("frame_production"), approved("assembly")]), {
    taskCount: 2,
    approvedCount: 2,
    changesRequiredCount: 0,
    allApproved: true
  });
  const reopened = approved("assembly");
  reopened.evidence.push({ type: "supplier_upload", uploaded_at: "2026-08-09T11:00:00.000Z" });
  assert.equal(productionCompletionState([approved("frame_production"), reopened]).allApproved, false);
});

test("allows evidence approval before schedule baseline approval when evidence itself is complete", () => {
  const analysis = analyzeProductionTask(
    {
      progress_percent: 100,
      evidence: [
        plannedEvidence,
        { type: "supplier_upload", requirement: "Dated frame photos", sha256: "hash-a" },
        { type: "supplier_upload", requirement: "Key dimension measurements", sha256: "hash-b" }
      ]
    },
    { now: "2026-08-10T00:00:00.000Z" }
  );
  assert.equal(analysis.productionPlan.hasApprovedBaseline, false);
  assert.deepEqual(productionEvidenceApprovalGate(analysis), {
    allowed: true,
    blockers: [],
    requiresRiskAcknowledgement: false,
    riskLevel: "low",
    riskReasons: []
  });
});

test("requires an explicit Cho acknowledgement and note to approve duplicate evidence risk", () => {
  const analysis = analyzeProductionTask(
    {
      progress_percent: 100,
      evidence: [
        plannedEvidence,
        ...approvedPlanEvidence,
        { type: "supplier_upload", requirement: "Dated frame photos", sha256: "duplicate" },
        { type: "supplier_upload", requirement: "Key dimension measurements", sha256: "hash-b" }
      ]
    },
    { now: "2026-08-10T00:00:00.000Z", duplicateHashes: ["duplicate"] }
  );
  const blocked = productionEvidenceApprovalGate(analysis);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.requiresRiskAcknowledgement, true);
  assert.match(blocked.blockers.join(" "), /acknowledge/i);
  assert.match(blocked.blockers.join(" "), /review note/i);

  const approved = productionEvidenceApprovalGate(analysis, {
    acknowledgeRisk: true,
    note: "The same dated wide shot legitimately proves both adjacent production stages."
  });
  assert.equal(approved.allowed, true);
  assert.deepEqual(approved.blockers, []);

  const acknowledged = analyzeProductionTask(
    {
      progress_percent: 100,
      evidence: [
        plannedEvidence,
        ...approvedPlanEvidence,
        {
          type: "supplier_upload",
          requirement: "Dated frame photos",
          sha256: "duplicate",
          uploaded_at: "2026-08-09T09:00:00.000Z"
        },
        {
          type: "supplier_upload",
          requirement: "Key dimension measurements",
          sha256: "hash-b",
          uploaded_at: "2026-08-09T09:05:00.000Z"
        },
        {
          type: "cho_evidence_review",
          decision: "approved",
          risk_acknowledged: true,
          reviewed_at: "2026-08-09T10:00:00.000Z"
        }
      ]
    },
    { now: "2026-08-10T00:00:00.000Z", duplicateHashes: ["duplicate"] }
  );
  assert.equal(acknowledged.riskLevel, "low");
  assert.equal(acknowledged.controllerStatus, "completed");
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

test("does not raise overdue risk from an AI forecast before Cho approves the supplier baseline", () => {
  const result = analyzeProductionTask(
    {
      progress_percent: 0,
      expected_at: "2026-08-01T00:00:00.000Z",
      evidence: [
        plannedEvidence,
        {
          type: "supplier_plan",
          version: 1,
          starts_at: "2026-08-01T00:00:00.000Z",
          expected_at: "2026-08-08T00:00:00.000Z"
        },
        { type: "ai_plan_review", version: 1, status: "ready_for_cho_review" }
      ]
    },
    { now: "2026-08-10T00:00:00.000Z" }
  );
  assert.equal(result.riskLevel, "low");
  assert.equal(result.productionPlan.hasApprovedBaseline, false);
  assert.equal(result.controllerStatus, "awaiting_cho_plan_approval");
});

test("accepts and measures supplier photo evidence before the production baseline is approved", () => {
  const result = analyzeProductionTask(
    {
      progress_percent: 35,
      expected_at: "2026-08-01T00:00:00.000Z",
      evidence: [
        plannedEvidence,
        {
          type: "supplier_upload",
          requirement: "Dated frame photos",
          sha256: "early-photo",
          uploaded_at: "2026-08-09T00:00:00.000Z"
        }
      ]
    },
    { now: "2026-08-10T00:00:00.000Z" }
  );
  assert.equal(result.evidenceCoveragePercent, 50);
  assert.equal(result.supplierReportedProgressPercent, 35);
  assert.equal(result.riskLevel, "low");
  assert.equal(result.controllerStatus, "awaiting_supplier_plan");
});

test("validates a complete supplier factory schedule for Cho review", () => {
  const tasks = [
    { id: "task-material", process_name: "material_procurement" },
    { id: "task-frame", process_name: "frame_production" }
  ];
  const review = validateSupplierProductionPlan({
    tasks,
    planTasks: [
      {
        productionUpdateId: "task-material",
        startsAt: "2026-08-11T00:00:00.000Z",
        expectedAt: "2026-08-14T00:00:00.000Z",
        materialReadyAt: "2026-08-10T00:00:00.000Z",
        capacitySlot: "Line A",
        updateFrequency: "daily"
      },
      {
        productionUpdateId: "task-frame",
        startsAt: "2026-08-14T00:00:00.000Z",
        expectedAt: "2026-08-20T00:00:00.000Z",
        capacitySlot: "Line B",
        updateFrequency: "twice_weekly"
      }
    ],
    project: { desired_delivery_date: "2026-09-10T00:00:00.000Z" },
    quote: { lead_time_days: 20 },
    version: 1
  });
  assert.equal(review.status, "ready_for_cho_review");
  assert.equal(review.finalCompletion, "2026-08-20T00:00:00.000Z");
  assert.equal(review.issues.length, 0);
});

test("requires missing dates and a reason for revised supplier schedules", () => {
  const review = validateSupplierProductionPlan({
    tasks: [{ id: "task-material", process_name: "material_procurement" }],
    planTasks: [{ productionUpdateId: "task-material", capacitySlot: "Line A", updateFrequency: "daily" }],
    project: { desired_delivery_date: "2026-09-10T00:00:00.000Z" },
    version: 2
  });
  assert.equal(review.status, "changes_required");
  assert.ok(review.issues.some((issue) => issue.code === "missing_start"));
  assert.ok(review.issues.some((issue) => issue.code === "revision_reason_missing"));
});

test("keeps a prior approved baseline active while a validated revision awaits Cho", () => {
  const tasks = ["task-1", "task-2"].map((id) => ({
    id,
    evidence: [
      ...approvedPlanEvidence,
      {
        type: "supplier_plan",
        version: 2,
        starts_at: "2026-08-15T00:00:00.000Z",
        expected_at: "2026-08-25T00:00:00.000Z"
      },
      { type: "ai_plan_review", version: 2, status: "ready_for_cho_review" }
    ]
  }));
  assert.deepEqual(productionPlanState(tasks), {
    status: "revision_pending_cho",
    version: 2,
    approvedVersion: 1
  });
});

test("ignores legacy manual production notes when determining the supplier schedule gate", () => {
  const frameworkTask = {
    id: "task-frame",
    process_name: "frame_production",
    evidence: [plannedEvidence, ...approvedPlanEvidence]
  };
  const legacyManualNote = {
    id: "legacy-note",
    process_name: "Factory follow-up note",
    evidence: [{ type: "manual_override", created_at: "2026-08-09T00:00:00.000Z" }]
  };
  assert.deepEqual(productionPlanState([frameworkTask, legacyManualNote]), {
    status: "approved",
    version: 1,
    approvedVersion: 1
  });
});
