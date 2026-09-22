// Canonical project editing rules shared by the service, demo and UI.
export const activeProjectJob = (job) => !job.client_import_state || job.client_import_state === "merged";
export const editError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const object = (value) => (value && typeof value === "object" && !Array.isArray(value) ? value : {});
const text = (value, max = 2000) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

export function itemFields(item = {}) {
  const dimensions = object(item.dimensions);
  return {
    name: item.item_type_en || item.typeEn || item.item_type_cn || "",
    quantity: String(item.quantity ?? item.qty ?? ""),
    dimensions:
      item.dimensions_text ||
      (typeof item.dimensions === "string"
        ? item.dimensions
        : [
            dimensions.width && `W ${dimensions.width}`,
            dimensions.depth && `D ${dimensions.depth}`,
            dimensions.height && `H ${dimensions.height}`,
            dimensions.width_mm && `W ${dimensions.width_mm} mm`,
            dimensions.depth_mm && `D ${dimensions.depth_mm} mm`,
            dimensions.height_mm && `H ${dimensions.height_mm} mm`
          ]
            .filter(Boolean)
            .join(" × ")),
    material: item.material_en || item.materialEn || item.material_cn || "",
    color: item.color_en || item.color || item.color_cn || "",
    location: item.usage_location || item.usageLocation || "",
    notes: item.notes_en || item.notesEn || item.notes_cn || ""
  };
}

export function protectedItem(item = {}) {
  const drawing = item.technical_drawing || item.technicalDrawing || {};
  return (
    ["approved", "approved_for_manufacture", "formal"].some((s) =>
      [drawing.status, drawing.review_status, drawing.lifecycle_stage, drawing.lifecycleStage].includes(s)
    ) ||
    Boolean(drawing.formal_path || drawing.formal_url) ||
    (drawing.revisions || []).some((r) => r.review_status === "approved")
  );
}

export function requiresProjectReview(project, jobs, downstream = false) {
  return Boolean(
    downstream ||
    Number(project.current_stage) >= 6 ||
    project.selected_supplier ||
    jobs
      .filter(activeProjectJob)
      .some(
        (job) =>
          ["approved", "rfq_ready"].includes(job.review_status) ||
          (job.rfq_status && job.rfq_status !== "not_started") ||
          (job.result_json?.items || []).some(protectedItem)
      )
  );
}

function identityToken(value, length) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(length, "0").slice(-length);
}

export function preserveItemIdentity(project, job, item, index) {
  const id = item.id || `DRAFT-ITEM-${index + 1}`;
  const identity = [project.id, job.id, id].join("|");
  const initials =
    String(project.name || job.project_name || "Project")
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 3) || "PRJ";
  const drawing = item.technical_drawing || item.technicalDrawing || {};
  return {
    ...item,
    id,
    sku:
      item.sku ||
      item.sku_code ||
      item.item_no ||
      item.itemNo ||
      item.skuCode ||
      item.item_code ||
      drawing.sku ||
      `CRF-${initials}-${identityToken(`${identity}|sku`, 5)}-R01`,
    tracking_id:
      item.tracking_id ||
      item.trackingId ||
      item.qr_tracking_id ||
      item.qrTrackingId ||
      drawing.tracking_id ||
      drawing.trackingId ||
      `TRK-${identityToken(`${identity}|tracking`, 7)}${identityToken(`tracking|${identity}`, 5)}`
  };
}

export function applyItemFields(item, fields, { at, actorId, image } = {}) {
  const allowed = ["name", "quantity", "dimensions", "material", "color", "location", "notes"];
  if (!fields || Object.keys(fields).some((key) => !allowed.includes(key)))
    throw editError("Unsupported furniture field.");
  const name = text(fields.name, 200);
  const quantity = Number(fields.quantity);
  if (!name) throw editError("Enter a furniture name.");
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000000)
    throw editError("Quantity must be a whole number between 1 and 1,000,000.");
  const previous = itemFields(item);
  const next = {
    ...item,
    item_type_en: name,
    item_type_cn: name,
    quantity,
    qty: quantity,
    quantity_text: String(quantity),
    dimensions_text: text(fields.dimensions, 500),
    material_en: text(fields.material),
    material_cn: text(fields.material),
    color_en: text(fields.color, 300),
    color_cn: text(fields.color, 300),
    usage_location: text(fields.location, 500),
    notes_en: text(fields.notes),
    notes_cn: text(fields.notes)
  };
  // A quantity-only save must not replace existing translated descriptions.
  for (const [field, cn, en, aliasCn, aliasEn] of [
    ["name", "item_type_cn", "item_type_en", "typeCn", "typeEn"],
    ["material", "material_cn", "material_en", "materialCn", "materialEn"],
    ["color", "color_cn", "color_en", "colorCn", "colorEn"],
    ["notes", "notes_cn", "notes_en", "notesCn", "notesEn"]
  ]) {
    if (text(fields[field]) === previous[field]) {
      next[cn] = item[cn] ?? item[aliasCn] ?? next[cn];
      next[en] = item[en] ?? item[aliasEn] ?? next[en];
    }
  }
  for (const alias of [
    "typeEn",
    "typeCn",
    "qtyDisplay",
    "dimensionsText",
    "materialEn",
    "materialCn",
    "color",
    "colorCn",
    "colorEn",
    "usageLocation",
    "notesEn",
    "notesCn",
    "note"
  ])
    delete next[alias];
  if (previous.dimensions !== next.dimensions_text) next.dimensions = {};
  if (Number(previous.quantity) !== quantity) {
    delete next.quantity_reconciliation;
    delete next.quantityReconciliation;
    delete next.qtyDisplay;
  }
  if (image) Object.assign(next, image);
  const drawingChanged =
    image || ["name", "dimensions", "material", "color"].some((key) => previous[key] !== text(fields[key]));
  if (drawingChanged) {
    // Retain the full old drawing in the revision record, but never present it as the new specification.
    next.technical_drawing = {
      status: "queued",
      drawing_kind: "ai_concept",
      lifecycle_stage: "concept_generation",
      attempts: 0
    };
    delete next.technicalDrawing;
  }
  next.client_revisions = [
    ...(item.client_revisions || []),
    {
      at,
      actor_id: actorId,
      previous: Object.fromEntries(Object.entries(item).filter(([key]) => key !== "client_revisions"))
    }
  ];
  return next;
}

const matchKey = (value) => text(value).toLowerCase().replace(/\s+/g, " ");
export function importCandidates(jobs, incoming) {
  const existing = jobs
    .filter(activeProjectJob)
    .flatMap((job) => (job.result_json?.items || []).map((item, index) => ({ jobId: job.id, index, item })));
  return (incoming.result_json?.items || []).map((item, index) => {
    const keys = [item.sku, item.item_ref].map(matchKey).filter(Boolean);
    const name = matchKey(itemFields(item).name);
    const matches = existing
      .filter((entry) => {
        const otherKeys = [entry.item.sku, entry.item.item_ref].map(matchKey).filter(Boolean);
        return keys.some((key) => otherKeys.includes(key)) || (name && name === matchKey(itemFields(entry.item).name));
      })
      .map(({ jobId, index: itemIndex, item: target }) => ({
        jobId,
        itemIndex,
        name: itemFields(target).name,
        sku: target.sku || target.item_ref || ""
      }));
    return {
      index,
      fields: itemFields(item),
      itemRef: item.item_ref || item.sku || "",
      matches,
      missing: ["name", "quantity", "dimensions", "material"].filter(
        (key) => !itemFields(item)[key] || (key === "quantity" && Number(itemFields(item)[key]) < 1)
      )
    };
  });
}

export function buildEditPlan(
  workspace,
  command,
  { actorId, at = new Date().toISOString(), requestId, staff = false, image } = {}
) {
  const { project, jobs, requiresReview } = workspace;
  if (!project?.id || (project.lifecycle_status && project.lifecycle_status !== "active"))
    throw editError("This project is read-only.", 409);
  const patches = new Map();
  const patchJob = (job, changes) =>
    patches.set(job.id, { ...(patches.get(job.id) || { id: job.id, result_json: job.result_json || {} }), ...changes });
  const getJob = (id) => {
    const job = jobs.find((entry) => entry.id === id);
    if (!job) throw editError("The selected file or item no longer belongs to this project.", 404);
    return job;
  };
  let projectPatch = {},
    guardDraft = false,
    syncSpecs = false,
    outcome = "saved";
  const addRequest = (job, request) => {
    const requests = job.result_json?.client_change_requests || [];
    if (
      requests.some(
        (r) =>
          ["pending", "in_review"].includes(r.status) && r.kind === request.kind && r.item_index === request.item_index
      )
    ) {
      throw editError(
        "A change request is already open for this item or file. Please wait for the Crafton response.",
        409
      );
    }
    patchJob(job, {
      result_json: {
        ...job.result_json,
        client_change_requests: [
          ...requests,
          {
            ...request,
            id: requestId,
            status: "pending",
            created_at: at,
            actor_id: actorId
          }
        ]
      }
    });
    outcome = "requested";
  };
  if (command.operation === "rename") {
    const name = text(command.name, 160);
    if (!name) throw editError("Enter a project name.");
    projectPatch = { name, client_details: { ...project.client_details, notes: text(command.notes, 4000) } };
    for (const job of jobs.filter(activeProjectJob)) {
      patchJob(job, {
        result_json: {
          ...job.result_json,
          project: { ...job.result_json?.project, name },
          items: (job.result_json?.items || []).map((item, index) => preserveItemIdentity(project, job, item, index))
        }
      });
    }
  } else if (command.operation === "edit_item") {
    const job = getJob(command.jobId),
      index = command.itemIndex;
    if (!activeProjectJob(job) || !["needs_review", "completed"].includes(job.status))
      throw editError("Wait for this file to finish processing.", 409);
    const original = job.result_json?.items?.[index];
    if (!Number.isInteger(index) || !original) throw editError("The furniture item could not be found.", 404);
    const item = preserveItemIdentity(project, job, original, index);
    const next = applyItemFields(item, command.fields, { at, actorId, image });
    if (requiresReview || protectedItem(original)) {
      addRequest(job, { kind: "item", item_index: index, before: item, proposed: next });
    } else {
      const items = [...job.result_json.items];
      items[index] = next;
      patchJob(job, { result_json: { ...job.result_json, items }, review_status: "pending" });
      guardDraft = true;
      syncSpecs = true;
    }
  } else if (command.operation === "confirm_import") {
    const job = getJob(command.jobId);
    if (job.client_import_state !== "preview" || job.status !== "needs_review")
      throw editError("This file is not ready for confirmation.", 409);
    const source = job.result_json?.items || [];
    if (!Array.isArray(command.choices) || command.choices.length !== source.length)
      throw editError("Review every row before confirming the import.");
    const candidates = importCandidates(jobs, job);
    const additions = [],
      updates = [],
      targets = new Set();
    command.choices.forEach((choice, index) => {
      if (!["add", "skip", "update"].includes(choice.action))
        throw editError("Choose Add, Update or Skip for every row.");
      if (choice.action === "skip") return;
      const original = source[index];
      const item = choice.fields ? applyItemFields(original, choice.fields, { at, actorId }) : original;
      if (
        !text(itemFields(item).name) ||
        !Number.isSafeInteger(Number(itemFields(item).quantity)) ||
        Number(itemFields(item).quantity) < 1
      ) {
        throw editError(`Enter a name and valid quantity for row ${index + 1}.`);
      }
      if (choice.action === "add") {
        const identity = preserveItemIdentity(project, job, { id: `${job.id}-${index + 1}` }, additions.length);
        const added = { ...item, ...identity, source_sku: item.sku || "", source_import_index: index };
        additions.push(added);
      } else {
        const target = candidates[index].matches.find(
          (m) => m.jobId === choice.jobId && m.itemIndex === choice.itemIndex
        );
        if (!target) throw editError("Choose an existing matching item to update.");
        const key = `${target.jobId}:${target.itemIndex}`;
        if (targets.has(key)) throw editError("Two incoming rows cannot update the same furniture item.");
        targets.add(key);
        const targetJob = getJob(target.jobId),
          originalTarget = targetJob.result_json.items[target.itemIndex];
        const preserved = preserveItemIdentity(project, targetJob, originalTarget, target.itemIndex);
        const image = item.image_storage_path
          ? Object.fromEntries(
              ["image_storage_bucket", "image_storage_path", "image_mapping_status"]
                .map((key) => [key, item[key]])
                .concat([
                  ["image_url", ""],
                  ["imageUrl", ""],
                  ["preview_url", ""]
                ])
            )
          : undefined;
        updates.push({
          job: targetJob,
          index: target.itemIndex,
          before: preserved,
          after: {
            ...applyItemFields(preserved, itemFields(item), { at, actorId, image }),
            source_import: { job_id: job.id, item_index: index }
          }
        });
      }
    });
    if (!additions.length && !updates.length)
      throw editError("Select at least one row to add or update, or discard this import.");
    if (requiresReview) {
      addRequest(job, {
        kind: "import",
        additions,
        updates: updates.map(({ job: target, ...rest }) => ({ ...rest, job_id: target.id })),
        choices: command.choices,
        existing_item_keys: jobs
          .filter(activeProjectJob)
          .flatMap((entry) => (entry.result_json?.items || []).map((_, index) => `${entry.id}:${index}`))
      });
    } else {
      for (const update of updates) {
        const result = patches.get(update.job.id)?.result_json || update.job.result_json;
        const items = [...result.items];
        items[update.index] = update.after;
        patchJob(update.job, { result_json: { ...result, items }, review_status: "pending" });
      }
      patchJob(job, {
        client_import_state: "merged",
        step: "cho_review",
        review_status: "pending",
        result_json: {
          ...job.result_json,
          source_project: job.result_json.project,
          project: {
            ...jobs.find(activeProjectJob)?.result_json?.project,
            name: project.name,
            destination: project.client_contact || jobs.find(activeProjectJob)?.destination || ""
          },
          source_items: source,
          items: additions,
          import_confirmation: { at, actor_id: actorId, choices: command.choices }
        }
      });
      guardDraft = true;
      syncSpecs = true;
    }
  } else if (command.operation === "discard_import") {
    const job = getJob(command.jobId);
    if (!["preview", "processing"].includes(job.client_import_state) || ["queued", "processing"].includes(job.status))
      throw editError("Wait for processing to finish before discarding this file.", 409);
    if ((job.result_json?.client_change_requests || []).some((r) => ["pending", "in_review"].includes(r.status)))
      throw editError("This file has an open change request.", 409);
    patchJob(job, { client_import_state: "discarded" });
  } else if (command.operation === "review_request") {
    if (!staff) throw editError("Only Crafton staff can review change requests.", 403);
    if (!["in_review", "declined", "resolved"].includes(command.status) || !text(command.note))
      throw editError("Select a review outcome and write a response.");
    const job = getJob(command.jobId),
      requests = job.result_json?.client_change_requests || [];
    const request = requests.find((r) => r.id === command.requestId);
    if (!request || !["pending", "in_review"].includes(request.status))
      throw editError("This change request is no longer open.", 409);
    if (command.status === "resolved") {
      const approvedItems = jobs
        .filter(
          (entry) =>
            activeProjectJob(entry) &&
            ["approved", "rfq_ready"].includes(entry.review_status) &&
            Date.parse(entry.reviewed_at || "") > Date.parse(request.created_at)
        )
        .flatMap((entry) =>
          (entry.result_json?.items || []).map((item, index) => ({ key: `${entry.id}:${index}`, item }))
        );
      const used = new Set();
      const implemented = (proposed, targetKey) => {
        const match = approvedItems.find(
          ({ key, item: current }) =>
            !used.has(key) &&
            (targetKey ? key === targetKey : !(request.existing_item_keys || []).includes(key)) &&
            JSON.stringify(itemFields(current)) === JSON.stringify(itemFields(proposed)) &&
            (!proposed.reference_file_id || current.reference_file_id === proposed.reference_file_id)
        );
        if (match) used.add(match.key);
        return Boolean(match);
      };
      if (
        !(request.kind === "item"
          ? implemented(request.proposed, `${job.id}:${request.item_index}`)
          : request.updates.every((entry) => implemented(entry.after, `${entry.job_id}:${entry.index}`)) &&
            request.additions.every((item) => implemented(item)))
      ) {
        throw editError(
          "Approve the requested specification through the project workflow before marking this request implemented.",
          409
        );
      }
    }
    const resolvedImport = command.status === "resolved" && request.kind === "import";
    patchJob(job, {
      ...(resolvedImport ? { client_import_state: "merged" } : {}),
      result_json: {
        ...job.result_json,
        ...(resolvedImport ? { source_items: job.result_json.items, items: [] } : {}),
        client_change_requests: requests.map((r) =>
          r.id === command.requestId
            ? {
                ...r,
                status: command.status,
                response: text(command.note, 4000),
                reviewed_at: at,
                reviewed_by: actorId,
                review_history: [
                  ...(r.review_history || []),
                  { at, actor_id: actorId, status: command.status, note: text(command.note, 4000) }
                ]
              }
            : r
        )
      }
    });
  } else throw editError("Unsupported project operation.");
  return { projectPatch, patches: [...patches.values()], guardDraft, syncSpecs, outcome };
}
