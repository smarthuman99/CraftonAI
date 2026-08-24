import { createSupabaseAdmin } from "../lib/supabaseAdmin.mjs";
import { refreshTechnicalDrawingPng } from "../lib/technicalDrawing.mjs";

const supabase = createSupabaseAdmin();
const projectNameFilter = String(process.argv.find((value) => value.startsWith("--project=")) || "")
  .slice("--project=".length)
  .trim()
  .toLowerCase();
const dryRun = process.argv.includes("--dry-run");

const { data: jobs, error } = await supabase
  .from("intake_jobs")
  .select("id,project_id,project_name,result_json")
  .in("status", ["needs_review", "completed"])
  .order("created_at", { ascending: false });
if (error) throw error;

let updatedJobs = 0;
let updatedDrawings = 0;
let refreshedAssets = 0;

for (const job of jobs || []) {
  const result = job.result_json && typeof job.result_json === "object" ? job.result_json : {};
  const projectName = String(job.project_name || result.project?.name || "");
  if (projectNameFilter && !projectName.toLowerCase().includes(projectNameFilter)) continue;
  const items = Array.isArray(result.items) ? [...result.items] : [];
  let changed = false;

  for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
    const item = items[itemIndex];
    const drawing = item?.technical_drawing;
    if (!drawing || !["system_generated", "formal", "ai_concept"].includes(drawing.status)) continue;
    const needsSemanticBackfill =
      drawing.status !== "ai_concept" ||
      drawing.drawing_kind !== "ai_concept" ||
      drawing.lifecycle_stage !== "concept_reference" ||
      drawing.review_status !== "reference_only" ||
      drawing.current_revision !== "R00" ||
      !Array.isArray(drawing.revisions);
    if (!needsSemanticBackfill) continue;

    const conceptPath = drawing.draft_storage_path || drawing.drawing_storage_path;
    const generatedAt = drawing.generated_at || new Date().toISOString();
    const existingRevisions = Array.isArray(drawing.revisions) ? drawing.revisions : [];
    const revisions = existingRevisions.some((revision) => revision?.kind === "ai_concept")
      ? existingRevisions
      : [
          {
            revision: "R00",
            kind: "ai_concept",
            source: "ai",
            review_status: "reference_only",
            storage_bucket: drawing.storage_bucket || "intake-files",
            storage_path: conceptPath,
            created_at: generatedAt
          },
          ...existingRevisions
        ];
    items[itemIndex] = {
      ...item,
      technical_drawing: {
        ...drawing,
        status: "ai_concept",
        drawing_kind: "ai_concept",
        lifecycle_stage: "concept_reference",
        review_status: "reference_only",
        current_revision: "R00",
        drawing_storage_path: conceptPath,
        revisions,
        legacy_ai_confirmation:
          drawing.status === "formal"
            ? {
                approved_by: drawing.approved_by || "",
                approved_by_id: drawing.approved_by_id || null,
                approved_at: drawing.approved_at || null,
                superseded_reason: "AI geometry is reference-only under the supplier shop-drawing workflow."
              }
            : drawing.legacy_ai_confirmation || null
      }
    };
    changed = true;
    updatedDrawings += 1;

    if (!dryRun) {
      const storagePaths = Array.from(
        new Set([drawing.drawing_storage_path, drawing.draft_storage_path, drawing.formal_storage_path].filter(Boolean))
      );
      for (const storagePath of storagePaths) {
        const bucket = drawing.storage_bucket || "intake-files";
        const { data: source, error: downloadError } = await supabase.storage.from(bucket).download(storagePath);
        if (downloadError || !source) {
          console.warn(`Could not refresh ${storagePath}: ${downloadError?.message || "missing asset"}`);
          continue;
        }
        const refreshed = await refreshTechnicalDrawingPng(Buffer.from(await source.arrayBuffer()), {
          item: items[itemIndex],
          job: { ...job, result_json: { ...result, items } },
          itemIndex,
          formal: false
        });
        const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, refreshed, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: true
        });
        if (uploadError) console.warn(`Could not save refreshed ${storagePath}: ${uploadError.message}`);
        else refreshedAssets += 1;
      }
    }
  }

  if (changed) {
    updatedJobs += 1;
    if (!dryRun) {
      const { error: updateError } = await supabase
        .from("intake_jobs")
        .update({ result_json: { ...result, items }, updated_at: new Date().toISOString() })
        .eq("id", job.id);
      if (updateError) throw updateError;
    }
  }
}

console.log(JSON.stringify({ dryRun, projectNameFilter, updatedJobs, updatedDrawings, refreshedAssets }, null, 2));
