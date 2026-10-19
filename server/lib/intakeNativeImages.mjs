import { createHash } from "node:crypto";
import sharp from "sharp";
import { resizePortalThumbnail } from "./portalThumbnail.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const extensions = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

// Originals and VPS previews have different lifecycles. Store immutable originals;
// the existing portal summary trigger and thumbnail worker handle their previews.
export async function saveNativeImages({ storage, job, userId, images, maxAttempts = 2, onProgress = async () => {} }) {
  if (!userId || !job?.id) throw new Error("An owned intake job is required for native images.");
  const references = [],
    failures = [],
    seen = new Set();
  for (const image of images) {
    const bytes = image.data,
      sha256 = bytes?.length ? hash(bytes) : "";
    if (seen.has(sha256)) continue;
    seen.add(sha256);
    const identity = { image_ref: image.page, source_cell: image.sourceCell || "", sha256 };
    let attempts = 0;
    try {
      if (!bytes?.length || !extensions[image.mimeType]) throw new Error("unsupported_native_image");
      const metadata = await sharp(bytes, { failOn: "error" }).metadata();
      // Exercise the exact VPS preview transform before publishing a reference.
      // Its byte/pixel limits must not leave a supposedly complete item without a preview.
      await resizePortalThumbnail(bytes);
      const storagePath = `${userId}/derived/${job.id}/native/${sha256}.${extensions[image.mimeType]}`;
      const bucket = storage.from("intake-files");
      let lastError;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        attempts = attempt;
        await onProgress({ ...identity, attempt });
        try {
          const { error } = await bucket.upload(storagePath, bytes, {
            contentType: image.mimeType,
            cacheControl: "31536000",
            upsert: false
          });
          if (error && !["409", "Duplicate"].includes(String(error.statusCode || error.error))) throw error;
          const { data, error: readError } = await bucket.download(storagePath);
          if (readError || !data) throw readError || new Error("native_image_unreadable");
          if (hash(Buffer.from(await data.arrayBuffer())) !== sha256) throw new Error("native_image_checksum_mismatch");
          references.push({
            storage_bucket: "intake-files",
            storage_path: storagePath,
            mime_type: image.mimeType,
            width: metadata.width,
            height: metadata.height,
            sha256,
            source_image_ref: image.page,
            source_sheet: image.worksheet,
            source_row: image.sourceRow,
            source_cell: image.sourceCell || "",
            storage_verified: true,
            thumbnail_compatible: true
          });
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastError) throw lastError;
    } catch (error) {
      failures.push({ ...identity, reason: String(error.message || error), attempts });
    }
  }
  return { references, failures };
}

export function nativeImageFields(references, source, uploadedAt = new Date().toISOString()) {
  if (!references.length) return {};
  const primary = references[0];
  return {
    image_storage_bucket: primary.storage_bucket,
    image_storage_path: primary.storage_path,
    image_mime_type: primary.mime_type,
    image_width: primary.width,
    image_height: primary.height,
    image_sha256: primary.sha256,
    image_uploaded_at: uploadedAt,
    image_storage_paths: references,
    image_mapping_status: "native_source_verified",
    image_review_verified: true,
    image_source_evidence: { ...source, method: "native_spreadsheet_relationship", storage_verified: true }
  };
}

export async function attachSpreadsheetImages({ result, manifest, images, storage, job, userId, onProgress }) {
  const rows = new Map(manifest.rows.map((row) => [row.id, row]));
  const byId = new Map(images.map((image) => [image.page, image]));
  const items = [],
    failures = [];
  for (const [index, item] of (result.items || []).entries()) {
    const row = rows.get(item.source_row_id);
    const native =
      item.image_source_evidence?.row_id === row?.id && item.image_mapping_status === "native_source_verified";
    if (!row || ((item.image_storage_path || item.image_url) && !native)) {
      items.push(item);
      continue;
    }
    const existing = native ? item.image_storage_paths || [] : [];
    const pending = row.image_refs
      .map((id) => byId.get(id))
      .filter((image) => image && !existing.some((ref) => ref.sha256 === image.sha256 && ref.storage_verified));
    if (!pending.length && existing.length) {
      items.push(item);
      continue;
    }
    const saved = await saveNativeImages({
      storage,
      job,
      userId,
      onProgress,
      images: pending
    });
    failures.push(...saved.failures.map((failure) => ({ ...failure, item_index: index, source_row_id: row.id })));
    items.push({
      ...item,
      ...nativeImageFields([...existing, ...saved.references], {
        row_id: row.id,
        sheet: row.sheet,
        row: row.row,
        code: row.code,
        file_sha256: manifest.file_sha256
      })
    });
  }
  return { ...result, items, native_image_failures: failures };
}
