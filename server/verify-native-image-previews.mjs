// Read-only deployment probe: use the same owner authorization and signed image
// handler as the portal, without changing accounts or exposing capability URLs.
import assert from "node:assert/strict";
import sharp from "sharp";
import { createSupabaseAdmin } from "./lib/supabaseAdmin.mjs";
import { portalThumbnailAssets } from "./lib/portalThumbnailAssets.mjs";
import { thumbnailSourceVersion } from "../shared/portalThumbnailIdentity.mjs";

const db = createSupabaseAdmin();
const summaries = [];
for (let offset = 0; ; offset += 100) {
  const { data, error } = await db
    .from("portal_job_summaries")
    .select("job_id,project_id,owner_id,items")
    .order("job_id")
    .range(offset, offset + 99);
  if (error) throw error;
  summaries.push(...data);
  if (data.length < 100) break;
}
let checked = 0,
  totalBytes = 0;
const jobs = [];
for (const row of summaries) {
  const refs = row.items
    .filter((item) => item.path?.includes(`/derived/${row.job_id}/native/`))
    .map((item) => ({
      jobId: row.job_id,
      index: item.index,
      kind: "image",
      version: thumbnailSourceVersion(item, item.revision)
    }));
  if (!refs.length) continue;
  for (let offset = 0; offset < refs.length; offset += 24) {
    const batch = await portalThumbnailAssets.authorizeBatch({
      supabase: db,
      user: { id: row.owner_id },
      body: { projectId: row.project_id, references: refs.slice(offset, offset + 24) }
    });
    for (const entry of batch.images) {
      assert.equal(entry.status, "ready", "Native product thumbnail was not prepared on the VPS.");
      const url = new URL(entry.url, "http://127.0.0.1:8787");
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /image\/webp/);
      assert.match(response.headers.get("cache-control"), /^private,/);
      const bytes = Buffer.from(await response.arrayBuffer()),
        metadata = await sharp(bytes).metadata();
      assert.ok(metadata.width <= 320 && metadata.height <= 240);
      const cached = await fetch(url, {
        headers: { "If-None-Match": response.headers.get("etag") },
        signal: AbortSignal.timeout(10000)
      });
      assert.equal(cached.status, 304);
      checked++;
      totalBytes += bytes.length;
    }
  }
  jobs.push({ job_id: row.job_id, checked: refs.length });
}
console.log(JSON.stringify({ native_image_preview_probe: "passed", checked, totalBytes, jobs }));
