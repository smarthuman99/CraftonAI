import { createSupabaseAdmin } from "./lib/supabaseAdmin.mjs";
import { portalThumbnailAssets, sourcesForSummary, thumbnailSourceKey } from "./lib/portalThumbnailAssets.mjs";
import { exclusiveTask } from "./lib/workerConcurrency.mjs";

const supabase = createSupabaseAdmin();
const once = process.argv.includes("--once");
const interval = Math.max(5000, Number(process.env.PORTAL_THUMBNAIL_POLL_MS) || 10000);
let since = null,
  nextFull = 0;
const retry = new Map();

async function readJobs(full) {
  const rows = [];
  for (let offset = 0; ; offset += 100) {
    let query = supabase
      .from("portal_job_summaries")
      .select("job_id,updated_at,items,source")
      .order("job_id")
      .range(offset, offset + 99);
    if (!full && since) query = query.gte("updated_at", since);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data || []));
    if ((data || []).length < 100) return rows;
  }
}

const tick = exclusiveTask(async () => {
  const started = Date.now(),
    full = started >= nextFull;
  const rows = await readJobs(full);
  const jobs = new Map(rows.map((row) => [row.job_id, row]));
  for (const [id, entry] of retry) if (entry.after <= started && !jobs.has(id)) jobs.set(id, entry.row);
  const sources = new Map();
  for (const row of jobs.values()) {
    retry.delete(row.job_id);
    for (const source of sourcesForSummary(row)) {
      const key = thumbnailSourceKey(source);
      if (!sources.has(key)) sources.set(key, { source, jobs: [] });
      sources.get(key).jobs.push(row);
    }
  }
  const queue = [...sources.values()];
  if (queue.length) console.info("[portal-thumbnail-worker] Preparing", queue.length, "private sources");
  let generated = 0,
    cached = 0,
    failed = 0;
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      while (queue.length) {
        const entry = queue.shift();
        try {
          const result = await portalThumbnailAssets.prepare(supabase, entry.source);
          if (result.generated) generated++;
          else cached++;
        } catch (error) {
          failed++;
          for (const row of entry.jobs) retry.set(row.job_id, { row, after: Date.now() + 60000 });
          console.warn(
            "Thumbnail generation deferred:",
            thumbnailSourceKey(entry.source),
            error.statusCode || error.name || "error"
          );
        }
        if ((generated + cached + failed) % 25 === 0)
          console.info(
            "[portal-thumbnail-worker] Progress",
            JSON.stringify({ generated, cached, failed, remaining: queue.length })
          );
      }
    })
  );
  // Overlap the scan boundary so changes made while a batch is running cannot be lost.
  since = new Date(started - 1000).toISOString();
  if (full) nextFull = started + 6 * 60 * 60 * 1000;
  if (jobs.size || full)
    console.info(
      "[portal-thumbnail-worker]",
      JSON.stringify({ jobs: jobs.size, generated, cached, failed, ms: Date.now() - started })
    );
  return { generated, cached, failed };
});

if (once) {
  const result = await tick();
  if (result.failed && process.argv.includes("--strict")) process.exitCode = 1;
} else {
  console.info(`Portal thumbnail worker polling every ${interval}ms`);
  await tick().catch((error) => console.error("Thumbnail worker:", error.message));
  setInterval(() => tick().catch((error) => console.error("Thumbnail worker:", error.message)), interval);
}
