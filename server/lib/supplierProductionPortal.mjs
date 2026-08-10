import { randomBytes } from "node:crypto";

const DAY = 86_400_000;
const SUPPLIER_ROLE = "supplier";
const EVIDENCE_BUCKET = "intake-files";
const SHIPPING_BUFFER_DAYS = 10;
const UPDATE_FREQUENCIES = new Set(["daily", "every_2_days", "twice_weekly", "weekly"]);
const PROCESS_ORDER = [
  "material_procurement",
  "frame_production",
  "upholstery",
  "finishing",
  "assembly",
  "pre_shipment_qc"
];

export function supplierIdentity(user) {
  const role = clean(user?.app_metadata?.role).toLowerCase();
  const supplierId = clean(user?.app_metadata?.supplier_id);
  if (role !== SUPPLIER_ROLE || !supplierId) return null;
  return { supplierId, userId: user.id, email: clean(user.email) };
}

export function latestEvidenceEntry(task = {}, type) {
  return (
    (Array.isArray(task.evidence) ? task.evidence : [])
      .filter((entry) => entry?.type === type)
      .sort(
        (a, b) =>
          Number(b.version || 0) - Number(a.version || 0) ||
          String(b.created_at || b.submitted_at || "").localeCompare(String(a.created_at || a.submitted_at || ""))
      )[0] || null
  );
}

function evidenceTimestamp(entry = {}) {
  const value =
    entry.reviewed_at || entry.uploaded_at || entry.created_at || entry.submitted_at || entry.approved_at || "";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function productionEvidenceReviewState(task = {}) {
  const evidence = Array.isArray(task.evidence) ? task.evidence : [];
  const uploads = evidence.filter((entry) => entry?.type === "supplier_upload");
  const reviews = evidence
    .filter((entry) => entry?.type === "cho_evidence_review")
    .sort((a, b) => evidenceTimestamp(b) - evidenceTimestamp(a));
  const latestReview = reviews[0] || null;
  const latestUploadAt = uploads.reduce((latest, entry) => Math.max(latest, evidenceTimestamp(entry)), 0);
  const reviewIsCurrent = Boolean(latestReview) && evidenceTimestamp(latestReview) >= latestUploadAt;
  const decision = reviewIsCurrent ? clean(latestReview.decision).toLowerCase() : "pending";
  return {
    status: ["approved", "changes_required"].includes(decision) ? decision : "pending",
    latestReview: reviewIsCurrent ? latestReview : null,
    latestUploadAt: latestUploadAt ? new Date(latestUploadAt).toISOString() : null,
    reviewedAt: reviewIsCurrent ? latestReview.reviewed_at || null : null
  };
}

export function productionCompletionState(tasks = []) {
  const frameworkTasks = productionFrameworkTasks(tasks);
  const states = frameworkTasks.map((task) => productionEvidenceReviewState(task));
  return {
    taskCount: frameworkTasks.length,
    approvedCount: states.filter((state) => state.status === "approved").length,
    changesRequiredCount: states.filter((state) => state.status === "changes_required").length,
    allApproved: frameworkTasks.length > 0 && states.every((state) => state.status === "approved")
  };
}

export function productionPlanState(tasks = []) {
  const frameworkTasks = productionFrameworkTasks(tasks);
  if (!frameworkTasks.length) return { status: "awaiting_framework", version: 0, approvedVersion: 0 };
  const latestPlans = frameworkTasks.map((task) => latestEvidenceEntry(task, "supplier_plan"));
  if (latestPlans.some((plan) => !plan)) return { status: "awaiting_supplier_plan", version: 0, approvedVersion: 0 };
  const version = Math.max(...latestPlans.map((plan) => Number(plan.version || 1)));
  const reviews = frameworkTasks.map((task) => latestEvidenceEntry(task, "ai_plan_review"));
  const approvals = frameworkTasks.map((task) => latestEvidenceEntry(task, "cho_plan_approval"));
  const approvedVersion = Math.min(...approvals.map((approval) => Number(approval?.version || 0)));
  if (reviews.some((review) => Number(review?.version || 0) === version && review.status === "changes_required")) {
    return { status: "changes_required", version, approvedVersion };
  }
  const latestVersionApproved = approvals.every((approval) => Number(approval?.version || 0) === version);
  if (latestVersionApproved) return { status: "approved", version, approvedVersion: version };
  const readyForCho = reviews.every(
    (review) => Number(review?.version || 0) === version && review.status === "ready_for_cho_review"
  );
  if (readyForCho && approvedVersion > 0) return { status: "revision_pending_cho", version, approvedVersion };
  if (readyForCho) return { status: "awaiting_cho_approval", version, approvedVersion: 0 };
  return { status: "ai_review", version, approvedVersion };
}

export function validateSupplierProductionPlan({
  tasks = [],
  planTasks = [],
  project = {},
  quote = {},
  version = 1,
  changeReason = ""
}) {
  tasks = productionFrameworkTasks(tasks);
  const rows = new Map(planTasks.map((row) => [clean(row.productionUpdateId), row]));
  const issues = [];
  const normalizedTasks = sortProductionTasks(tasks).map((task, index) => {
    const row = rows.get(clean(task.id)) || {};
    const startsAt = validDate(row.startsAt);
    const expectedAt = validDate(row.expectedAt);
    const materialReadyAt = validDate(row.materialReadyAt);
    const capacitySlot = clean(row.capacitySlot);
    const dependencies = clean(row.dependencies);
    const updateFrequency = clean(row.updateFrequency).toLowerCase();
    const constraints = clean(row.constraints);
    const taskLabel = clean(task.process_name) || `Work package ${index + 1}`;
    const addIssue = (severity, code, message, messageCn) =>
      issues.push({ severity, code, taskId: task.id, taskName: taskLabel, message, messageCn });

    if (!rows.has(clean(task.id))) {
      addIssue(
        "high",
        "missing_work_package",
        "The factory plan is missing this work package.",
        "工厂排产缺少这项生产工序。"
      );
    }
    if (!startsAt)
      addIssue(
        "high",
        "missing_start",
        "Enter a valid factory start date and time.",
        "请填写有效的工厂开始日期和时间。"
      );
    if (!expectedAt) {
      addIssue(
        "high",
        "missing_completion",
        "Enter a valid factory completion date and time.",
        "请填写有效的工厂完成日期和时间。"
      );
    }
    if (startsAt && expectedAt && startsAt >= expectedAt) {
      addIssue(
        "high",
        "invalid_date_range",
        "Completion must be later than the start date.",
        "完成时间必须晚于开始时间。"
      );
    }
    if (!capacitySlot) {
      addIssue(
        "high",
        "missing_capacity_slot",
        "Confirm the factory capacity slot or production line.",
        "请确认工厂产能档期或生产线。"
      );
    }
    if (!UPDATE_FREQUENCIES.has(updateFrequency)) {
      addIssue(
        "high",
        "missing_update_frequency",
        "Select a valid factory reporting frequency.",
        "请选择有效的工厂进度上报频率。"
      );
    }
    if (clean(task.process_name) === "material_procurement" && !materialReadyAt) {
      addIssue(
        "high",
        "missing_material_readiness",
        "Confirm when the order materials will be ready.",
        "请确认本订单物料到齐时间。"
      );
    }
    if (materialReadyAt && startsAt && materialReadyAt > startsAt) {
      addIssue(
        "warning",
        "materials_after_start",
        "Material readiness is later than the planned start date.",
        "物料到齐时间晚于计划开工时间，请确认是否可行。"
      );
    }

    return {
      productionUpdateId: task.id,
      processName: task.process_name,
      startsAt: startsAt?.toISOString() || null,
      expectedAt: expectedAt?.toISOString() || null,
      materialReadyAt: materialReadyAt?.toISOString() || null,
      capacitySlot,
      dependencies,
      updateFrequency,
      constraints
    };
  });

  for (let index = 1; index < normalizedTasks.length; index += 1) {
    const previous = normalizedTasks[index - 1];
    const current = normalizedTasks[index];
    const previousEnd = validDate(previous.expectedAt);
    const currentStart = validDate(current.startsAt);
    if (previousEnd && currentStart && currentStart < previousEnd) {
      issues.push({
        severity: "warning",
        code: "process_overlap",
        taskId: current.productionUpdateId,
        taskName: current.processName,
        message: `This work package overlaps ${previous.processName}; Cho should confirm the factory can run them in parallel.`,
        messageCn: `本工序与 ${previous.processName} 时间重叠；Cho 需要确认工厂可以并行生产。`
      });
    }
  }

  const finalCompletion = normalizedTasks
    .map((row) => validDate(row.expectedAt))
    .filter(Boolean)
    .sort((a, b) => b - a)[0];
  const targetDelivery = validDate(project.desired_delivery_date || project.delivery_date);
  const latestProductionCompletion = targetDelivery
    ? new Date(targetDelivery.getTime() - SHIPPING_BUFFER_DAYS * DAY)
    : null;
  if (finalCompletion && latestProductionCompletion && finalCompletion > latestProductionCompletion) {
    issues.push({
      severity: "high",
      code: "shipping_buffer_missed",
      taskId: null,
      taskName: "Order",
      message: `Factory completion misses the required ${SHIPPING_BUFFER_DAYS}-day shipping buffer before target delivery.`,
      messageCn: `工厂完工时间未能在目标交付日前预留 ${SHIPPING_BUFFER_DAYS} 天运输缓冲期。`
    });
  }
  if (!targetDelivery) {
    issues.push({
      severity: "warning",
      code: "target_delivery_missing",
      taskId: null,
      taskName: "Order",
      message: "The project target delivery date is missing, so AI cannot verify the shipping buffer.",
      messageCn: "项目缺少目标交付日期，AI 暂时无法校验运输缓冲期。"
    });
  }

  const starts = normalizedTasks
    .map((row) => validDate(row.startsAt))
    .filter(Boolean)
    .sort((a, b) => a - b);
  const quotedLeadDays = Number(quote.lead_time_days || quote.payload?.lead_time_days || 0);
  if (quotedLeadDays > 0 && starts[0] && finalCompletion) {
    const factoryLeadDays = Math.ceil((finalCompletion.getTime() - starts[0].getTime()) / DAY);
    if (factoryLeadDays > quotedLeadDays + 3) {
      issues.push({
        severity: "warning",
        code: "quote_lead_time_mismatch",
        taskId: null,
        taskName: "Order",
        message: `The factory plan is ${factoryLeadDays} days, longer than the quoted ${quotedLeadDays}-day lead time.`,
        messageCn: `工厂排产为 ${factoryLeadDays} 天，长于报价承诺的 ${quotedLeadDays} 天交期。`
      });
    }
  }
  if (version > 1 && !clean(changeReason)) {
    issues.push({
      severity: "high",
      code: "revision_reason_missing",
      taskId: null,
      taskName: "Order",
      message: "Explain why the factory is revising the previously submitted schedule.",
      messageCn: "请说明工厂修改上一版排产的原因。"
    });
  }

  return {
    status: issues.some((issue) => issue.severity === "high") ? "changes_required" : "ready_for_cho_review",
    issues,
    normalizedTasks,
    finalCompletion: finalCompletion?.toISOString() || null,
    latestProductionCompletion: latestProductionCompletion?.toISOString() || null,
    quotedLeadDays: quotedLeadDays || null
  };
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
  const supplierPlan = latestEvidenceEntry(task, "supplier_plan");
  const planReview = latestEvidenceEntry(task, "ai_plan_review");
  const planApproval = latestEvidenceEntry(task, "cho_plan_approval");
  const supplierPlanVersion = Number(supplierPlan?.version || 0);
  const approvedPlanVersion = Number(planApproval?.version || 0);
  const latestPlanApproved = supplierPlanVersion > 0 && supplierPlanVersion === approvedPlanVersion;
  const hasApprovedBaseline = approvedPlanVersion > 0;
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
  const expectedAt = hasApprovedBaseline ? validDate(task.expected_at) : null;
  const latestUploadAt = uploads
    .map((entry) => validDate(entry.uploaded_at))
    .filter(Boolean)
    .sort((a, b) => b - a)[0];
  const latestReportAt = latestUploadAt || validDate(task.reported_at) || validDate(task.created_at);
  const completionReview = productionEvidenceReviewState(task);
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
    hasApprovedBaseline &&
    latestReportAt &&
    now.getTime() - latestReportAt.getTime() > 3 * DAY &&
    reportedProgressPercent < 100
  ) {
    riskLevel = "medium";
    reasons.push("No supplier progress evidence has been received for more than three days.");
  }

  if (completionReview.status === "changes_required" && riskLevel === "low") {
    riskLevel = "medium";
    reasons.push(
      clean(completionReview.latestReview?.note) || "Cho requires replacement evidence or corrective action."
    );
  }

  const evidenceReady = reportedProgressPercent >= 100 && missingEvidence.length === 0 && !hasDuplicate;
  const readyForReview = evidenceReady && completionReview.status === "pending";
  const planStatus = !supplierPlan
    ? "awaiting_supplier_plan"
    : planReview?.status === "changes_required"
      ? "plan_revision_required"
      : latestPlanApproved
        ? "plan_approved"
        : hasApprovedBaseline
          ? "plan_revision_pending_cho"
          : "awaiting_cho_plan_approval";
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
    productionPlan: {
      status: planStatus,
      latest: supplierPlan,
      review: planReview,
      latestVersion: supplierPlanVersion,
      approvedVersion: approvedPlanVersion,
      latestVersionApproved: latestPlanApproved,
      hasApprovedBaseline
    },
    completionReview,
    readyForReview,
    controllerStatus: !hasApprovedBaseline
      ? planStatus
      : completionReview.status === "approved"
        ? "completed"
        : completionReview.status === "changes_required"
          ? "evidence_changes_required"
          : readyForReview
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
  const orderedTasks = sortProductionTasks(tasks);
  const analyzedTasks = orderedTasks.map((task) => ({
    ...task,
    analysis: analyzeProductionTask(task, { ...options, duplicateHashes })
  }));
  const coverage = analyzedTasks.length
    ? Math.round(
        analyzedTasks.reduce((sum, task) => sum + task.analysis.evidenceCoveragePercent, 0) / analyzedTasks.length
      )
    : 0;
  const progress = analyzedTasks.length
    ? Math.round(
        analyzedTasks.reduce((sum, task) => sum + task.analysis.supplierReportedProgressPercent, 0) /
          analyzedTasks.length
      )
    : 0;
  const plan = productionPlanState(analyzedTasks);
  const completion = productionCompletionState(analyzedTasks);
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
      approvedCompletionCount: completion.approvedCount,
      completionChangesRequiredCount: completion.changesRequiredCount,
      allProductionEvidenceApproved: completion.allApproved,
      planStatus: plan.status,
      planVersion: plan.version,
      approvedPlanVersion: plan.approvedVersion,
      controllerStatus: completion.allApproved
        ? "completed"
        : completion.changesRequiredCount
          ? "evidence_changes_required"
          : plan.status !== "approved" && plan.approvedVersion === 0
            ? plan.status
            : analyzedTasks.some((task) => task.analysis.riskLevel === "high")
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
  const supplier = await single(supabase.from("suppliers").select("*").eq("id", supplierId).maybeSingle(), "supplier");
  if (!supplier) throw httpError(404, "Supplier not found.");
  if (supplier.status && supplier.status !== "active") throw httpError(409, "This supplier is not active.");
  const email = clean(supplier.email || supplier.contact_email).toLowerCase();
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
  const users = usersData?.users || [];
  const existingByEmail = users.find((entry) => clean(entry.email).toLowerCase() === email);
  const existingBySupplier = users.find(
    (entry) =>
      clean(entry.app_metadata?.role).toLowerCase() === SUPPLIER_ROLE &&
      clean(entry.app_metadata?.supplier_id) === supplier.id
  );
  if (existingByEmail && existingBySupplier && existingByEmail.id !== existingBySupplier.id) {
    throw httpError(409, "The new email already belongs to another account. Use another supplier email.");
  }
  const existing = existingBySupplier || existingByEmail;
  const temporaryPassword = createTemporaryPassword();
  const userMetadata = {
    full_name: supplier.contact_person || supplier.contact_name || supplier.name,
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
      email,
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
      supabase.from("rfq_batches").select("*").in("project_id", projectIds).order("created_at", { ascending: false }),
      "approved order specifications"
    )
  ]);
  const analysis = buildProjectProductionAnalysis(productionFrameworkTasks(tasks));
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

export async function submitSupplierProductionPlan({ supabase, user, body = {} }) {
  const identity = supplierIdentity(user);
  if (!identity) throw httpError(403, "This account is not linked to a supplier factory.");
  const projectId = clean(body.projectId);
  if (!projectId) throw httpError(400, "A project ID is required.");
  const [project, selectedQuote, loadedTasks, supplier] = await Promise.all([
    single(supabase.from("projects").select("*").eq("id", projectId).maybeSingle(), "project"),
    single(
      supabase
        .from("supplier_quotes")
        .select("*")
        .eq("project_id", projectId)
        .eq("supplier_id", identity.supplierId)
        .eq("status", "selected")
        .maybeSingle(),
      "active supplier assignment"
    ),
    many(
      supabase
        .from("production_updates")
        .select("*")
        .eq("project_id", projectId)
        .eq("supplier_id", identity.supplierId),
      "production work packages"
    ),
    single(supabase.from("suppliers").select("id,name").eq("id", identity.supplierId).maybeSingle(), "supplier")
  ]);
  if (!project) throw httpError(404, "Project not found.");
  if (!selectedQuote) throw httpError(403, "This supplier is no longer assigned to the order.");
  const tasks = productionFrameworkTasks(loadedTasks);
  if (!tasks.length) throw httpError(409, "Crafton has not released the production work-package framework yet.");

  const currentVersion = Math.max(
    0,
    ...tasks.map((task) => Number(latestEvidenceEntry(task, "supplier_plan")?.version || 0))
  );
  const version = currentVersion + 1;
  const changeReason = clean(body.changeReason) || (version === 1 ? "Initial factory production commitment" : "");
  const review = validateSupplierProductionPlan({
    tasks,
    planTasks: Array.isArray(body.planTasks) ? body.planTasks : [],
    project,
    quote: selectedQuote,
    version,
    changeReason
  });
  const submittedAt = new Date().toISOString();

  for (const task of tasks) {
    const planTask = review.normalizedTasks.find((row) => row.productionUpdateId === task.id);
    const relatedIssues = review.issues.filter((issue) => !issue.taskId || issue.taskId === task.id);
    const currentEvidence = Array.isArray(task.evidence) ? task.evidence : [];
    const planEntry = {
      type: "supplier_plan",
      version,
      starts_at: planTask?.startsAt || null,
      expected_at: planTask?.expectedAt || null,
      material_ready_at: planTask?.materialReadyAt || null,
      capacity_slot: planTask?.capacitySlot || "",
      dependencies: planTask?.dependencies || "",
      update_frequency: planTask?.updateFrequency || "",
      constraints: planTask?.constraints || "",
      change_reason: changeReason,
      submitted_by: identity.userId,
      submitted_at: submittedAt
    };
    const reviewEntry = {
      type: "ai_plan_review",
      version,
      status: review.status,
      issues: relatedIssues,
      final_completion: review.finalCompletion,
      latest_production_completion: review.latestProductionCompletion,
      quoted_lead_days: review.quotedLeadDays,
      reviewed_at: submittedAt
    };
    const hasApprovedBaseline = Number(latestEvidenceEntry(task, "cho_plan_approval")?.version || 0) > 0;
    const update = {
      evidence: [...currentEvidence, planEntry, reviewEntry],
      reported_at: submittedAt
    };
    if (!hasApprovedBaseline) {
      update.status = review.status === "changes_required" ? "plan_revision_required" : "plan_submitted";
      update.risk_level = "low";
    }
    const { error } = await supabase
      .from("production_updates")
      .update(update)
      .eq("id", task.id)
      .eq("supplier_id", identity.supplierId);
    if (error) throw new Error(`Unable to save factory production plan: ${error.message}`);
  }

  await insertEvent(supabase, {
    project_id: projectId,
    stage_id: "S09",
    event_type:
      review.status === "changes_required"
        ? "supplier_production_plan_changes_required"
        : "supplier_production_plan_submitted",
    actor: supplier?.name || user.email || "Supplier",
    message_cn:
      review.status === "changes_required"
        ? `${supplier?.name || "供应商"} 已提交第 ${version} 版真实排产；AI 发现需要修正的问题。`
        : `${supplier?.name || "供应商"} 已提交第 ${version} 版真实排产；AI 校验通过，等待 Cho 批准。`,
    message_en:
      review.status === "changes_required"
        ? `${supplier?.name || "Supplier"} submitted factory schedule v${version}; AI requires changes.`
        : `${supplier?.name || "Supplier"} submitted factory schedule v${version}; AI validation passed for Cho approval.`,
    payload: { supplier_id: identity.supplierId, version, change_reason: changeReason, review }
  });
  return { ok: true, version, review };
}

export async function approveSupplierProductionPlan({ supabase, user, body = {} }) {
  const projectId = clean(body.projectId);
  if (!projectId) throw httpError(400, "A project ID is required.");
  const selectedQuote = await single(
    supabase
      .from("supplier_quotes")
      .select("supplier_id")
      .eq("project_id", projectId)
      .eq("status", "selected")
      .maybeSingle(),
    "active supplier assignment"
  );
  if (!selectedQuote?.supplier_id) throw httpError(409, "No supplier is currently approved for production.");
  const loadedTasks = await many(
    supabase
      .from("production_updates")
      .select("*")
      .eq("project_id", projectId)
      .eq("supplier_id", selectedQuote.supplier_id),
    "production work packages"
  );
  const tasks = productionFrameworkTasks(loadedTasks);
  if (!tasks.length) throw httpError(409, "No production work-package framework has been released.");
  const state = productionPlanState(tasks);
  if (!["awaiting_cho_approval", "revision_pending_cho"].includes(state.status)) {
    throw httpError(409, "The latest factory schedule is not ready for Cho approval.");
  }
  const approvedAt = new Date().toISOString();
  for (const task of tasks) {
    const plan = latestEvidenceEntry(task, "supplier_plan");
    const review = latestEvidenceEntry(task, "ai_plan_review");
    if (!plan || Number(plan.version || 0) !== state.version || review?.status !== "ready_for_cho_review") {
      throw httpError(409, "The latest factory schedule is incomplete or still requires changes.");
    }
    const approval = {
      type: "cho_plan_approval",
      version: state.version,
      approved_by: user?.id || null,
      approved_by_name: clean(user?.user_metadata?.full_name) || clean(user?.email) || "Cho",
      approved_at: approvedAt
    };
    const { error } = await supabase
      .from("production_updates")
      .update({
        evidence: [...(Array.isArray(task.evidence) ? task.evidence : []), approval],
        expected_at: plan.expected_at,
        status: Number(task.progress_percent || 0) > 0 ? "in_progress" : "not_started",
        risk_level: "low"
      })
      .eq("id", task.id);
    if (error) throw new Error(`Unable to approve factory production plan: ${error.message}`);
  }
  const supplierId = tasks[0]?.supplier_id || null;
  const { error: approvalError } = await supabase.from("approvals").insert({
    project_id: projectId,
    stage_id: "S09",
    approval_type: "supplier_production_schedule",
    status: "approved",
    reviewer_id: user?.id || null,
    reviewer_name: clean(user?.user_metadata?.full_name) || clean(user?.email) || "Cho",
    notes: clean(body.notes) || `Approved supplier factory schedule v${state.version}.`,
    reviewed_at: approvedAt,
    payload: { supplier_id: supplierId, version: state.version, previous_approved_version: state.approvedVersion }
  });
  if (approvalError)
    throw new Error(`The schedule was approved, but the approval record failed: ${approvalError.message}`);
  await insertEvent(supabase, {
    project_id: projectId,
    stage_id: "S09",
    event_type: "supplier_production_plan_approved",
    actor: clean(user?.user_metadata?.full_name) || clean(user?.email) || "Cho",
    message_cn: `Cho 已批准供应商第 ${state.version} 版真实生产排期；该版本现为正式跟单基准。`,
    message_en: `Cho approved supplier factory schedule v${state.version}; it is now the active production baseline.`,
    payload: { supplier_id: supplierId, version: state.version, previous_approved_version: state.approvedVersion }
  });
  const refreshed = await many(
    supabase.from("production_updates").select("*").eq("project_id", projectId),
    "approved production work packages"
  );
  return { ok: true, ...buildProjectProductionAnalysis(refreshed), approvedAt };
}

export async function reviewSupplierProductionEvidence({ supabase, user, body = {} }) {
  const projectId = clean(body.projectId);
  const taskId = clean(body.productionUpdateId);
  const decision = clean(body.decision).toLowerCase();
  const note = clean(body.note);
  if (!projectId || !taskId) throw httpError(400, "A project and production work package are required.");
  if (!["approved", "changes_required"].includes(decision)) {
    throw httpError(400, "Choose approved or changes_required as the evidence review decision.");
  }
  if (decision === "changes_required" && !note) {
    throw httpError(400, "Explain what the supplier must correct or upload again.");
  }

  const [task, selectedQuote, projectTasks] = await Promise.all([
    single(
      supabase.from("production_updates").select("*").eq("id", taskId).eq("project_id", projectId).maybeSingle(),
      "production work package"
    ),
    single(
      supabase
        .from("supplier_quotes")
        .select("supplier_id")
        .eq("project_id", projectId)
        .eq("status", "selected")
        .maybeSingle(),
      "active supplier assignment"
    ),
    many(
      supabase.from("production_updates").select("*").eq("project_id", projectId),
      "project production work packages"
    )
  ]);
  if (!task || !productionFrameworkTasks([task]).length) {
    throw httpError(404, "Production work package not found.");
  }
  if (!selectedQuote?.supplier_id || selectedQuote.supplier_id !== task.supplier_id) {
    throw httpError(409, "This work package is not assigned to the currently approved supplier.");
  }

  const analysis =
    buildProjectProductionAnalysis(productionFrameworkTasks(projectTasks)).tasks.find((entry) => entry.id === task.id)
      ?.analysis || analyzeProductionTask(task);
  if (!analysis.productionPlan.hasApprovedBaseline) {
    throw httpError(409, "Approve the supplier production schedule before reviewing completion evidence.");
  }
  if (analysis.completionReview.status === "approved") {
    throw httpError(409, "This work package has already passed Cho's completion review.");
  }
  if (decision === "approved" && !analysis.readyForReview) {
    throw httpError(
      409,
      "Progress must be 100%, all required evidence must be present, and no evidence risk can remain."
    );
  }
  if (decision === "changes_required" && analysis.uploadCount < 1) {
    throw httpError(409, "There is no supplier evidence to review yet.");
  }

  const reviewedAt = new Date().toISOString();
  const reviewerName = clean(user?.user_metadata?.full_name) || clean(user?.email) || "Cho";
  const uploadHashes = supplierUploads(task)
    .map((entry) => entry.sha256)
    .filter(Boolean);
  const reviewEntry = {
    type: "cho_evidence_review",
    decision,
    note: note || "Completion evidence approved for visual quality inspection.",
    reviewed_by: user?.id || null,
    reviewed_by_name: reviewerName,
    reviewed_at: reviewedAt,
    supplier_upload_hashes: uploadHashes
  };
  const { error: updateError } = await supabase
    .from("production_updates")
    .update({
      evidence: [...(Array.isArray(task.evidence) ? task.evidence : []), reviewEntry],
      status: decision === "approved" ? "completed" : "changes_required",
      progress_percent: decision === "approved" ? 100 : Number(task.progress_percent || 0),
      risk_level: decision === "approved" ? "low" : "medium"
    })
    .eq("id", task.id)
    .eq("project_id", projectId);
  if (updateError) throw new Error(`Unable to save the production evidence review: ${updateError.message}`);

  const { error: approvalError } = await supabase.from("approvals").insert({
    project_id: projectId,
    stage_id: "S09",
    approval_type: "production_evidence",
    status: decision,
    reviewer_id: user?.id || null,
    reviewer_name: reviewerName,
    notes: reviewEntry.note,
    reviewed_at: reviewedAt,
    payload: {
      production_update_id: task.id,
      supplier_id: task.supplier_id,
      process_name: task.process_name,
      supplier_upload_hashes: uploadHashes
    }
  });
  if (approvalError) {
    throw new Error(`The evidence review was saved, but the approval record failed: ${approvalError.message}`);
  }

  await insertEvent(supabase, {
    project_id: projectId,
    stage_id: decision === "approved" ? "S09" : "S10",
    event_type: decision === "approved" ? "production_evidence_approved" : "production_evidence_changes_required",
    actor: reviewerName,
    message_cn:
      decision === "approved"
        ? `Cho 已批准 ${task.process_name} 的完工证据。`
        : `Cho 已退回 ${task.process_name} 的完工证据：${reviewEntry.note}`,
    message_en:
      decision === "approved"
        ? `Cho approved completion evidence for ${task.process_name}.`
        : `Cho returned completion evidence for ${task.process_name}: ${reviewEntry.note}`,
    payload: {
      production_update_id: task.id,
      supplier_id: task.supplier_id,
      decision,
      note: reviewEntry.note,
      supplier_upload_hashes: uploadHashes
    }
  });

  if (decision === "changes_required") {
    const { data: project, error: projectLoadError } = await supabase
      .from("projects")
      .select("current_stage")
      .eq("id", projectId)
      .maybeSingle();
    if (projectLoadError) throw new Error(`Unable to load the project stage: ${projectLoadError.message}`);
    if (Number(project?.current_stage || 0) < 11) {
      const { error: stageError } = await supabase.from("projects").update({ current_stage: 10 }).eq("id", projectId);
      if (stageError) throw new Error(`Unable to move the project to S10: ${stageError.message}`);
    }
  }

  const refreshedTasks = productionFrameworkTasks(
    await many(
      supabase.from("production_updates").select("*").eq("project_id", projectId).eq("supplier_id", task.supplier_id),
      "reviewed production work packages"
    )
  );
  const completion = productionCompletionState(refreshedTasks);
  let projectReleased = false;
  if (completion.allApproved) {
    const { error: stageError } = await supabase
      .from("projects")
      .update({ current_stage: 11 })
      .eq("id", projectId)
      .lt("current_stage", 11);
    if (stageError) throw new Error(`Unable to release the project to S11: ${stageError.message}`);
    await insertEvent(supabase, {
      project_id: projectId,
      stage_id: "S11",
      event_type: "production_completion_released_to_visual_qc",
      actor: reviewerName,
      message_cn: `全部 ${completion.taskCount} 个生产工序的完工证据已获 Cho 批准，项目进入 S11 视觉品质检验。`,
      message_en: `Cho approved completion evidence for all ${completion.taskCount} production work packages. The project is released to S11 visual quality inspection.`,
      payload: { supplier_id: task.supplier_id, ...completion, released_at: reviewedAt }
    });
    projectReleased = true;
  }

  return {
    ok: true,
    decision,
    reviewedAt,
    projectReleased,
    completion,
    ...buildProjectProductionAnalysis(refreshedTasks)
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
  if (productionEvidenceReviewState(task).status === "approved") {
    throw httpError(409, "This work package is complete and locked after Cho approval.");
  }
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
    event_type: analysis.readyForReview
      ? "production_evidence_ready_for_review"
      : "supplier_production_evidence_uploaded",
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
    supabase
      .from("production_updates")
      .select("*")
      .eq("project_id", projectId)
      .order("expected_at", { ascending: true }),
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
    supabase.from("production_updates").select("*").neq("status", "completed").order("project_id", { ascending: true }),
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
    contactName: supplier.contact_person || supplier.contact_name || "",
    contactEmail: supplier.email || supplier.contact_email || "",
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
    approvedCompletionCount: 0,
    completionChangesRequiredCount: 0,
    allProductionEvidenceApproved: false,
    planStatus: "awaiting_framework",
    planVersion: 0,
    approvedPlanVersion: 0,
    controllerStatus: "awaiting_framework"
  };
}

function sortProductionTasks(tasks = []) {
  return [...tasks].sort((a, b) => {
    const aIndex = PROCESS_ORDER.indexOf(clean(a.process_name));
    const bIndex = PROCESS_ORDER.indexOf(clean(b.process_name));
    const normalizedA = aIndex < 0 ? PROCESS_ORDER.length : aIndex;
    const normalizedB = bIndex < 0 ? PROCESS_ORDER.length : bIndex;
    return (
      normalizedA - normalizedB || String(a.created_at || a.id || "").localeCompare(String(b.created_at || b.id || ""))
    );
  });
}

function productionFrameworkTasks(tasks = []) {
  return tasks.filter((task) => {
    const evidence = Array.isArray(task?.evidence) ? task.evidence : [];
    return (
      evidence.some((entry) => ["ai_plan", "supplier_plan"].includes(entry?.type)) ||
      PROCESS_ORDER.includes(clean(task?.process_name))
    );
  });
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
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .trim();
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
