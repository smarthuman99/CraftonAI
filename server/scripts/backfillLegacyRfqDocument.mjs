import { createHash } from "node:crypto";
import { createRfqDraft } from "../lib/rfqGenerator.mjs";
import { enrichRfqContextFromSupabase } from "../lib/rfqSourceData.mjs";
import { createSupabaseAdmin } from "../lib/supabaseAdmin.mjs";

const projectId = process.argv.find((argument) => argument.startsWith("--project-id="))?.split("=")[1];
if (!projectId) throw new Error("Usage: node backfillLegacyRfqDocument.mjs --project-id=<uuid>");

const supabase = createSupabaseAdmin();
const [
  { data: project, error: projectError },
  { data: batches, error: batchError },
  { data: suppliers, error: supplierError }
] = await Promise.all([
  supabase.from("projects").select("*").eq("id", projectId).single(),
  supabase.from("rfq_batches").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
  supabase.from("suppliers").select("*").eq("is_active", true).order("rating", { ascending: false })
]);

if (projectError) throw projectError;
if (batchError) throw batchError;
if (supplierError) throw supplierError;

const batch = (batches || []).find((row) => !row.payload?.document);
if (!batch) {
  console.log(`No legacy RFQ batch needs upgrading for ${project.name}.`);
  process.exit(0);
}

const context = await enrichRfqContextFromSupabase({
  supabase,
  context: {
    project: {
      id: project.id,
      projectName: project.name,
      clientName: project.client_name,
      destination: project.client_contact,
      currency: batch.currency || "USD",
      dueAt: batch.due_at,
      notes: batch.notes
    }
  }
});
const result = await createRfqDraft({ context });

const requirement = result.document.items
  .flatMap((item) => [item.nameEn, item.nameCn, item.materialEn, item.materialCn])
  .filter(Boolean)
  .join(" ")
  .toLowerCase();
const rankedSuppliers = (suppliers || [])
  .filter((supplier) => supplier.email || supplier.contact_email)
  .map((supplier) => {
    const tags = [supplier.category, ...(supplier.categories || []), ...(supplier.capabilities || [])]
      .filter(Boolean)
      .map((tag) => String(tag).toLowerCase());
    return {
      supplier,
      score: tags.reduce(
        (sum, tag) =>
          sum + (requirement.includes(tag) || (tag.includes("sofa") && requirement.includes("sofa")) ? 1 : 0),
        0
      )
    };
  })
  .sort((a, b) => b.score - a.score || Number(b.supplier.rating || 0) - Number(a.supplier.rating || 0));
const matchedSuppliers = rankedSuppliers.filter((row) => row.score > 0);
const supplierIds = batch.supplier_ids?.length
  ? batch.supplier_ids
  : (matchedSuppliers.length ? matchedSuppliers : rankedSuppliers).slice(0, 3).map((row) => row.supplier.id);
const dueAt = batch.due_at || new Date(Date.now() + 7 * 86400000).toISOString();
const version = 1;
const payload = {
  ...(batch.payload || {}),
  document: result.document,
  generation: result.generation,
  document_pending: false,
  schema_version: 2,
  version,
  status: "draft",
  source: {
    project_id: project.id,
    intake_job_ids: context.intake?.intake_job_ids || [],
    specification_ids: context.specifications?.map((row) => row.id).filter(Boolean) || []
  }
};

const { error: updateError } = await supabase
  .from("rfq_batches")
  .update({
    title: batch.title || result.document.titleEn,
    status: "draft",
    supplier_ids: supplierIds,
    supplier_count: supplierIds.length,
    invited_count: supplierIds.length,
    due_at: dueAt,
    payload
  })
  .eq("id", batch.id);
if (updateError) throw updateError;

const record = { ...payload, rfq_batch_id: batch.id, rfq_code: batch.rfq_code, version };
const hash = createHash("sha256").update(JSON.stringify(record)).digest("hex");
const { error: fileError } = await supabase.from("project_files").insert({
  project_id: project.id,
  stage_id: "S06",
  file_group: "rfq_document",
  file_name: `${batch.rfq_code}-v${version}.json`,
  sha256: hash,
  audit_hash: hash,
  payload: record
});
if (fileError) throw fileError;

const { error: eventError } = await supabase.from("workflow_events").insert({
  project_id: project.id,
  stage_id: "S06",
  event_type: "legacy_rfq_document_upgraded",
  actor: "Crafton AI",
  message_cn: `${batch.rfq_code} 已升级为完整双语询盘文件。`,
  message_en: `${batch.rfq_code} upgraded to a complete bilingual RFQ document.`,
  payload: { rfq_batch_id: batch.id, version, sha256: hash, supplier_ids: supplierIds }
});
if (eventError) throw eventError;

console.log(
  JSON.stringify({
    project: project.name,
    projectId: project.id,
    rfqCode: batch.rfq_code,
    items: result.document.items.length,
    suggestedSuppliers: supplierIds.length,
    generationMethod: result.generation.method
  })
);
