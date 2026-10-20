import test from "node:test";
import assert from "node:assert/strict";
import { productionOverview, shippingOverview } from "./components/workflowPresentation.mjs";

test("production has no progress or risk assessment before work packages and approved baselines", () => {
  const empty = productionOverview({});
  assert.equal(empty.progress, null);
  assert.equal(empty.monitored.length, 0);
  const forecast = productionOverview({ production_updates: [{ risk_level: "high", progress_percent: 0, evidence: [{ type: "ai_plan" }] }] });
  assert.equal(forecast.risks.length, 0);
  assert.equal(forecast.suggestedView, "production");
});

test("production summary scopes progress and risks to the appointed supplier", () => {
  const model = productionOverview({
    supplier_quotes: [{ status: "selected", supplier_id: "selected" }],
    production_updates: [
      { supplier_id: "selected", progress_percent: 70, risk_level: "high", evidence: [{ type: "cho_plan_approval" }] },
      { supplier_id: "selected", progress_percent: 30, risk_level: "low", evidence: [{ type: "cho_plan_approval" }] },
      { supplier_id: "old", progress_percent: 100, risk_level: "high", evidence: [{ type: "cho_plan_approval" }] }
    ]
  });
  assert.equal(model.tasks.length, 2);
  assert.equal(model.progress, 50);
  assert.equal(model.risks.length, 1);
  assert.equal(model.suggestedView, "risks");
});

test("passing an inspection is distinct from Cho approval", () => {
  const model = productionOverview({ inspection_reports: [{ status: "passed" }, { status: "approved" }, { status: "failed" }] });
  assert.equal(model.approvedInspections, 1);
  assert.equal(model.suggestedView, "quality");
});

test("shipping counts recorded checks without asserting full export readiness", () => {
  const model = shippingOverview({ shipment_documents: [{ status: "passed" }, { status: "blocked" }] });
  assert.equal(model.checkedDocuments, 1);
  assert.equal(model.documents.length, 2);
  assert.equal(model.latestShipment, undefined);
  assert.equal(model.suggestedView, "prepare");
});

test("latest shipment and handover state remain accurate when records are unordered or rejected", () => {
  const model = shippingOverview({
    shipments: [{ created_at: "2026-01-01", status: "delivered" }, { created_at: "2026-10-20", status: "in_transit", eta: "2026-11-01" }],
    handover_reports: [{ status: "rejected" }]
  });
  assert.equal(model.latestShipment.status, "in_transit");
  assert.equal(model.hasAcceptedHandover, false);
  assert.equal(model.suggestedView, "handover");
  assert.equal(shippingOverview({ shipments: [{ status: "delivered" }] }).suggestedView, "handover");
});
