const clampStage = (value) => Math.min(17, Math.max(1, Number(value) || 1));

const parseStage = (value) => {
  const match = String(value ?? "").match(/(\d{1,2})/);
  return match ? clampStage(match[1]) : 0;
};

const rows = (value) => (Array.isArray(value) ? value : []);

const rowTimestamp = (row = {}) =>
  Date.parse(row.reported_at || row.updated_at || row.created_at || row.generated_at || row.uploaded_at || "") || 0;

const latestRow = (items = []) => [...items].sort((a, b) => rowTimestamp(b) - rowTimestamp(a))[0] || null;

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const hasStatus = (value, accepted) => accepted.includes(normalizeStatus(value));

const riskRank = { low: 1, medium: 2, high: 3, critical: 4 };

const getHighestRisk = (updates) =>
  updates.reduce((highest, update) => {
    const risk = normalizeStatus(update.risk_level || update.riskLevel) || "low";
    return (riskRank[risk] || 0) > (riskRank[highest] || 0) ? risk : highest;
  }, "low");

const deriveProductionSummary = (updates = []) => {
  const normalized = rows(updates);
  const latest = latestRow(normalized);
  const progressValues = normalized.map((update) =>
    Math.min(100, Math.max(0, Number(update.progress_percent ?? update.progressPercent) || 0))
  );
  const completedCount = normalized.filter(
    (update, index) =>
      progressValues[index] >= 100 ||
      hasStatus(update.status, ["completed", "approved", "released", "done", "quality_passed"])
  ).length;
  const pendingReviewCount = normalized.filter((update) =>
    hasStatus(update.status, ["pending_review", "awaiting_review", "ready_for_review"])
  ).length;
  const revisionRequiredCount = normalized.filter((update) =>
    hasStatus(update.status, ["plan_revision_required", "revision_required", "changes_required"])
  ).length;

  return {
    updateCount: normalized.length,
    completedCount,
    pendingReviewCount,
    revisionRequiredCount,
    averageProgressPercent: normalized.length
      ? Math.round(progressValues.reduce((total, value) => total + value, 0) / normalized.length)
      : 0,
    maxProgressPercent: progressValues.length ? Math.max(...progressValues) : 0,
    latestProcess: String(latest?.process_name || latest?.processName || latest?.item_name || ""),
    latestStatus: String(latest?.status || ""),
    latestReportedAt: latest
      ? latest.reported_at || latest.updated_at || latest.created_at || latest.generated_at || null
      : null,
    riskLevel: getHighestRisk(normalized)
  };
};

const phaseForStage = (stageNumber) => {
  if (stageNumber >= 16) return "handover";
  if (stageNumber >= 12) return "shipping";
  if (stageNumber >= 11) return "quality";
  if (stageNumber >= 9) return "production";
  if (stageNumber >= 6) return "sourcing";
  return "intake";
};

const statusForStage = (stageNumber) => {
  if (stageNumber >= 17) return "archived";
  if (stageNumber >= 16) return "handover";
  if (stageNumber >= 14) return "shipping";
  if (stageNumber >= 12) return "preparing_shipment";
  if (stageNumber >= 11) return "quality_check";
  if (stageNumber >= 9) return "in_production";
  if (stageNumber >= 8) return "supplier_selected";
  if (stageNumber >= 7) return "quote_comparison";
  if (stageNumber >= 6) return "rfq";
  if (stageNumber >= 3) return "specification";
  return "intake";
};

const customerStepForStage = (stageNumber) => {
  if (stageNumber >= 14) return 4;
  if (stageNumber >= 11) return 3;
  if (stageNumber >= 9) return 2;
  if (stageNumber >= 3) return 1;
  return 0;
};

export const deriveProjectLifecycle = (job = {}) => {
  const progress = job.clientProgress || job.client_progress || {};
  const productionUpdates = rows(progress.productionUpdates || progress.production_updates);
  const inspections = rows(progress.inspections || progress.inspectionReports || progress.inspection_reports);
  const packingPlans = rows(progress.packingPlans || progress.packing_plans);
  const shipmentDocuments = rows(progress.shipmentDocuments || progress.shipment_documents);
  const shipments = rows(progress.shipments);
  const handovers = rows(progress.handovers || progress.handoverReports || progress.handover_reports);
  const archiveFiles = rows(progress.archiveFiles || progress.archive_files);
  const workflowEvents = rows(progress.workflowEvents || progress.workflow_events);
  const explicitStage = parseStage(job.currentStage ?? job.current_stage);
  const eventStage = workflowEvents.reduce(
    (highest, event) => Math.max(highest, parseStage(event.stage_id || event.to_stage || event.stage)),
    0
  );

  let inferredStage = (job.items || []).length ? 3 : 1;
  const reviewStatus = normalizeStatus(job.reviewStatus || job.review_status);
  const rfqStatus = normalizeStatus(job.rfqStatus || job.rfq_status);
  const status = normalizeStatus(job.status);

  if (reviewStatus === "revision_requested") inferredStage = Math.max(inferredStage, 2);
  if (["approved", "rfq_ready"].includes(reviewStatus)) inferredStage = Math.max(inferredStage, 6);
  if (["draft", "ready", "sent"].includes(rfqStatus)) inferredStage = Math.max(inferredStage, 6);
  if (["priced", "received", "completed", "analyzed"].includes(rfqStatus)) inferredStage = Math.max(inferredStage, 7);
  if (["supplier_selected", "awarded"].includes(rfqStatus)) inferredStage = Math.max(inferredStage, 8);
  if (["in_production", "production", "manufacturing", "packing"].includes(status)) inferredStage = 9;
  if (productionUpdates.length) inferredStage = Math.max(inferredStage, 9);
  if (inspections.length) inferredStage = Math.max(inferredStage, 11);
  if (packingPlans.length) inferredStage = Math.max(inferredStage, 12);
  if (shipmentDocuments.length) inferredStage = Math.max(inferredStage, 13);
  if (shipments.length) inferredStage = Math.max(inferredStage, 14);
  if (handovers.length || status === "delivered") inferredStage = Math.max(inferredStage, 16);
  if (archiveFiles.length || status === "archived") inferredStage = 17;

  const stageNumber = clampStage(Math.max(explicitStage, eventStage, inferredStage));
  const source =
    explicitStage === stageNumber
      ? "projects.current_stage"
      : eventStage === stageNumber
        ? "workflow_events"
        : stageNumber >= 16 && handovers.length
          ? "handover_reports"
          : stageNumber >= 14 && shipments.length
            ? "shipments"
            : stageNumber >= 12 && packingPlans.length
              ? "packing_plans"
              : stageNumber >= 11 && inspections.length
                ? "inspection_reports"
                : stageNumber >= 9 && productionUpdates.length
                  ? "production_updates"
                  : "intake_history";

  return {
    stageNumber,
    stageId: `S${String(stageNumber).padStart(2, "0")}`,
    phase: phaseForStage(stageNumber),
    status: statusForStage(stageNumber),
    customerStep: customerStepForStage(stageNumber),
    source,
    production: deriveProductionSummary(productionUpdates),
    lastEvent: latestRow(workflowEvents)
      ? {
          stageId: String(latestRow(workflowEvents).stage_id || latestRow(workflowEvents).to_stage || ""),
          type: String(latestRow(workflowEvents).event_type || ""),
          createdAt: latestRow(workflowEvents).created_at || null
        }
      : null
  };
};

export const mergeProjectJobSources = (primaryJobs = [], fallbackJobs = []) => {
  const merged = new Map();
  [...rows(primaryJobs), ...rows(fallbackJobs)].forEach((job, index) => {
    const key =
      job?.id ||
      `${job?.project_id || job?.projectId || job?.project_name || job?.projectName || "project"}-${job?.created_at || job?.createdAt || index}`;
    if (!merged.has(String(key))) merged.set(String(key), job);
  });
  return Array.from(merged.values());
};
