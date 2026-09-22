import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  activeProjectJob,
  buildEditPlan,
  editError,
  importCandidates,
  requiresProjectReview
} from "../../shared/clientProjectEditing.mjs";

export const isProjectEditorStaff = (user) =>
  ["staff", "admin"].includes(user?.app_metadata?.role) || /@crafton\.com$/i.test(user?.email || "");
export function assertProjectOwner(project, user) {
  if (!user?.id || !project || (project.user_id !== user.id && !isProjectEditorStaff(user)))
    throw editError("You do not have access to this project.", 403);
}

export function projectEditVersion(workspace) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        project: workspace.project,
        jobs: workspace.jobs.map((job) => [job.id, job.updated_at]).sort(([a], [b]) => a.localeCompare(b)),
        requiresReview: workspace.requiresReview
      })
    )
    .digest("hex");
}

export async function loadClientProjectWorkspace({ supabase, user, projectId }) {
  const { data: project, error } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (error) throw error;
  assertProjectOwner(project, user);
  if (project.client_edit_revision === undefined)
    throw editError("Project editing is not yet available. Please contact Crafton.", 503);
  const jobs = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error: readError } = await supabase
      .from("intake_jobs")
      .select("*, intake_files(*)")
      .eq("project_id", project.id)
      .order("id")
      .range(offset, offset + 499);
    if (readError) throw readError;
    jobs.push(...data);
    if (data.length < 500) break;
  }
  if (!isProjectEditorStaff(user) && jobs.some((job) => (job.user_id || job.requested_by) !== project.user_id)) {
    throw editError("This project's ownership records need to be checked by Crafton.", 403);
  }
  const downstream = await Promise.all(
    ["rfq_batches", "supplier_quotes", "approvals"].map(async (table) => {
      const { count, error: readError } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("project_id", project.id);
      if (readError) throw readError;
      return count > 0;
    })
  );
  const workspace = { project, jobs, requiresReview: requiresProjectReview(project, jobs, downstream.some(Boolean)) };
  workspace.version = projectEditVersion(workspace);
  return workspace;
}

async function ownedFile(supabase, user, project, fileId) {
  const { data: file, error } = await supabase.from("intake_files").select("*").eq("id", fileId).maybeSingle();
  if (error) throw error;
  if (
    !file ||
    file.user_id !== user.id ||
    file.storage_bucket !== "intake-files" ||
    !file.storage_path?.startsWith(`${user.id}/`) ||
    (file.project_id && file.project_id !== project.id)
  ) {
    throw editError("This uploaded file is not available to your account or project.", 403);
  }
  return file;
}

async function referenceImage({ supabase, user, project, fileId }) {
  const file = await ownedFile(supabase, user, project, fileId);
  if (Number(file.file_size) > 12 * 1024 * 1024) throw editError("Use a JPG, PNG or WebP image no larger than 12MB.");
  const { data, error } = await supabase.storage.from(file.storage_bucket).download(file.storage_path);
  if (error) throw error;
  const buffer = Buffer.from(await data.arrayBuffer());
  if (buffer.length > 12 * 1024 * 1024) throw editError("Use an image no larger than 12MB.");
  const metadata = await sharp(buffer)
    .metadata()
    .catch(() => ({}));
  if (!["jpeg", "png", "webp"].includes(metadata.format) || !metadata.width)
    throw editError("Use a readable JPG, PNG or WebP image.");
  return {
    image_storage_bucket: file.storage_bucket,
    image_storage_path: file.storage_path,
    image_url: "",
    imageUrl: "",
    preview_url: "",
    image_mapping_status: "client_reference",
    image_sha256: createHash("sha256").update(buffer).digest("hex"),
    reference_file_id: file.id
  };
}

async function presentWorkspace(supabase, workspace) {
  const visible = structuredClone(workspace);
  await Promise.all(
    visible.jobs.flatMap((job) =>
      (job.result_json?.client_change_requests || []).flatMap((request) => {
        const proposals =
          request.kind === "item"
            ? [request.proposed]
            : [...(request.additions || []), ...(request.updates || []).map((entry) => entry.after)];
        return proposals
          .filter((item) => item?.image_storage_bucket && item?.image_storage_path)
          .map(async (item) => {
            const { data } = await supabase.storage
              .from(item.image_storage_bucket)
              .createSignedUrl(item.image_storage_path, 3600);
            item.client_reference_preview = data?.signedUrl || "";
          });
      })
    )
  );
  const imports = visible.jobs.filter((job) => !activeProjectJob(job) || job.client_import_state === "merged");
  const documents = await Promise.all(
    workspace.jobs
      .filter((job) => job.intake_files)
      .map(async (job) => {
        const file = Array.isArray(job.intake_files) ? job.intake_files[0] : job.intake_files;
        const { data } = await supabase.storage.from(file.storage_bucket).createSignedUrl(file.storage_path, 3600);
        return {
          id: job.id,
          name: file.original_name,
          createdAt: job.created_at,
          state: job.client_import_state || "original",
          url: data?.signedUrl || ""
        };
      })
  );
  return {
    ...visible,
    imports: imports.map((job) => ({ ...job, candidates: importCandidates(workspace.jobs, job) })),
    documents
  };
}

export async function clientProjectCommand({ supabase, user, body }) {
  if (!body.projectId) throw editError("Select a project first.");
  const workspace = await loadClientProjectWorkspace({ supabase, user, projectId: body.projectId });
  if (body.operation === "read") return presentWorkspace(supabase, workspace);
  if (body.operation === "queue_file") {
    if (workspace.project.user_id !== user.id) throw editError("Upload using the project owner's account.", 403);
    const file = await ownedFile(supabase, user, workspace.project, body.fileId);
    if (
      !/\.(pdf|xlsx?|csv|docx?|jpe?g|png|webp)$/i.test(file.original_name) ||
      !Number(file.file_size) ||
      Number(file.file_size) > 250 * 1024 * 1024
    ) {
      throw editError("Use a PDF, Excel, CSV, Word or reference image file up to 250MB.");
    }
    const { data, error } = await supabase.rpc("queue_client_project_file", {
      p_project_id: workspace.project.id,
      p_owner_id: user.id,
      p_file_id: file.id
    });
    if (error) throw error;
    return { ok: true, jobId: data, outcome: "queued" };
  }
  if (!body.version || body.version !== workspace.version)
    throw editError(
      "This project has changed. Reload the latest details, then review and save your changes again.",
      409
    );
  const image = body.referenceFileId
    ? await referenceImage({ supabase, user, project: workspace.project, fileId: body.referenceFileId })
    : undefined;
  const plan = buildEditPlan(workspace, body, {
    actorId: user.id,
    requestId: randomUUID(),
    staff: isProjectEditorStaff(user),
    image
  });
  const { error } = await supabase.rpc("commit_client_project_edit", {
    p_project_id: workspace.project.id,
    p_owner_id: workspace.project.user_id,
    p_revision: workspace.project.client_edit_revision,
    p_expected_jobs: workspace.jobs.map(({ id, updated_at }) => ({ id, updated_at })),
    p_project_patch: plan.projectPatch,
    p_patches: plan.patches,
    p_guard_draft: plan.guardDraft,
    p_sync_specs: plan.syncSpecs,
    p_actor_id: user.id,
    p_operation: body.operation
  });
  if (error) {
    if (/EDIT_CONFLICT|EDIT_REVIEW_REQUIRED/.test(error.message))
      throw editError("This project changed while saving. Reload the latest details before continuing.", 409);
    if (error.code === "23505") throw editError("You already have a project with this name. Choose another name.", 409);
    throw error;
  }
  return { ok: true, outcome: plan.outcome };
}
