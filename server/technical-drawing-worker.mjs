import { createSupabaseAdmin } from "./lib/supabaseAdmin.mjs";
import { generateTechnicalDrawingForItem, technicalDrawingPendingItems } from "./lib/technicalDrawing.mjs";
import { isJobAutomationActive } from "./lib/projectLifecycle.mjs";

const supabase = createSupabaseAdmin();
const intervalMs = Number(process.env.THREE_VIEW_WORKER_INTERVAL_MS || 12000);
const scanLimit = Number(process.env.THREE_VIEW_WORKER_SCAN_LIMIT || 30);
const quotaBackoffMs = Number(process.env.THREE_VIEW_QUOTA_BACKOFF_MINUTES || 60) * 60 * 1000;
const runOnce = process.argv.includes("--once");
let running = false;
let pausedUntil = 0;

const readResult = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const jobUserId = (job) => {
  const file = Array.isArray(job.intake_files) ? job.intake_files[0] : job.intake_files;
  return job.user_id || job.requested_by || file?.user_id || file?.uploaded_by || null;
};

async function findPendingItem() {
  const { data, error } = await supabase
    .from("intake_jobs")
    .select("*, intake_files(*), projects(*)")
    .in("status", ["needs_review", "completed"])
    .order("created_at", { ascending: false })
    .limit(scanLimit);
  if (error) throw error;

  for (const job of data || []) {
    if (!isJobAutomationActive(job)) continue;
    const pending = technicalDrawingPendingItems(job);
    if (pending.length) return { job, ...pending[0] };
  }
  return null;
}

async function saveResult(jobId, result) {
  const { error } = await supabase
    .from("intake_jobs")
    .update({ result_json: result, updated_at: new Date().toISOString() })
    .eq("id", jobId);
  if (error) throw error;
}

async function processPendingItem({ job, item, index }) {
  const result = readResult(job.result_json);
  const items = Array.isArray(result.items) ? [...result.items] : [];
  const previousDrawing = item.technical_drawing || {};
  items[index] = {
    ...items[index],
    technical_drawing: {
      ...previousDrawing,
      status: "generating",
      drawing_kind: "ai_concept",
      lifecycle_stage: "concept_generation",
      review_status: "not_applicable",
      attempts: Number(previousDrawing.attempts || 0) + 1,
      started_at: new Date().toISOString()
    }
  };
  await saveResult(job.id, { ...result, items });

  try {
    const drawing = await generateTechnicalDrawingForItem({
      supabase,
      job,
      result,
      item,
      itemIndex: index,
      userId: jobUserId(job)
    });
    items[index] = {
      ...items[index],
      sku: items[index].sku || drawing.sku,
      tracking_id: items[index].tracking_id || drawing.tracking_id,
      tracking_url: items[index].tracking_url || drawing.tracking_url,
      technical_drawing: drawing
    };
    await saveResult(job.id, { ...result, items });
    console.log(`Generated technical drawing for intake job ${job.id}, item ${index + 1}`);
  } catch (error) {
    const waitingForQuota = Number(error?.httpStatus || 0) === 429;
    const retryAfterMs = Math.max(Number(error?.retryAfterSeconds || 0) * 1000, quotaBackoffMs);
    const retryAfter = waitingForQuota ? new Date(Date.now() + retryAfterMs).toISOString() : null;
    if (waitingForQuota) pausedUntil = Date.now() + retryAfterMs;
    items[index] = {
      ...items[index],
      technical_drawing: {
        ...previousDrawing,
        status: waitingForQuota ? "waiting_for_quota" : "generation_failed",
        drawing_kind: "ai_concept",
        lifecycle_stage: "concept_generation",
        review_status: "not_applicable",
        attempts: waitingForQuota ? Number(previousDrawing.attempts || 0) : Number(previousDrawing.attempts || 0) + 1,
        error_code: waitingForQuota
          ? "provider_quota_exceeded"
          : error?.name === "AbortError"
            ? "generation_timeout"
            : "generation_failed",
        retry_after: retryAfter,
        updated_at: new Date().toISOString()
      }
    };
    await saveResult(job.id, { ...result, items });
    console.error(`Technical drawing failed for intake job ${job.id}, item ${index + 1}:`, error.message || error);
  }
}

async function tick() {
  if (running || !process.env.GEMINI_API_KEY || Date.now() < pausedUntil) return;
  running = true;
  try {
    const pending = await findPendingItem();
    if (pending) await processPendingItem(pending);
  } finally {
    running = false;
  }
}

if (runOnce) {
  await tick();
} else {
  console.log(`Crafton Technical Drawing Worker running every ${intervalMs}ms`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not configured; drawing jobs will remain pending until it is added.");
  }
  await tick();
  setInterval(() => tick().catch((error) => console.error("Technical Drawing Worker tick failed:", error)), intervalMs);
}
