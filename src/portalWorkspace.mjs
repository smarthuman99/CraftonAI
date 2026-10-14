import { buildPortalOwnershipFilter, filterPortalJobsForOwner, getPortalJobOwnerId } from "./portalOwnership.js";
import { activeProjectJob } from "../shared/clientProjectEditing.mjs";

const object = (value) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) || {};
    } catch {
      return {};
    }
  }
  return value || {};
};
const progressTables = [
  ["production_updates", "productionUpdates"],
  ["inspection_reports", "inspections"],
  ["shipments", "shipments"],
  ["shipment_documents", "shipmentDocuments"],
  ["project_files", "projectFiles"],
  ["handover_reports", "handovers"],
  ["workflow_events", "workflowEvents"]
];

export async function signIntakeRows(client, rows, previews) {
  return Promise.all(
    rows.map(async (row) => {
      const result = object(row.result_json);
      const itemsPromise = Promise.all(
        (Array.isArray(result.items) ? result.items : []).map(async (item) => {
          const drawing = object(item.technical_drawing || item.technicalDrawing);
          const [image, main, draft, formal] = await Promise.all([
            previews.sign(client, item.image_storage_bucket, item.image_storage_path),
            previews.sign(client, drawing.storage_bucket, drawing.drawing_storage_path),
            previews.sign(client, drawing.storage_bucket, drawing.draft_storage_path),
            previews.sign(client, drawing.storage_bucket, drawing.formal_storage_path)
          ]);
          return {
            ...item,
            image_url: image || item.image_url || "",
            technical_drawing: Object.keys(drawing).length
              ? {
                  ...drawing,
                  drawing_url: main || drawing.drawing_url || "",
                  draft_url: draft || drawing.draft_url || "",
                  formal_url: formal || drawing.formal_url || ""
                }
              : drawing
          };
        })
      );
      const file = Array.isArray(row.intake_files) ? row.intake_files[0] : row.intake_files;
      const source = file?.mime_type?.startsWith("image/")
        ? previews.sign(client, file.storage_bucket, file.storage_path)
        : Promise.resolve("");
      const [items, preview] = await Promise.all([itemsPromise, source]);
      return { ...row, client_preview_url: preview || row.client_preview_url || "", result_json: { ...result, items } };
    })
  );
}

export async function readClientProgress(client, rows, loadDrawings, onError = () => {}) {
  const ids = [...new Set(rows.map((row) => row.project_id).filter(Boolean))];
  if (!ids.length) return {};
  const entries = await Promise.all(
    progressTables.map(async ([table, key]) => {
      try {
        const { data, error } = await client
          .from(table)
          .select("*")
          .in("project_id", ids)
          .order("created_at", { ascending: false });
        if (error) throw new Error(`${table}: ${error.message}`);
        return [key, data || []];
      } catch (error) {
        onError(error);
        return null;
      }
    })
  );
  const progress = Object.fromEntries(entries.filter(Boolean));
  // Most projects have no supplier drawings. Do not make an API round trip for each one.
  const drawingIds = [
    ...new Set(
      (progress.projectFiles || [])
        .filter((file) => file.file_group === "supplier_shop_drawing")
        .map((file) => file.project_id)
    )
  ];
  const registers = await Promise.all(drawingIds.map((id) => loadDrawings(id).catch(() => ({ files: [] }))));
  const signed = new Map(registers.flatMap((register) => register.files || []).map((file) => [String(file.id), file]));
  if (progress.projectFiles)
    progress.projectFiles = progress.projectFiles.map((file) => signed.get(String(file.id)) || file);
  return progress;
}

export async function readPortalWorkspace({
  client,
  ownerId,
  isStaff,
  previews,
  onClientRows,
  onReviewRows,
  onReviewError,
  onProgressError,
  loadDrawings,
  onTiming = () => {}
}) {
  const started = performance.now();
  const timing = (phase) => onTiming(phase, Math.round(performance.now() - started));
  // Keep complete source records for existing evidence review and edit/approval writes.
  // List pagination must use a separate summary contract before these can be pruned.
  const clientRead = async () => {
    const { data, error } = await client
      .from("intake_jobs")
      .select("*, intake_files(*), projects(*)")
      .or(buildPortalOwnershipFilter(ownerId))
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    let rows = filterPortalJobsForOwner(data || [], ownerId);
    let progress = null;
    const publish = () =>
      onClientRows(
        rows.map((row) =>
          progress
            ? {
                ...row,
                client_progress: Object.fromEntries(
                  Object.entries(progress).map(([key, entries]) => [
                    key,
                    entries.filter((entry) => String(entry.project_id) === String(row.project_id))
                  ])
                )
              }
            : row
        )
      );
    publish(); // Show the list before Storage signatures, progress or drawing requests.
    timing("client-list-data");
    await Promise.all([
      signIntakeRows(client, rows, previews).then((signed) => {
        rows = signed;
        publish();
      }),
      readClientProgress(client, rows, loadDrawings, onProgressError)
        .then((value) => {
          progress = value;
          publish();
        })
        .catch(onProgressError)
    ]);
    timing("client-enrichment");
  };
  const staffRead = async () => {
    if (!isStaff) return;
    try {
      const { data, error } = await client
        .from("intake_jobs")
        .select("*, intake_files(*), projects(*)")
        .in("status", ["queued", "processing", "needs_review", "completed"])
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = data || [];
      const ids = [...new Set(rows.map(getPortalJobOwnerId).filter(Boolean))];
      const signing = signIntakeRows(client, rows, previews).catch((error) => {
        onProgressError(error);
        return rows;
      });
      const profiles = await (ids.length
        ? client.from("user_profiles").select("user_id,public_id,full_name,company").in("user_id", ids)
        : { data: [] });
      if (profiles.error) throw profiles.error;
      const byId = new Map((profiles.data || []).map((profile) => [String(profile.user_id), profile]));
      const withOwners = (records) =>
        records
          .filter(activeProjectJob)
          .map((row) => ({ ...row, owner_profile: byId.get(getPortalJobOwnerId(row)) || null }));
      onReviewRows(withOwners(rows), { previewsOnly: false });
      timing("admin-list-data");
      onReviewRows(withOwners(await signing), { previewsOnly: true });
      timing("admin-previews");
    } catch (error) {
      onReviewError(error);
    }
  };
  const results = await Promise.allSettled([clientRead(), staffRead()]);
  const failed = results.find((result) => result.status === "rejected");
  if (failed) throw failed.reason;
}
