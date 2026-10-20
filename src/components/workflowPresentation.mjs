// Presentation summaries only: these never approve, release or update records.
const rows = (data, key) => (Array.isArray(data?.[key]) ? data[key] : []);
const evidence = (task) => (Array.isArray(task?.evidence) ? task.evidence : []);

export function productionOverview(data) {
  const supplier = rows(data, "supplier_quotes").find((quote) => quote.status === "selected");
  const tasks = rows(data, "production_updates").filter(
    (task) => !supplier || task.supplier_id === supplier.supplier_id
  );
  const monitored = tasks.filter((task) => evidence(task).some((entry) => entry?.type === "cho_plan_approval"));
  const risks = monitored.filter((task) => ["medium", "high"].includes(task.risk_level));
  const inspections = rows(data, "inspection_reports");
  return {
    supplier,
    tasks,
    monitored,
    risks,
    inspections,
    progress: tasks.length
      ? Math.round(
          tasks.reduce((sum, task) => sum + Math.max(0, Math.min(100, Number(task.progress_percent) || 0)), 0) /
            tasks.length
        )
      : null,
    approvedInspections: inspections.filter((report) => report.status === "approved").length,
    suggestedView: risks.length ? "risks" : inspections.length ? "quality" : "production"
  };
}

export function shippingOverview(data) {
  const shipments = rows(data, "shipments");
  const latestShipment = [...shipments].sort((a, b) =>
    String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || ""))
  )[0];
  const documents = rows(data, "shipment_documents");
  const handovers = rows(data, "handover_reports");
  const hasAcceptedHandover = handovers.some((row) => ["accepted", "accepted_with_issues"].includes(row.status));
  return {
    shipments,
    latestShipment,
    documents,
    handovers,
    hasAcceptedHandover,
    checkedDocuments: documents.filter((row) => row.status === "passed").length,
    packingPlans: rows(data, "packing_plans"),
    archived: rows(data, "project_files").some((row) => row.stage_id === "S17"),
    suggestedView:
      handovers.length || latestShipment?.status === "delivered"
        ? "handover"
        : shipments.length
          ? "tracking"
          : "prepare"
  };
}
