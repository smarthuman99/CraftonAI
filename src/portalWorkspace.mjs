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

export async function signIntakeRows(client, rows, previews, { thumbnails = false } = {}) {
  return Promise.all(
    rows.map(async (row) => {
      const result = object(row.result_json);
      const itemsPromise = Promise.all(
        (Array.isArray(result.items) ? result.items : []).map(async (item) => {
          const drawing = object(item.technical_drawing || item.technicalDrawing);
          const [image, main, draft, formal] = await Promise.all([
            thumbnails
              ? Promise.resolve("")
              : previews.sign(client, item.image_storage_bucket, item.image_storage_path),
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
      const source =
        !thumbnails && file?.mime_type?.startsWith("image/")
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
  selection,
  previews,
  onClientRows,
  onReviewRows,
  onReviewError,
  onProgressError,
  loadDrawings,
  onTiming = () => {}
}) {
  // Directories use the compact RPC. Full source records only enter an opened project.
  if (!selection) return;
  const staff = selection.scope === "staff";
  if (staff && !isStaff) throw new Error("Staff access required.");
  if (!selection.projectId && !selection.jobId) throw new Error("Select a project first.");
  const started = performance.now();
  let rows = [];
  for (let offset = 0; ; offset += 500) {
    let query = client
      .from("intake_jobs")
      .select("*, intake_files(*), projects(*)")
      .eq(selection.projectId ? "project_id" : "id", selection.projectId || selection.jobId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + 499);
    if (!staff) query = query.or(buildPortalOwnershipFilter(ownerId));
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data || []));
    if ((data || []).length < 500) break;
  }
  if (!staff) rows = filterPortalJobsForOwner(rows, ownerId);
  if (!rows.length) throw new Error("Project not found or access denied.");
  rows = rows.map((row) => {
    const result = object(row.result_json),
      file = Array.isArray(row.intake_files) ? row.intake_files[0] : row.intake_files;
    return {
      ...row,
      client_thumbnail_ref: file?.mime_type?.startsWith("image/")
        ? { jobId: row.id, index: -1, version: row.updated_at }
        : null,
      result_json: {
        ...result,
        items: (result.items || []).map((item, index) => ({
          ...item,
          thumbnail_ref: item.image_storage_path ? { jobId: row.id, index, version: row.updated_at } : null,
          drawing_thumbnail_ref: item.technical_drawing?.storage_bucket
            ? { jobId: row.id, index, version: row.updated_at, kind: "drawing" }
            : null
        }))
      }
    };
  });
  if (staff) {
    const ids = [...new Set(rows.map(getPortalJobOwnerId).filter(Boolean))];
    const { data, error } = ids.length
      ? await client.from("user_profiles").select("user_id,public_id,full_name,company").in("user_id", ids)
      : { data: [] };
    if (error) {
      onReviewError(error);
      throw error;
    }
    const profiles = new Map((data || []).map((profile) => [profile.user_id, profile]));
    rows = rows
      .filter(activeProjectJob)
      .map((row) => ({ ...row, owner_profile: profiles.get(getPortalJobOwnerId(row)) || null }));
    onReviewRows(rows, { previewsOnly: false });
    onTiming("admin-project-data", Math.round(performance.now() - started));
    onReviewRows(await signIntakeRows(client, rows, previews), { previewsOnly: true });
  } else {
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
    publish();
    onTiming("client-project-data", Math.round(performance.now() - started));
    await Promise.all([
      signIntakeRows(client, rows, previews).then((signed) => {
        rows = signed;
        publish();
      }),
      readClientProgress(client, rows, loadDrawings, onProgressError).then((value) => {
        progress = value;
        publish();
      })
    ]);
  }
}
