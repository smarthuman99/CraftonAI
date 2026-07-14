import { createSupabaseAdmin } from "./lib/supabaseAdmin.mjs";
import { parseIntakeBrief } from "./lib/intakeProcessor.mjs";

const supabase = createSupabaseAdmin();
const intervalMs = Number(process.env.INTAKE_WORKER_INTERVAL_MS || 8000);
const batchSize = Number(process.env.INTAKE_WORKER_BATCH_SIZE || 1);
const maxAttempts = Number(process.env.INTAKE_WORKER_MAX_ATTEMPTS || 3);
const maxReadableFileChars = Number(process.env.INTAKE_WORKER_MAX_FILE_TEXT_CHARS || 12000);
const runOnce = process.argv.includes("--once");

async function claimQueuedJobs() {
  const { data: jobs, error } = await supabase
    .from("intake_jobs")
    .select("*, intake_files(*)")
    .eq("status", "queued")
    .lt("attempts", maxAttempts)
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (error) throw error;
  if (!jobs || jobs.length === 0) return [];

  const claimed = [];
  for (const job of jobs) {
    const { data, error: updateError } = await supabase
      .from("intake_jobs")
      .update({
        status: "processing",
        attempts: Number(job.attempts || 0) + 1,
        locked_at: new Date().toISOString(),
        started_at: job.started_at || new Date().toISOString(),
        error_message: null
      })
      .eq("id", job.id)
      .eq("status", "queued")
      .select("*, intake_files(*)")
      .single();

    if (!updateError && data) claimed.push(data);
  }

  return claimed;
}

async function processJob(job) {
  const file = Array.isArray(job.intake_files) ? job.intake_files[0] : job.intake_files;
  const userId = getJobUserId(job);
  await addWorkflowEvent({
    projectId: job.project_id,
    jobId: job.id,
    userId,
    eventType: "intake_started",
    messageCn: "Intake Worker 已领取客户资料解析任务。",
    messageEn: "Intake Worker claimed the client material parsing job."
  });

  const sourceText = await readUploadedFileText(file);
  const result = await parseIntakeBrief({ job, file, sourceText });
  const project = await upsertProject(job, result);
  const ownerUserId = project.user_id || userId;

  await replaceDraftSpecs(project.id, ownerUserId, result.items);
  await replaceDraftPayments(project.id, ownerUserId, result.payments);

  await supabase.from("agent_logs").insert({
    project_id: project.id,
    user_id: ownerUserId,
    operator: "Intake Worker",
    action_desc_cn: result.summary_cn,
    action_desc_en: result.summary_en
  });

  await supabase.from("workflow_events").insert({
    project_id: project.id,
    user_id: ownerUserId,
    job_id: job.id,
    stage_id: "S01",
    event_type: "intake_completed",
    actor: "intake-worker",
    message_cn: result.summary_cn,
    message_en: result.summary_en,
    payload: result
  });

  if (file?.id) {
    await supabase.from("intake_files").update({ project_id: project.id, user_id: ownerUserId }).eq("id", file.id);
  }

  await supabase
    .from("intake_jobs")
    .update({
      status: "needs_review",
      project_id: project.id,
      user_id: ownerUserId,
      result_json: result,
      completed_at: new Date().toISOString()
    })
    .eq("id", job.id);

  console.log(`Processed intake job ${job.id} -> project ${project.name}`);
}

async function upsertProject(job, result) {
  const projectName = result.project.name || job.project_name || `CRAFT-${Date.now()}`;
  const userId = getJobUserId(job);

  let existingQuery = supabase
    .from("projects")
    .select("*")
    .eq("name", projectName)
    .limit(1);

  existingQuery = userId ? existingQuery.eq("user_id", userId) : existingQuery.is("user_id", null);

  const { data: existing, error: existingError } = await existingQuery;

  if (existingError) throw existingError;
  if (existing && existing[0]) return existing[0];

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: projectName,
      client_name: result.project.client_name,
      client_contact: result.project.destination,
      current_stage: 1,
      selected_fabric: "FAB-02",
      selected_leg: "matte-black",
      fabric_compatibility_test: null,
      is_crib5_blocked: false,
      selected_supplier: null,
      split_delivery_active: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function replaceDraftSpecs(projectId, userId, items) {
  await supabase.from("specifications").delete().eq("project_id", projectId);

  const rows = items.map((item) => ({
    project_id: projectId,
    user_id: userId,
    item_type_cn: item.item_type_cn,
    item_type_en: item.item_type_en,
    quantity: Number(item.quantity || 0),
    material_cn: item.material_cn,
    material_en: item.material_en,
    original_unit_price: Number(item.original_unit_price || item.unit_price || 0),
    unit_price: Number(item.unit_price || item.original_unit_price || 0),
    notes_cn: item.notes_cn || "",
    notes_en: item.notes_en || ""
  }));

  const { error } = await supabase.from("specifications").insert(rows);
  if (error) throw error;
}

async function replaceDraftPayments(projectId, userId, payments) {
  await supabase.from("payments").delete().eq("project_id", projectId);

  const rows = payments.map((payment) => ({
    project_id: projectId,
    user_id: userId,
    milestone_cn: payment.milestone_cn,
    milestone_en: payment.milestone_en,
    amount: Number(payment.amount || 0),
    status: payment.status || "Pending",
    payment_date: payment.payment_date || "Pending"
  }));

  const { error } = await supabase.from("payments").insert(rows);
  if (error) throw error;
}

async function addWorkflowEvent({ projectId, jobId, userId, eventType, messageCn, messageEn }) {
  await supabase.from("workflow_events").insert({
    project_id: projectId,
    job_id: jobId,
    user_id: userId,
    stage_id: "S01",
    event_type: eventType,
    actor: "intake-worker",
    message_cn: messageCn,
    message_en: messageEn
  });
}

async function readUploadedFileText(file) {
  if (!file?.storage_bucket || !file?.storage_path) return "";
  if (!isReadableTextFile(file)) return "";

  const { data, error } = await supabase.storage.from(file.storage_bucket).download(file.storage_path);
  if (error) {
    console.warn(`Could not download intake file ${file.id || file.storage_path}:`, error.message || error);
    return "";
  }

  try {
    const buffer = Buffer.from(await data.arrayBuffer());
    return buffer.toString("utf8").replace(/\0/g, "").slice(0, maxReadableFileChars);
  } catch (err) {
    console.warn(`Could not read intake file ${file.id || file.storage_path} as text:`, err.message || err);
    return "";
  }
}

function isReadableTextFile(file) {
  const mime = String(file.mime_type || "").toLowerCase();
  const name = String(file.original_name || file.storage_path || "").toLowerCase();
  return (
    mime.startsWith("text/") ||
    mime.includes("json") ||
    mime.includes("csv") ||
    name.endsWith(".txt") ||
    name.endsWith(".csv") ||
    name.endsWith(".json")
  );
}

function getJobUserId(job) {
  const intakeFile = Array.isArray(job.intake_files) ? job.intake_files[0] : job.intake_files;
  return job.user_id || job.requested_by || intakeFile?.user_id || intakeFile?.uploaded_by || null;
}

async function markJobFailed(job, err) {
  const nextStatus = Number(job.attempts || 0) + 1 >= maxAttempts ? "failed" : "queued";
  await supabase
    .from("intake_jobs")
    .update({
      status: nextStatus,
      error_message: err.message || String(err),
      locked_at: null
    })
    .eq("id", job.id);

  console.error(`Intake job ${job.id} failed:`, err);
}

async function tick() {
  const jobs = await claimQueuedJobs();
  for (const job of jobs) {
    try {
      await processJob(job);
    } catch (err) {
      await markJobFailed(job, err);
    }
  }
}

if (runOnce) {
  await tick();
} else {
  console.log(`Crafton Intake Worker running every ${intervalMs}ms`);
  await tick();
  setInterval(() => {
    tick().catch((err) => console.error("Worker tick failed:", err));
  }, intervalMs);
}
