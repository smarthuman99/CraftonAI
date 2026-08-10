import assert from "node:assert/strict";
import test from "node:test";
import { deriveProjectLifecycle, mergeProjectJobSources } from "./projectLifecycle.js";

test("production lifecycle overrides historical RFQ draft status", () => {
  const lifecycle = deriveProjectLifecycle({
    currentStage: 9,
    reviewStatus: "rfq_ready",
    rfqStatus: "draft",
    clientProgress: {
      productionUpdates: [
        { process_name: "material_procurement", status: "pending_review", progress_percent: 100 },
        { process_name: "frame_production", status: "plan_revision_required", progress_percent: 0 }
      ]
    }
  });

  assert.equal(lifecycle.stageId, "S09");
  assert.equal(lifecycle.status, "in_production");
  assert.equal(lifecycle.customerStep, 2);
  assert.equal(lifecycle.production.pendingReviewCount, 1);
  assert.equal(lifecycle.production.revisionRequiredCount, 1);
  assert.equal(lifecycle.production.maxProgressPercent, 100);
});

test("verified downstream records can advance but never regress the project stage", () => {
  const lifecycle = deriveProjectLifecycle({
    currentStage: 9,
    clientProgress: {
      shipments: [{ id: "shipment-1", created_at: "2026-08-11T00:00:00Z" }]
    }
  });

  assert.equal(lifecycle.stageId, "S14");
  assert.equal(lifecycle.phase, "shipping");
  assert.equal(lifecycle.source, "shipments");
});

test("workflow events recover production status when an old intake row lacks current_stage", () => {
  const lifecycle = deriveProjectLifecycle({
    reviewStatus: "rfq_ready",
    rfqStatus: "draft",
    clientProgress: {
      workflowEvents: [{ stage_id: "S09", event_type: "production_work_package_framework_released" }]
    }
  });

  assert.equal(lifecycle.stageNumber, 9);
  assert.equal(lifecycle.source, "workflow_events");
});

test("live Supabase jobs take precedence over local fallback copies", () => {
  const live = { id: "terra-job", currentStage: 9, source: "supabase" };
  const stale = { id: "terra-job", currentStage: 0, source: "local" };
  const merged = mergeProjectJobSources([live], [stale]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0], live);
});
