const MAX_EMAIL_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const MAX_EMAIL_ATTACHMENTS = 12;

export async function enrichRfqContextFromSupabase({ supabase, context = {} }) {
  const projectId = String(context.project?.id || "").trim();
  if (!projectId) {
    const error = new Error("A real Supabase project ID is required to generate an RFQ.");
    error.statusCode = 400;
    throw error;
  }

  const [files, jobs, specifications] = await Promise.all([
    loadProjectSourceFiles(supabase, projectId),
    queryRows(
      supabase.from("intake_jobs").select("*").eq("project_id", projectId).order("created_at", { ascending: false })
    ),
    queryRows(
      supabase.from("specifications").select("*").eq("project_id", projectId).order("created_at", { ascending: false })
    )
  ]);

  const intake = jobs[0]?.result_json || jobs[0] || context.intake || {};
  const intakeProject = intake.project || {};
  return {
    ...context,
    project: {
      projectName: intakeProject.name,
      clientName: intakeProject.client_name,
      destination: intakeProject.destination,
      deliveryDate: intakeProject.desired_delivery_date,
      packaging: intake.packaging,
      ...(context.project || {}),
      id: projectId
    },
    items: mergeVerifiedIntakeItems(context.items || [], intake.items || []),
    files: mergeFiles(files, context.files || []),
    specifications: specifications.length ? specifications : context.specifications || [],
    intake
  };
}

export function mergeVerifiedIntakeItems(contextItems = [], intakeItems = []) {
  const count = Math.max(contextItems.length, intakeItems.length);
  return Array.from({ length: count }, (_, index) => {
    const current = contextItems[index] || {};
    const verified = intakeItems[index] || {};
    const dimensions = verified.dimensions || {};
    const assembledDimensions = [
      dimensions.length && `L ${dimensions.length}`,
      dimensions.width && `W ${dimensions.width}`,
      dimensions.height && `H ${dimensions.height}`
    ]
      .filter(Boolean)
      .join(" x ");
    const dimensionText =
      verified.dimensions_text ||
      (assembledDimensions ? `${assembledDimensions}${dimensions.unit ? ` ${dimensions.unit}` : ""}` : "");

    return {
      ...current,
      itemNo: current.itemNo || current.id || `ITEM-${index + 1}`,
      typeCn: verified.item_type_cn || current.typeCn || current.nameCn,
      typeEn: verified.item_type_en || current.typeEn || current.nameEn,
      quantity: Number(verified.quantity || current.quantity || current.qty || 1),
      dimensions: dimensionText || current.dimensions,
      dimensionUnit: dimensions.unit || current.dimensionUnit,
      tolerance: verified.tolerance || current.tolerance,
      materialCn: verified.material_cn || current.materialCn,
      materialEn: verified.material_en || current.materialEn,
      finish: verified.finish || current.finish,
      color: verified.color || current.color || current.colour,
      hardware: verified.hardware || current.hardware || current.base,
      compliance: verified.fire_standard || current.compliance || current.fireSafetyStandard,
      usage: verified.usage_location || current.usage || current.useLocation,
      notes: verified.notes_en || verified.notes_cn || current.notes || current.note
    };
  });
}

export async function buildEmailAttachmentsFromSupabase({ supabase, projectId, document = {} }) {
  const requested = new Set((document.attachments || []).map((file) => file.id).filter(Boolean));
  if (!projectId || !requested.size) return { attachments: [], omitted: [] };

  const sourceFiles = (await loadProjectSourceFiles(supabase, projectId)).filter((file) => requested.has(file.id));
  const attachments = [];
  const omitted = [];
  let totalBytes = 0;

  for (const file of sourceFiles.slice(0, MAX_EMAIL_ATTACHMENTS)) {
    if (!file.bucket || !file.path) {
      omitted.push({ id: file.id, name: file.name, reason: "No Supabase Storage location is recorded." });
      continue;
    }

    const { data, error } = await supabase.storage.from(file.bucket).download(file.path);
    if (error || !data) {
      omitted.push({ id: file.id, name: file.name, reason: error?.message || "Download failed." });
      continue;
    }

    const bytes = Buffer.from(await data.arrayBuffer());
    if (totalBytes + bytes.length > MAX_EMAIL_ATTACHMENT_BYTES) {
      omitted.push({ id: file.id, name: file.name, reason: "Email attachment size limit reached." });
      continue;
    }

    totalBytes += bytes.length;
    attachments.push({ filename: file.name, content: bytes.toString("base64") });
  }

  if (sourceFiles.length > MAX_EMAIL_ATTACHMENTS) {
    sourceFiles.slice(MAX_EMAIL_ATTACHMENTS).forEach((file) => {
      omitted.push({ id: file.id, name: file.name, reason: "Email attachment count limit reached." });
    });
  }

  return { attachments, omitted };
}

async function loadProjectSourceFiles(supabase, projectId) {
  const jobs = await queryRows(supabase.from("intake_jobs").select("id,intake_file_id").eq("project_id", projectId));
  const linkedIds = jobs.map((row) => row.intake_file_id).filter(Boolean);
  const [directIntakeFiles, linkedIntakeFiles, projectFiles] = await Promise.all([
    queryRows(supabase.from("intake_files").select("*").eq("project_id", projectId)),
    linkedIds.length ? queryRows(supabase.from("intake_files").select("*").in("id", linkedIds)) : [],
    queryRows(supabase.from("project_files").select("*").eq("project_id", projectId))
  ]);

  const intakeFiles = mergeById(directIntakeFiles, linkedIntakeFiles).map((file) => ({
    id: file.id,
    name: file.original_name,
    mimeType: file.mime_type,
    group: file.intake_type,
    note: file.notes,
    bucket: file.storage_bucket,
    path: file.storage_path,
    size: file.file_size,
    source: "intake_files"
  }));
  const operationalFiles = projectFiles
    .filter((file) => !["rfq_document", "rfq_dispatch"].includes(file.file_group))
    .map((file) => ({
      id: file.id,
      name: file.file_name,
      mimeType: file.payload?.mime_type,
      group: file.file_group,
      note: file.payload?.note,
      bucket: file.payload?.storage_bucket,
      path: file.file_path,
      url: file.file_url,
      size: file.payload?.file_size,
      source: "project_files"
    }));

  return mergeFiles(intakeFiles, operationalFiles);
}

async function queryRows(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

function mergeById(...groups) {
  const rows = new Map();
  groups.flat().forEach((row) => {
    if (row?.id && !rows.has(row.id)) rows.set(row.id, row);
  });
  return [...rows.values()];
}

function mergeFiles(...groups) {
  const rows = new Map();
  groups.flat().forEach((file) => {
    const location = file?.bucket && file?.path ? `${file.bucket}/${file.path}` : "";
    const key = file?.id || location || file?.name;
    if (key && !rows.has(key)) rows.set(key, file);
  });
  return [...rows.values()];
}
