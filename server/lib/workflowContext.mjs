export async function loadQuoteAnalysisContext({ supabase, projectId, rfqBatchId }) {
  if (!projectId) throw badRequest("A project ID is required.");

  const project = await one(supabase.from("projects").select("*").eq("id", projectId).maybeSingle(), "project");
  if (!project) throw notFound("Project not found.");

  let rfqQuery = supabase.from("rfq_batches").select("*").eq("project_id", projectId);
  rfqQuery = rfqBatchId
    ? rfqQuery.eq("id", rfqBatchId).maybeSingle()
    : rfqQuery.order("created_at", { ascending: false }).limit(1).maybeSingle();
  const rfq = await one(rfqQuery, "RFQ");
  if (!rfq) throw notFound("RFQ batch not found for this project.");

  const [quotes, suppliers] = await Promise.all([
    many(
      supabase.from("supplier_quotes").select("*").eq("project_id", projectId).eq("rfq_batch_id", rfq.id),
      "supplier quotes"
    ),
    many(supabase.from("suppliers").select("*"), "suppliers")
  ]);
  return { project, rfq, quotes, suppliers };
}

export async function loadOperationsContext({ supabase, projectId }) {
  if (!projectId) throw badRequest("A project ID is required.");
  const project = await one(supabase.from("projects").select("*").eq("id", projectId).maybeSingle(), "project");
  if (!project) throw notFound("Project not found.");

  const tableQueries = {
    rfqs: supabase.from("rfq_batches").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    quotes: supabase.from("supplier_quotes").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    suppliers: supabase.from("suppliers").select("*"),
    productionUpdates: supabase.from("production_updates").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    inspections: supabase.from("inspection_reports").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    packingPlans: supabase.from("packing_plans").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    shipmentDocuments: supabase.from("shipment_documents").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    shipments: supabase.from("shipments").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    handovers: supabase.from("handover_reports").select("*").eq("project_id", projectId).order("created_at", { ascending: false })
  };
  const entries = await Promise.all(
    Object.entries(tableQueries).map(async ([key, query]) => [key, await many(query, key)])
  );
  const data = Object.fromEntries(entries);
  return { project, ...data };
}

async function one(query, label) {
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load ${label}: ${error.message}`);
  return data;
}

async function many(query, label) {
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load ${label}: ${error.message}`);
  return data || [];
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}
