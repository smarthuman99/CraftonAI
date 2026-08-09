import { randomBytes } from "node:crypto";

const DAY = 86_400_000;
const SUPPLIER_ROLE = "supplier";
const EVIDENCE_BUCKET = "intake-files";

export function supplierIdentity(user) {
  const role = clean(user?.app_metadata?.role).toLowerCase();
  const supplierId = clean(user?.app_metadata?.supplier_id);
  if (role !== SUPPLIER_ROLE || !supplierId) return null;
  return { supplierId, userId: user.id, email: clean(user.email) };
}

export function analyzeProductionTask(task = {}, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const evidence = Array.isArray(task.evidence) ? task.evidence : [];
  const required = unique(
    evidence
      .filter((entry) => entry?.type === "ai_plan")
      .flatMap((entry) => (Array.isArray(entry.required) ? entry.required : []))
      .map(clean)
      .filter(Boolean)
  );
  const uploads = evidence.filter((entry) => entry?.type === "supplier_upload");
  const submittedRequirements = unique(uploads.map((entry) => clean(entry.requirement)).filter(Boolean));
  const completeRequirements = required.filter((item) =>
    submittedRequirements.some((submitted) => normalize(submitted) === normalize(item))
  );
  const duplicateHashes = new Set(options.duplicateHashes || []);
  const hasDuplicate = uploads.some((entry) => entry.sha256 && duplicateHashes.has(entry.sha256));
  const evidenceCoveragePercent = required.length
    ? Math.round((completeRequirements.length / required.length) * 100)
    : uploads.length
      ? 100
      : 0;
  const missingEvidence = required.filter(
    (item) => !completeRequirements.some((complete) => normalize(complete) === normalize(item))
  );
  const reportedProgressPercent = clamp(task.progress_percent, 0, 100);
  const expectedAt = validDate(task.expected_at);
  const latestUploadAt = uploads
    .map((entry) => validDate(entry.uploaded_at))
    .filter(Boolean)
    .sort((a, b) => b - a)[0];
  const latestReportAt = latestUploadAt || validDate(task.reported_at) || validDate(task.created_at);
  const reasons = [];
  let riskLevel = "low";

  if (hasDuplicate) {
    riskLevel = "high";
    reasons.push("A duplicate evidence file was detected and requires Cho review.");
  }
  if (expectedAt && expectedAt < now && reportedProgressPercent < 100) {
    riskLevel = "high";
    reasons.push("The due date has passed while supplier-reported progress is below 100%.");
  }
  if (expectedAt && expectedAt < now && missingEvidence.length) {
    riskLevel = "high";
    reasons.push("Required production evidence remains missing after the due date.");
  }
  const dueInMs = expectedAt ? expectedAt.getTime() - now.getTime() : null;
  if (riskLevel === "low" && dueInMs !== null && dueInMs >= 0 && dueInMs <= 3 * DAY && missingEvidence.length) {
    riskLevel = "medium";
    reasons.push("The task is due within three days and required evidence is incomplete.");
  }
  if (
    riskLevel === "low" &&
    latestReportAt &&
    now.getTime() - latestReportAt.getTime() > 3 * DAY &&
    reportedProgressPercent < 100
  ) {
    riskLevel = "medium";
    reasons.push("No supplier progress evidence has been received for more than three days.");
  }

  const readyForReview = reportedProgressPercent >= 100 && missingEvidence.length === 0 && !hasDuplicate;
  return {
    riskLevel,
    reasons,
    requiredEvidence: required,
    submittedRequirements,
    missingEvidence,
    evidenceCoveragePercent,
    supplierReportedProgressPercent: reportedProgressPercent,
    uploadCount: uploads.length,
    latestSupplierReportAt: latestUploadAt?.toISOString() || null,
    readyForReview,
    controllerStatus: readyForReview
      ? "ready_for_cho_review"
      : riskLevel === "high"
        ? "intervention_required"
        : missingEvidence.length
          ? "awaiting_supplier_evidence"
          : "monitoring"
  };
}

export function buildProjectProductionAnalysis(tasks = [], options = {}) {
  const hashCounts = new Map();
  tasks.forEach((task) => {
    supplierUploads(task).forEach((entry) => {
      if (entry.sha256) hashCounts.set(entry.sha256, (hashCounts.get(entry.sha256) || 0) + 1);
    });
  });
  const duplicateHashes = [...hashCounts.entries()].filter(([, count]) => count > 1).map(([hash]) => hash);
  const analyzedTasks = tasks.map((task) => ({
    ...task,
    analysis: analyzeProductionTask(task, { ...options, duplicateHashes })
  }));
  const coverage = analyzedTasks.length
    ? Math.round(analyzedTasks.reduce((sum, task) => sum + task.analysis.evidenceCoveragePercent, 0) / analyzedTasks.length)
    : 0;
  const progress = analyzedTasks.length
    ? Math.round(
        analyzedTasks.reduce((sum, task) => sum + task.analysis.supplierReportedProgressPercent, 0) /
          analyzedTasks.length
      )
    : 0;
  return {
    tasks: analyzedTasks,
    summary: {
      taskCount: analyzedTasks.length,
      reportedProgressPercent: progress,
      evidenceCoveragePercent: coverage,
      highRiskCount: analyzedTasks.filter((task) => task.analysis.riskLevel === "high").length,
      mediumRiskCount: analyzedTasks.filter((task) => task.analysis.riskLevel === "medium").length,
      readyForReviewCount: analyzedTasks.filter((task) => task.analysis.readyForReview).length,
      duplicateEvidenceCount: duplicateHashes.length,
      controllerStatus: analyzedTasks.some((task) => task.analysis.riskLevel === "high")
        ? "intervention_required"
        : analyzedTasks.some((task) => task.analysis.riskLevel === "medium")
          ? "attention_required"
          : analyzedTasks.length
            ? "monitoring"
            : "awaiting_production_plan"
    }
  };
}

export async function createSupplierPortalAccount({ supabase, supplierId, projectId }) {
  if (!supplierId) throw httpError(400, "A supplier ID is required.");
  const supplier = await single(
    supabase.from("suppliers").select("*").eq("id", supplierId).maybeSingle(),
    "supplier"
  );
  if (!supplier) throw httpError(404, "Supplier not found.");
  if (supplier.status && supplier.status !== "active") throw httpError(409, "This supplier is not active.");
  const email = clean(supplier.contact_email).toLowerCase();
  if (!email || !email.includes("@")) {
    throw httpError(400, "Add a valid supplier contact email before creating portal access.");
  }
  if (email.endsWith("@crafton.com")) throw httpError(409, "A Crafton staff email cannot be used as a supplier login.");
  if (projectId) {
    const selectedQuote = await single(
      supabase
        .from("supplier_quotes")
        .select("id")
        .eq("project_id", projectId)
        .eq("supplier_id", supplierId)
        .eq("status", "selected")
        .maybeSingle(),
      "selected supplier"
    );
    if (!selectedQuote) throw httpError(409, "Approve this supplier in S08 before creating production access.");
  }

  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) throw new Error(`Unable to search supplier accounts: ${usersError.message}`);
  const existing = (usersData?.users || []).find((entry) => clean(entry.email).toLowerCase() === email);
  const temporaryPassword = createTemporaryPassword();
  const userMetadata = {
    full_name: supplier.contact_name || supplier.name,
    company: supplier.name,
    account_type: "supplier_factory"
  };
  const appMetadata = { role: SUPPLIER_ROLE, supplier_id: supplier.id };
  let authUser;
  let created = false;

  if (existing) {
    const existingRole = clean(existing.app_metadata?.role).toLowerCase();
    const existingSupplierId = clean(existing.app_metadata?.supplier_id);
    if (existingRole && existingRole !== SUPPLIER_ROLE) {
      throw httpError(409, "This email already belongs to a non-supplier account. Use another supplier email.");
    }
    if (existingSupplierId && existingSupplierId !== supplier.id) {
      throw httpError(409, "This email is already linked to another supplier.");
    }
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata || {}), ...userMetadata },
      app_metadata: { ...(existing.app_metadata || {}), ...appMetadata }
    });
    if (error) throw new Error(`Unable to reset supplier access: ${error.message}`);
    authUser = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: userMetadata,
      app_metadata: appMetadata
    });
    if (error) throw new Error(`Unable to create supplier access: ${error.message}`);
    authUser = data.user;
    created = true;
  }

  if (projectId) {
    await insertEvent(supabase, {
      project_id: projectId,
      stage_id: "S09",
      event_type: created ? "supplier_portal_account_created" : "supplier_portal_access_reset",
      actor: "Cho",
      message_cn: `${supplier.name} 的供应商生产账号已${created ? "创建" : "重置"}。`,
      message_en: `${supplier.name}'s supplier production account was ${created ? "created" : "reset"}.`,
      payload: { supplier_id: supplier.id, auth_user_id: authUser.id, email }
    });
  }

  return {
    created,
    supplier: { id: supplier.id, name: supplier.name },
    account: { userId: authUser.id, email, temporaryPassword, mustChangePassword: true }
  };
}

export async function loadSupplierProductionWorkspace({ supabase, user }) {
  const identity = supplierIdentity(user);
  if (!identity) throw httpError(403, "This account is not linked to a supplier factory.");
  const supplier = await single(
    supabase.from("suppliers").select("*").eq("id", identity.supplierId).maybeSingle(),
    "supplier"
  );
  if (!supplier || (supplier.status && supplier.status !== "active")) {
    throw httpError(403, "Supplier access is inactive or no longer linked.");
  }
  const quotes = await many(
    supabase
      .from("supplier_quotes")
      .select("id,project_id,supplier_id,status,updated_at")
      .eq("supplier_id", supplier.id)
      .eq("status", "selected"),
    "supplier orders"
  );
  const projectIds = unique(quotes.map((quote) => quote.project_id).filter(Boolean));
  if (!projectIds.length) {
    return {
      supplier: safeSupplier(supplier),
      projects: [],
      summary: emptySummary(),
      generatedAt: new Date().toISOString()
    };
  }

  const [projects, tasks, rfqs] = await Promise.all([
    many(supabase.from("projects").select("*").in("id", projectIds), "projects"),
    many(
      supabase
        .from("production_updates")
        .select("*")
        .eq("supplier_id", supplier.id)
        .in("project_id", projectIds)
        .order("expected_at", { ascending: true }),
      "production tasks"
    ),
    many(
      supabase
        .from("rfq_batches")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false }),
      "approved order specifications"
    )
  ]);
  const analysis = buildProjectProductionAnalysis(tasks);
  const tasksWithLinks = await Promise.all(analysis.tasks.map((task) => attachEvidenceLinks(supabase, task)));
  const projectsSafe = projects.map((project) => {
    const projectTasks = tasksWithLinks.filter((task) => task.project_id === project.id);
    const projectAnalysis = buildProjectProductionAnalysis(projectTasks);
    const latestRfq = rfqs.find((rfq) => rfq.project_id === project.id);
    return {
      id: project.id,
      name: project.name || project.project_name || project.order_id || `Order ${project.id.slice(0, 8)}`,
      orderCode: project.order_id || latestRfq?.rfq_code || project.id.slice(0, 8).toUpperCase(),
      currentStage: project.current_stage || 9,
      targetDeliveryDate: project.desired_delivery_date || project.delivery_date || null,
      specification: safeRfq(latestRfq),
      tasks: projectTasks,
      summary: projectAnalysis.summary
    };
  });
  const refreshedAnalysis = buildProjectProductionAnalysis(tasksWithLinks);
  return {
    supplier: safeSupplier(supplier),
    projects: projectsSafe,
    summary: refreshedAnalysis.summary,
    generatedAt: new Date().toISOString()
  };
}

export async function submitSupplierProductionEvidence({ supabase, user, body = {} }) {
  const identity = supplierIdentity(user);
  if (!identity) throw httpError(403, "This account is not linked to a supplier factory.");
  const taskId = clean(body.productionUpdateId);
  if (!taskId) throw httpError(400, "A production task ID is required.");
  const task = await single(
    supabase
      .from("production_updates")
      .select("*")
      .eq("id", taskId)
      .eq("supplier_id", identity.supplierId)
      .maybeSingle(),
    "production task"
  );
  if (!task) throw httpError(404, "The production task is not assigned to this supplier.");
  const selectedQuote = await single(
    supabase
      .from("supplier_quotes")
      .select("id")
      .eq("project_id", task.project_id)
      .eq("supplier_id", identity.supplierId)
      .eq("status", "selected")
      .maybeSingle(),
    "active supplier assignment"
  );
  if (!selectedQuote) throw httpError(403, "This supplier is no longer assigned to the order.");

  const file = body.file || {};
  const bucket = clean(file.bucket);
  const storagePath = clean(file.path);
  const expectedPrefix = `${identity.userId}/supplier-production/`;
  if (bucket !== EVIDENCE_BUCKET || !storagePath.startsWith(expectedPrefix) || storagePath.includes("..")) {
    throw httpError(400, "The evidence file path is invalid for this supplier account.");
  }
  if (!clean(file.name) || !clean(file.sha256)) throw httpError(400, "File name and SHA-256 are required.");
  await verifyStoredObject(supabase, bucket, storagePath);

  const currentEvidence = Array.isArray(task.evidence) ? task.evidence : [];
  const required = analyzeProductionTask(task).requiredEvidence;
  const requirement = clean(body.requirement);
  if (required.length && !required.some((item) => normalize(item) === normalize(requirement))) {
    throw httpError(400, "Select one of the evidence requirements assigned to this work package.");
  }
  const uploadedAt = new Date().toISOString();
  const entry = {
    type: "supplier_upload",
    requirement: requirement || "Production evidence",
    bucket,
    path: storagePath,
    file_name: clean(file.name),
    mime_type: clean(file.mimeType) || "application/octet-stream",
    size: Number(file.size || 0),
    sha256: clean(file.sha256),
    note: clean(body.note),
    uploaded_by: identity.userId,
    uploaded_at: uploadedAt
  };
  const allSupplierTasks = await many(
    supabase.from("production_updates").select("id,evidence").eq("supplier_id", identity.supplierId),
    "supplier evidence history"
  );
  const duplicateHashes = allSupplierTasks
    .flatMap((row) => supplierUploads(row))
    .filter((existing) => existing.sha256 === entry.sha256)
    .map((existing) => existing.sha256);
  const progressRequested = clamp(body.progressPercent, 0, 100);
  const nextEvidence = [...currentEvidence, entry];
  const preliminary = analyzeProductionTask(
    { ...task, evidence: nextEvidence, progress_percent: progressRequested, reported_at: uploadedAt },
    { duplicateHashes }
  );
  const acceptedProgress = preliminary.missingEvidence.length && progressRequested >= 100 ? 95 : progressRequested;
  const analysis = analyzeProductionTask(
    { ...task, evidence: nextEvidence, progress_percent: acceptedProgress, reported_at: uploadedAt },
    { duplicateHashes }
  );
  const nextStatus = analysis.readyForReview ? "pending_review" : acceptedProgress > 0 ? "in_progress" : "not_started";
  const supplier = await single(
    supabase.from("suppliers").select("id,name").eq("id", identity.supplierId).maybeSingle(),
    "supplier"
  );
  const supplierNote = clean(body.note);
  const controllerNote = controllerMessage(analysis);
  const { error: updateError } = await supabase
    .from("production_updates")
    .update({
      evidence: nextEvidence,
      progress_percent: acceptedProgress,
      status: nextStatus,
      risk_level: analysis.riskLevel,
      reported_at: uploadedAt,
      notes: supplierNote ? `${supplierNote}\nAI controller: ${controllerNote}` : `AI controller: ${controllerNote}`
    })
    .eq("id", task.id)
    .eq("supplier_id", identity.supplierId);
  if (updateError) throw new Error(`Unable to update production evidence: ${updateError.message}`);

  const { error: fileError } = await supabase.from("project_files").insert({
    project_id: task.project_id,
    stage_id: "S09",
    file_group: "production_evidence",
    file_name: entry.file_name,
    file_path: entry.path,
    sha256: entry.sha256,
    audit_hash: entry.sha256,
    payload: {
      supplier_id: identity.supplierId,
      production_update_id: task.id,
      requirement: entry.requirement,
      uploaded_by: identity.userId,
      uploaded_at: uploadedAt,
      ai_analysis: analysis
    }
  });
  if (fileError) throw new Error(`Evidence was saved, but the audit record failed: ${fileError.message}`);
  await insertEvent(supabase, {
    project_id: task.project_id,
    stage_id: analysis.riskLevel === "high" ? "S10" : "S09",
    event_type: analysis.readyForReview ? "production_evidence_ready_for_review" : "supplier_production_evidence_uploaded",
    actor: supplier?.name || user.email || "Supplier",
    message_cn: `${supplier?.name || "供应商"} 已上报 ${task.process_name} 生产证据；AI 判定：${controllerNote}`,
    message_en: `${supplier?.name || "Supplier"} uploaded evidence for ${task.process_name}. AI controller: ${controllerNote}`,
    payload: {
      supplier_id: identity.supplierId,
      production_update_id: task.id,
      file_sha256: entry.sha256,
      analysis
    }
  });
  const linkedTask = await attachEvidenceLinks(supabase, { ...task, evidence: nextEvidence, analysis });
  return {
    ok: true,
    task: {
      ...linkedTask,
      progress_percent: acceptedProgress,
      status: nextStatus,
      risk_level: analysis.riskLevel,
      reported_at: uploadedAt,
      notes: supplierNote
    },
    analysis,
    message: controllerNote
  };
}

export async function analyzeProductionProject({ supabase, projectId }) {
  if (!projectId) throw httpError(400, "A project ID is required.");
  const tasks = await many(
    supabase.from("production_updates").select("*").eq("project_id", projectId).order("expected_at", { ascending: true }),
    "production tasks"
  );
  const analysis = buildProjectProductionAnalysis(tasks);
  const changed = [];
  for (const task of analysis.tasks) {
    if (task.risk_level === task.analysis.riskLevel) continue;
    const { error } = await supabase
      .from("production_updates")
      .update({ risk_level: task.analysis.riskLevel })
      .eq("id", task.id);
    if (error) throw new Error(`Unable to update AI risk state: ${error.message}`);
    changed.push({ id: task.id, from: task.risk_level, to: task.analysis.riskLevel });
  }
  await insertEvent(supabase, {
    project_id: projectId,
    stage_id: analysis.summary.highRiskCount ? "S10" : "S09",
    event_type: "ai_production_controller_run",
    actor: "Crafton AI",
    message_cn: `AI 生产控制器已检查 ${tasks.length} 个工序；高风险 ${analysis.summary.highRiskCount} 项，中风险 ${analysis.summary.mediumRiskCount} 项。`,
    message_en: `AI production controller checked ${tasks.length} work packages: ${analysis.summary.highRiskCount} high and ${analysis.summary.mediumRiskCount} medium risks.`,
    payload: { summary: analysis.summary, risk_changes: changed }
  });
  return { ...analysis, riskChanges: changed, analyzedAt: new Date().toISOString() };
}

export async function monitorActiveProduction({ supabase, now = new Date() }) {
  const tasks = await many(
    supabase
      .from("production_updates")
      .select("*")
      .neq("status", "completed")
      .order("project_id", { ascending: true }),
    "active production tasks"
  );
  const projectIds = unique(tasks.map((task) => task.project_id).filter(Boolean));
  const result = { checkedProjects: projectIds.length, checkedTasks: tasks.length, riskChanges: 0 };
  for (const projectId of projectIds) {
    const projectTasks = tasks.filter((task) => task.project_id === projectId);
    const analysis = buildProjectProductionAnalysis(projectTasks, { now });
    const changed = [];
    for (const task of analysis.tasks) {
      if (task.risk_level === task.analysis.riskLevel) continue;
      const { error } = await supabase
        .from("production_updates")
        .update({ risk_level: task.analysis.riskLevel })
        .eq("id", task.id);
      if (error) throw new Error(`Unable to update scheduled AI risk state: ${error.message}`);
      changed.push({ id: task.id, from: task.risk_level, to: task.analysis.riskLevel });
    }
    if (changed.length) {
      result.riskChanges += changed.length;
      await insertEvent(supabase, {
        project_id: projectId,
        stage_id: analysis.summary.highRiskCount ? "S10" : "S09",
        event_type: "ai_production_risk_changed",
        actor: "Crafton AI",
        message_cn: `AI 定时跟单发现 ${changed.length} 个工序风险状态发生变化。`,
        message_en: `The scheduled AI production controller changed the risk state of ${changed.length} work package(s).`,
        payload: { summary: analysis.summary, risk_changes: changed, checked_at: now.toISOString() }
      });
    }
  }
  return result;
}

function safeSupplier(supplier) {
  return {
    id: supplier.id,
    name: supplier.name,
    code: supplier.code || "",
    contactName: supplier.contact_name || "",
    contactEmail: supplier.contact_email || "",
    capabilities: supplier.capabilities || []
  };
}

function safeRfq(rfq) {
  if (!rfq) return null;
  const document = rfq.payload?.document || rfq.payload || {};
  const items = Array.isArray(document.items) ? document.items : [];
  return {
    rfqCode: rfq.rfq_code || "",
    title: rfq.title || document.title || "",
    dueAt: rfq.due_at || null,
    currency: rfq.currency || document.currency || "USD",
    items: items.map((item, index) => ({
      code: item.code || item.itemCode || item.item_code || `ITEM-${String(index + 1).padStart(2, "0")}`,
      name: item.nameEn || item.nameCn || item.name || item.item || `Item ${index + 1}`,
      nameCn: item.nameCn || "",
      quantity: Number(item.quantity || item.qty || 0),
      unit: item.unit || "pcs",
      dimensions: item.dimensions || item.dimensionsText || "",
      tolerance: item.tolerance || "",
      material: item.materialEn || item.materialCn || item.material || "",
      finish: item.finish || "",
      color: item.color || "",
      hardware: item.hardware || "",
      fireStandard: item.fire_standard || item.fireStandard || "",
      notes: item.notesEn || item.notesCn || item.notes || ""
    }))
  };
}

async function attachEvidenceLinks(supabase, task) {
  const evidence = Array.isArray(task.evidence) ? task.evidence : [];
  const linked = await Promise.all(
    evidence.map(async (entry) => {
      if (entry?.type !== "supplier_upload" || !entry.bucket || !entry.path) return entry;
      const { data } = await supabase.storage.from(entry.bucket).createSignedUrl(entry.path, 60 * 60);
      return { ...entry, downloadUrl: data?.signedUrl || null };
    })
  );
  return { ...task, evidence: linked };
}

async function verifyStoredObject(supabase, bucket, storagePath) {
  const slash = storagePath.lastIndexOf("/");
  const folder = storagePath.slice(0, slash);
  const fileName = storagePath.slice(slash + 1);
  const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 20, search: fileName });
  if (error || !(data || []).some((entry) => entry.name === fileName)) {
    throw httpError(400, "The uploaded evidence file could not be verified in private storage.");
  }
}

function supplierUploads(task) {
  return (Array.isArray(task?.evidence) ? task.evidence : []).filter((entry) => entry?.type === "supplier_upload");
}

function controllerMessage(analysis) {
  if (analysis.readyForReview) return "all required evidence is present; ready for Cho review";
  if (analysis.riskLevel === "high") return analysis.reasons[0] || "intervention is required";
  if (analysis.missingEvidence.length) return `${analysis.missingEvidence.length} required evidence item(s) remain`;
  return "evidence accepted and the task remains under monitoring";
}

function emptySummary() {
  return {
    taskCount: 0,
    reportedProgressPercent: 0,
    evidenceCoveragePercent: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    readyForReviewCount: 0,
    duplicateEvidenceCount: 0,
    controllerStatus: "awaiting_production_plan"
  };
}

async function single(query, label) {
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load ${label}: ${error.message}`);
  return data;
}

async function many(query, label) {
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load ${label}: ${error.message}`);
  return data || [];
}

async function insertEvent(supabase, event) {
  const { error } = await supabase.from("workflow_events").insert(event);
  if (error) throw new Error(`Unable to write the workflow audit event: ${error.message}`);
}

function createTemporaryPassword() {
  return `Cr!${randomBytes(9).toString("base64url")}9a`;
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function validDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalize(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").trim();
}

function unique(values) {
  return [...new Set(values)];
}

function clean(value) {
  return String(value ?? "").trim();
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
