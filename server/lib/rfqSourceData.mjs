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

  const intake = mergeProjectIntakeJobs(jobs) || context.intake || {};
  const intakeProject = intake.project || {};
  const catalogueFiles = (intake.items || [])
    .filter((item) => item.image_url || item.imageUrl || item.preview_url)
    .map((item, index) => ({
      id: `catalogue-${item.id || index + 1}`,
      name: [item.id, item.item_type_en || item.typeEn || item.item_type_cn || item.typeCn]
        .filter(Boolean)
        .join(" · "),
      mimeType: "image/catalogue-reference",
      group: "set_furniture_catalogue",
      note: "Verified Set Furniture catalogue image and product specification.",
      url: item.image_url || item.imageUrl || item.preview_url,
      source: "set_furniture_catalogue"
    }));
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
    files: mergeFiles(files, context.files || [], catalogueFiles),
    specifications: specifications.length ? specifications : context.specifications || [],
    intake
  };
}

export function mergeProjectIntakeJobs(jobs = []) {
  const results = jobs
    .filter(Boolean)
    .map((job) => ({
      job,
      result: job.result_json && typeof job.result_json === "object" ? job.result_json : job
    }));
  if (!results.length) return null;

  const base = results[0].result || {};
  const itemMap = new Map();
  results.forEach(({ job, result }) => {
    (result.items || []).forEach((item, index) => {
      const key =
        String(item.id || "").trim() ||
        [item.item_type_en || item.typeEn, item.dimensions_text, item.material_en, item.finish]
          .map((value) => String(value || "").trim().toLowerCase())
          .filter(Boolean)
          .join("|") ||
        `${job.id || "job"}-${index}`;
      const quantity = Number(item.quantity || item.qty || 0);
      const existing = itemMap.get(key);
      if (existing) {
        itemMap.set(key, {
          ...existing,
          quantity: Number(existing.quantity || existing.qty || 0) + quantity,
          source_job_ids: Array.from(new Set([...(existing.source_job_ids || []), job.id].filter(Boolean)))
        });
      } else {
        itemMap.set(key, {
          ...item,
          quantity,
          source_job_ids: job.id ? [job.id] : []
        });
      }
    });
  });

  const project = results.reduce(
    (merged, { result }) => ({
      ...result.project,
      ...Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== undefined && value !== null && value !== ""))
    }),
    base.project || {}
  );
  const questions = Array.from(new Set(results.flatMap(({ result }) => result.questions || []).filter(Boolean)));
  const sourceModes = results.map(({ result }) => result.source_mode).filter(Boolean);

  return {
    ...base,
    project,
    source_mode:
      sourceModes.length && sourceModes.every((sourceMode) => sourceMode === "set_furniture")
        ? "set_furniture"
        : base.source_mode,
    items: Array.from(itemMap.values()),
    questions,
    intake_job_ids: results.map(({ job }) => job.id).filter(Boolean),
    order_count: results.length
  };
}

export function mergeVerifiedIntakeItems(contextItems = [], intakeItems = []) {
  const verifiedByKey = new Map();
  intakeItems.forEach((item, index) => {
    [item.id, item.itemNo, item.item_type_en, item.typeEn, item.item_type_cn, item.typeCn, index]
      .filter((value) => value !== undefined && value !== null && String(value).trim())
      .forEach((value) => verifiedByKey.set(String(value).trim().toLowerCase(), item));
  });
  const usedVerifiedItems = new Set();
  const baseItems = contextItems.length ? contextItems : intakeItems;
  const mergedItems = baseItems.map((current, index) => {
    const currentKey = String(
      current.id || current.itemNo || current.typeEn || current.nameEn || current.typeCn || current.nameCn || index
    )
      .trim()
      .toLowerCase();
    const verified = verifiedByKey.get(currentKey) || intakeItems[index] || {};
    if (verified && Object.keys(verified).length) usedVerifiedItems.add(verified);
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
      id: current.id || verified.id,
      itemNo: current.itemNo || current.id || verified.id || `ITEM-${index + 1}`,
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
      notes: verified.notes_en || verified.notes_cn || current.notes || current.note,
      imageUrl: verified.image_url || verified.imageUrl || verified.preview_url || current.imageUrl,
      unitPrice: Number(
        verified.unit_price || verified.original_unit_price || current.unitPrice || current.originalUnitPrice || 0
      ),
      currency: verified.currency || current.currency
    };
  });

  intakeItems.forEach((verified, index) => {
    if (usedVerifiedItems.has(verified)) return;
    mergedItems.push(
      mergeVerifiedIntakeItems([], [verified])[0] || {
        ...verified,
        itemNo: verified.id || `ITEM-${baseItems.length + index + 1}`
      }
    );
  });
  return mergedItems;
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
