import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { applyCataloguePhotos } from "../shared/cataloguePhotos.mjs";
import { createSupabaseAdmin } from "../server/lib/supabaseAdmin.mjs";
import {
  catalogueImageSources,
  publicFurniture,
  deduplicateFurniture,
  groupFurniture
} from "../shared/publishedFurniture.mjs";

const config = JSON.parse(await fs.readFile(new URL("./catalogue/sources.json", import.meta.url), "utf8"));
const photoOverrides = JSON.parse(
  await fs.readFile(new URL("./catalogue/photo-overrides.json", import.meta.url), "utf8")
);
const db = createSupabaseAdmin();
const assetRoot = path.resolve("public/thecrafton-assets/project-catalogue");
const reportRoot = path.resolve("output/catalogue-sync");
await fs.mkdir(assetRoot, { recursive: true });
await fs.mkdir(reportRoot, { recursive: true });
const products = [];
const references = [];
const excluded = [];
const cached = new Map();
const sourceProducts = new Map();
const manualMerges = [];

async function imageAsset(source) {
  const key = `${source.storage_bucket}/${source.storage_path}`;
  if (!cached.has(key))
    cached.set(
      key,
      (async () => {
        const { data, error } = await db.storage.from(source.storage_bucket).download(source.storage_path);
        if (error) throw new Error(`Catalogue image download failed: ${error.message}`);
        const bytes = await sharp(Buffer.from(await data.arrayBuffer()))
          .rotate()
          .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 86 })
          .toBuffer();
        const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 24);
        const filename = `${digest}.webp`;
        await fs.writeFile(path.join(assetRoot, filename), bytes);
        return `/thecrafton-assets/project-catalogue/${filename}`;
      })()
    );
  return cached.get(key);
}

for (const configured of config.projects) {
  const { data: project, error } = await db
    .from("projects")
    .select("id,name,client_name,user_id,lifecycle_status")
    .eq("id", configured.id)
    .single();
  if (error) throw error;
  if (
    project.user_id !== config.ownerId ||
    project.client_name.toLowerCase() !== config.clientName.toLowerCase() ||
    project.name !== configured.name
  )
    throw new Error(`Source ownership/name changed: ${configured.id}`);
  if (["archived", "abandoned", "deleted"].includes(project.lifecycle_status)) continue;
  const { data: jobs, error: jobsError } = await db
    .from("intake_jobs")
    .select("id,user_id,result_json,client_import_state,created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });
  if (jobsError) throw jobsError;
  const projectItems = new Set();
  for (const job of jobs) {
    if (job.user_id !== config.ownerId || (job.client_import_state && job.client_import_state !== "merged")) continue;
    const data = typeof job.result_json === "string" ? JSON.parse(job.result_json) : job.result_json;
    if (["archived", "abandoned", "deleted"].includes(data?.project_lifecycle?.status)) continue;
    for (const [index, item] of (data?.items || []).entries()) {
      const sourceKey = `${job.id}:${item.id || index + 1}`;
      const override = config.overrides[sourceKey] || {};
      const identity = item.sku || `${job.id}:${item.id || index + 1}`;
      if (projectItems.has(identity)) continue;
      projectItems.add(identity);
      if (override.published === false) {
        excluded.push({ sourceKey, reason: override.reason || "Not published" });
        continue;
      }
      const id = `cf-${createHash("sha256").update(`${project.id}:${identity}`).digest("hex").slice(0, 14)}`;
      const imageResults = await Promise.allSettled(catalogueImageSources(item, job).map(imageAsset));
      const errors = imageResults.filter((result) => result.status === "rejected");
      if (errors.length) throw errors[0].reason;
      const images = imageResults.map((result) => result.value);
      const product = publicFurniture(item, { id, images, override });
      products.push(product);
      sourceProducts.set(sourceKey, product);
      if (override.mergeInto) manualMerges.push({ sourceKey, target: override.mergeInto });
      references.push({
        id,
        sourceKey,
        project: project.name,
        sourceItem: item.item_ref || item.id,
        code: product.code,
        name: product.name,
        imageCount: product.images.length,
        missingDimensions: !product.dimensions
      });
    }
  }
  console.log(`${configured.name}: product references prepared`);
}
if (!products.length) throw new Error("No source products; existing catalogue has not been replaced.");
const mergedIds = new Set();
for (const merge of manualMerges) {
  const source = sourceProducts.get(merge.sourceKey);
  const target = sourceProducts.get(merge.target);
  if (
    !source ||
    !target ||
    source.category !== target.category ||
    source.dimensions !== target.dimensions ||
    source.material !== target.material
  )
    throw new Error(`Reviewed duplicate changed: ${merge.sourceKey}`);
  // Identical repeated-room photos need only the representative image; preserve target reference options.
  if (!target.image && source.image) {
    target.image = source.image;
    target.images = source.images;
  }
  mergedIds.add(source.id);
}
const { products: unique, merged } = deduplicateFurniture(products.filter((product) => !mergedIds.has(product.id)));
merged.push(
  ...manualMerges.map((merge) => ({
    id: sourceProducts.get(merge.sourceKey).id,
    into: sourceProducts.get(merge.target).id
  }))
);
const published = applyCataloguePhotos(unique, photoOverrides);
for (const image of new Set(published.flatMap((product) => product.images)))
  await fs.access(path.resolve(`public${image}`));
const catalogue = { title: "The Crafton Collection", categories: groupFurniture(published) };
await fs.mkdir("src/data", { recursive: true });
await fs.writeFile("src/data/projectFurniture.json.tmp", `${JSON.stringify(catalogue, null, 2)}\n`);
await fs.rename("src/data/projectFurniture.json.tmp", "src/data/projectFurniture.json");
const report = {
  syncedAt: new Date().toISOString(),
  sourceItems: products.length,
  publishedProducts: unique.length,
  withPhotos: published.filter((item) => item.image).length,
  missingPhotos: published.filter((item) => !item.image).map((item) => item.id),
  excluded,
  merged,
  references
};
await fs.writeFile(path.join(reportRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      publishedProducts: report.publishedProducts,
      withPhotos: report.withPhotos,
      merged: merged.length,
      categories: catalogue.categories.map((category) => ({ name: category.nameEn, count: category.products.length }))
    },
    null,
    2
  )
);
