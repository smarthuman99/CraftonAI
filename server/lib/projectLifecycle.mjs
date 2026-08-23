import fs from "node:fs";
import path from "node:path";

const ACTIVE_STATUS = "active";
const RETIRED_STATUSES = new Set(["abandoned", "archived"]);
const ALLOWED_ACTIONS = new Set(["abandon", "archive", "restore", "delete"]);

const readObject = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const lifecycleStatusForAction = (action) => {
  if (action === "abandon") return "abandoned";
  if (action === "archive") return "archived";
  if (action === "restore") return ACTIVE_STATUS;
  return "deleted";
};

const lifecycleFromJob = (job = {}) => {
  const result = readObject(job.result_json);
  return readObject(result.project_lifecycle || result.projectLifecycle);
};

export const getJobLifecycleStatus = (job = {}) => {
  const project = Array.isArray(job.projects) ? job.projects[0] || {} : job.projects || {};
  const projectStatus = String(project.lifecycle_status || "").toLowerCase();
  if (projectStatus) return projectStatus;
  return String(lifecycleFromJob(job).status || ACTIVE_STATUS).toLowerCase();
};

export const isJobAutomationActive = (job = {}) => !RETIRED_STATUSES.has(getJobLifecycleStatus(job));

const appendAuditFile = (entry) => {
  try {
    const logDir = path.resolve("server", "logs");
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, "project-retirement-audit.log"), `${JSON.stringify(entry)}\n`, "utf8");
  } catch (error) {
    console.warn("Project lifecycle file audit failed:", error.message || error);
  }
};

const assertStaffInput = ({ action, projectId, projectName, reason, confirmName, currentStatus }) => {
  if (!ALLOWED_ACTIONS.has(action)) {
    const error = new Error("Unsupported project lifecycle action.");
    error.statusCode = 400;
    throw error;
  }
  if (!projectId) {
    const error = new Error("A linked project is required for this action.");
    error.statusCode = 400;
    throw error;
  }
  if (["abandon", "archive", "delete"].includes(action) && !String(reason || "").trim()) {
    const error = new Error("Please record a reason before changing this project.");
    error.statusCode = 400;
    throw error;
  }
  if (action === "delete") {
    if (currentStatus !== "archived") {
      const error = new Error("Only an archived project can be permanently deleted.");
      error.statusCode = 409;
      throw error;
    }
    if (String(confirmName || "").trim() !== String(projectName || "").trim()) {
      const error = new Error("The project name confirmation does not match.");
      error.statusCode = 400;
      throw error;
    }
  }
};

const writeLifecycleAudit = async ({ supabase, entry }) => {
  appendAuditFile(entry);
  const { error } = await supabase.from("project_lifecycle_audit").insert(entry);
  if (error && !/relation .* does not exist|could not find the table/i.test(String(error.message || ""))) {
    console.warn("Project lifecycle database audit failed:", error.message || error);
  }
};

const updateProjectLifecycleColumns = async ({ supabase, project, status, reason, actorId, at }) => {
  if (!Object.prototype.hasOwnProperty.call(project, "lifecycle_status")) return false;
  const updates = {
    lifecycle_status: status,
    retirement_reason: status === ACTIVE_STATUS ? null : reason,
    lifecycle_updated_at: at,
    lifecycle_updated_by: actorId
  };
  if (status === "abandoned") updates.abandoned_at = at;
  if (status === "archived") updates.archived_at = at;
  if (status === ACTIVE_STATUS) {
    updates.abandoned_at = null;
    updates.archived_at = null;
  }
  const { error } = await supabase.from("projects").update(updates).eq("id", project.id);
  if (error) throw error;
  return true;
};

const updateJobLifecycleFallback = async ({ supabase, jobs, status, reason, actorId, at }) => {
  for (const job of jobs) {
    const result = readObject(job.result_json);
    const nextResult = {
      ...result,
      project_lifecycle: {
        ...readObject(result.project_lifecycle),
        status,
        reason: status === ACTIVE_STATUS ? "" : reason,
        updated_at: at,
        updated_by: actorId
      }
    };
    const { error } = await supabase
      .from("intake_jobs")
      .update({ result_json: nextResult, updated_at: at })
      .eq("id", job.id);
    if (error) throw error;
  }
};

const addWorkflowEvent = async ({ supabase, project, jobs, status, reason, actorId }) => {
  const latestJob = jobs[0] || {};
  const statusCopy = {
    active: ["项目已恢复为进行中", "Project restored to active"],
    abandoned: ["项目已标记为放弃", "Project marked as abandoned"],
    archived: ["项目已移入归档", "Project moved to archive"]
  }[status];
  const { error } = await supabase.from("workflow_events").insert({
    project_id: project.id,
    job_id: latestJob.id || null,
    user_id: project.user_id || latestJob.user_id || latestJob.requested_by || null,
    stage_id: `S${String(project.current_stage || 1).padStart(2, "0")}`,
    event_type: "project_lifecycle_changed",
    actor: "Crafton admin",
    message_cn: `${statusCopy[0]}：${reason || "管理员恢复项目"}`,
    message_en: `${statusCopy[1]}: ${reason || "restored by an administrator"}`,
    payload: { status, reason, actor_id: actorId }
  });
  if (error) console.warn("Project lifecycle workflow event failed:", error.message || error);
};

const collectStorageObjects = ({ files = [], jobs = [], projectFiles = [] }) => {
  const objects = new Map();
  const add = (bucket, objectPath) => {
    if (!bucket || !objectPath || /^https?:\/\//i.test(String(objectPath))) return;
    objects.set(`${bucket}:${objectPath}`, { bucket, path: objectPath });
  };
  files.forEach((file) => add(file.storage_bucket || "intake-files", file.storage_path));
  projectFiles.forEach((file) => add(file.payload?.storage_bucket || file.storage_bucket, file.file_path));
  jobs.forEach((job) => {
    const result = readObject(job.result_json);
    (Array.isArray(result.items) ? result.items : []).forEach((item) => {
      const drawing = readObject(item.technical_drawing || item.technicalDrawing);
      add(drawing.storage_bucket, drawing.storage_path);
      add(drawing.draft_bucket || drawing.storage_bucket, drawing.draft_path);
      add(drawing.formal_bucket || drawing.storage_bucket, drawing.formal_path);
      add(item.image_bucket || item.storage_bucket, item.image_path || item.storage_path);
    });
  });
  return Array.from(objects.values());
};

const removeStorageObjects = async (supabase, objects) => {
  const byBucket = new Map();
  objects.forEach((object) => {
    if (!byBucket.has(object.bucket)) byBucket.set(object.bucket, []);
    byBucket.get(object.bucket).push(object.path);
  });
  for (const [bucket, paths] of byBucket.entries()) {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) console.warn(`Could not remove ${bucket} project objects:`, error.message || error);
  }
};

const permanentDeleteProject = async ({ supabase, project, jobs, reason, actor }) => {
  const jobIds = jobs.map((job) => job.id).filter(Boolean);
  const intakeFileIds = jobs.map((job) => job.intake_file_id).filter(Boolean);
  const [projectFileResult, linkedFileResult, jobFileResult] = await Promise.all([
    supabase.from("project_files").select("*").eq("project_id", project.id),
    supabase.from("intake_files").select("*").eq("project_id", project.id),
    intakeFileIds.length
      ? supabase.from("intake_files").select("*").in("id", intakeFileIds)
      : Promise.resolve({ data: [], error: null })
  ]);
  const queryError = projectFileResult.error || linkedFileResult.error || jobFileResult.error;
  if (queryError && !/relation .* does not exist|could not find the table/i.test(String(queryError.message || ""))) {
    throw queryError;
  }
  const filesById = new Map(
    [...(linkedFileResult.data || []), ...(jobFileResult.data || [])].map((file) => [String(file.id), file])
  );
  const storageObjects = collectStorageObjects({
    files: Array.from(filesById.values()),
    jobs,
    projectFiles: projectFileResult.data || []
  });
  const auditEntry = {
    project_id: project.id,
    project_name: project.name,
    previous_status: "archived",
    next_status: "deleted",
    reason,
    actor_id: actor.id,
    actor_email: actor.email || "",
    payload: {
      job_count: jobIds.length,
      intake_file_count: filesById.size,
      storage_object_count: storageObjects.length
    }
  };
  await writeLifecycleAudit({ supabase, entry: auditEntry });

  if (jobIds.length) {
    const { error } = await supabase.from("intake_jobs").delete().in("id", jobIds);
    if (error) throw error;
  }
  if (filesById.size) {
    const { error } = await supabase.from("intake_files").delete().in("id", Array.from(filesById.keys()));
    if (error) throw error;
  }
  const { error: deleteError } = await supabase.from("projects").delete().eq("id", project.id);
  if (deleteError) throw deleteError;
  await removeStorageObjects(supabase, storageObjects);
  return { ok: true, status: "deleted", deleted: auditEntry.payload };
};

export async function changeProjectLifecycle({ supabase, actor, body = {} }) {
  const action = String(body.lifecycleAction || body.projectAction || "").toLowerCase();
  const projectId = String(body.projectId || "").trim();
  const reason = String(body.reason || "").trim();
  const confirmName = String(body.confirmName || "").trim();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  if (projectError || !project) {
    const error = new Error("The project could not be found.");
    error.statusCode = 404;
    throw error;
  }
  const { data: jobs, error: jobsError } = await supabase
    .from("intake_jobs")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });
  if (jobsError) throw jobsError;
  const currentStatus = String(
    project.lifecycle_status || lifecycleFromJob(jobs?.[0]).status || ACTIVE_STATUS
  ).toLowerCase();
  assertStaffInput({
    action,
    projectId,
    projectName: project.name,
    reason,
    confirmName,
    currentStatus
  });
  if (action === "delete") {
    return permanentDeleteProject({ supabase, project, jobs: jobs || [], reason, actor });
  }

  const status = lifecycleStatusForAction(action);
  const at = new Date().toISOString();
  await updateProjectLifecycleColumns({ supabase, project, status, reason, actorId: actor.id, at });
  await updateJobLifecycleFallback({ supabase, jobs: jobs || [], status, reason, actorId: actor.id, at });
  await addWorkflowEvent({ supabase, project, jobs: jobs || [], status, reason, actorId: actor.id });
  await writeLifecycleAudit({
    supabase,
    entry: {
      project_id: project.id,
      project_name: project.name,
      previous_status: currentStatus,
      next_status: status,
      reason,
      actor_id: actor.id,
      actor_email: actor.email || "",
      payload: { job_count: jobs?.length || 0 }
    }
  });
  return { ok: true, projectId: project.id, status, previousStatus: currentStatus, updatedAt: at };
}
