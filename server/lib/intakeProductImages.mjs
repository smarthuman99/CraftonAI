import { createHash } from "node:crypto";
import sharp from "sharp";
import { isPlaceholder, rankProductPhotos, validPhotoBox } from "./intakeDocumentReview.mjs";

export function resolvePixelCrop(bbox, pageWidth, pageHeight) {
  if (!validPhotoBox(bbox) || !pageWidth || !pageHeight) return null;
  const left = Math.floor((bbox.x_min * pageWidth) / 1000);
  const top = Math.floor((bbox.y_min * pageHeight) / 1000);
  const right = Math.min(pageWidth, Math.ceil((bbox.x_max * pageWidth) / 1000));
  const bottom = Math.min(pageHeight, Math.ceil((bbox.y_max * pageHeight) / 1000));
  return right > left && bottom > top ? { left, top, width: right - left, height: bottom - top } : null;
}

export async function attachRenderedItemCrops({
  job,
  result,
  userId,
  getRenderedPage,
  storage,
  onProgress = async () => {}
}) {
  const items = [];
  const cache = new Map();
  const owners = new Map();
  let saved = 0;
  for (const [index, item] of (result.items || []).entries()) {
    await onProgress({ item_index: index });
    if (item.image_storage_path) {
      items.push(item);
      continue;
    }
    const itemRef = item.item_ref || item.review_ref || `item-${index + 1}`;
    const candidates = rankProductPhotos(item.photo_candidates);
    if (
      !candidates.length &&
      item.photo_page > 0 &&
      validPhotoBox(item.photo_bbox) &&
      !isPlaceholder(item.evidence_text)
    ) {
      candidates.push({
        source_page: item.photo_page,
        bbox: item.photo_bbox,
        variant: "",
        kind: "thumbnail",
        confidence: 0.8
      });
    }
    const attempts = [];
    const references = [];
    const variants = new Set();
    for (const candidate of candidates.slice(0, 8)) {
      if (variants.has(candidate.variant || "") || references.length >= 4) continue;
      try {
        let requestedWidth = 1800;
        let pageBuffer, crop;
        for (let pass = 0; pass < 2; pass++) {
          const key = `${candidate.source_page}:${requestedWidth}`;
          if (!cache.has(key)) {
            // Bound resident full-page images; large FF&E packages can otherwise retain hundreds of MB.
            if (cache.size >= 3) cache.delete(cache.keys().next().value);
            cache.set(key, await getRenderedPage(candidate.source_page, requestedWidth));
          }
          const page = cache.get(key);
          if (!page?.dataBase64) throw new Error("page_render_unavailable");
          pageBuffer = Buffer.from(page.dataBase64, "base64");
          const meta = await sharp(pageBuffer).metadata();
          crop = resolvePixelCrop(candidate.bbox, meta.width, meta.height);
          if (!crop) throw new Error("invalid_bbox");
          if (Math.min(crop.width, crop.height) >= 192 || pass === 1) break;
          requestedWidth = Math.min(8000, Math.ceil((meta.width * 192) / Math.min(crop.width, crop.height)));
        }
        if (Math.min(crop.width, crop.height) < 48) throw new Error("source_crop_too_small_after_rerender");
        const cropped = await sharp(pageBuffer).extract(crop).png({ compressionLevel: 9 }).toBuffer();
        const hash = createHash("sha256").update(cropped).digest("hex");
        if (owners.has(hash) && owners.get(hash) !== itemRef) throw new Error("duplicate_crop_requires_review");
        const token = String(itemRef)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 48);
        const path = `${userId || "unowned"}/derived/${job.id}/item-${token}-page-${candidate.source_page}-${hash.slice(0, 10)}.png`;
        const { error } = await storage
          .from("intake-files")
          .upload(path, cropped, { contentType: "image/png", cacheControl: "3600", upsert: true });
        if (error) throw error;
        owners.set(hash, itemRef);
        variants.add(candidate.variant || "");
        references.push({
          storage_bucket: "intake-files",
          storage_path: path,
          mime_type: "image/png",
          width: crop.width,
          height: crop.height,
          sha256: hash,
          source_page: candidate.source_page,
          bbox: candidate.bbox,
          variant: candidate.variant || "",
          verification: "model_localized_not_human_verified"
        });
        saved++;
      } catch (error) {
        attempts.push({ page: candidate.source_page, reason: String(error.message || error) });
      }
    }
    const primary = references[0];
    items.push(
      primary
        ? {
            ...item,
            image_storage_bucket: primary.storage_bucket,
            image_storage_path: primary.storage_path,
            image_mime_type: primary.mime_type,
            image_width: primary.width,
            image_height: primary.height,
            image_sha256: primary.sha256,
            image_storage_paths: references,
            image_mapping_status: "model_localized",
            image_extraction_attempts: attempts
          }
        : {
            ...item,
            image_mapping_status:
              isPlaceholder(item.evidence_text) || item.image_mapping_status === "source_placeholder"
                ? "source_placeholder"
                : candidates.length
                  ? "crop_failed"
                  : "no_verified_mapping",
            image_extraction_attempts: attempts
          }
    );
  }
  const missing = items.filter((i) => !i.image_storage_path && i.image_mapping_status !== "source_placeholder");
  return {
    ...result,
    items,
    image_extraction: {
      saved_image_count: saved,
      item_image_count: items.filter((i) => i.image_storage_path).length,
      placeholder_count: items.filter((i) => i.image_mapping_status === "source_placeholder").length,
      unresolved_item_refs: missing.map((i) => i.item_ref || i.review_ref || i.item_type_en)
    },
    quality_gate: {
      ...result.quality_gate,
      status:
        missing.length || result.quality_gate?.status === "manual_review_required" ? "manual_review_required" : "passed"
    },
    questions: [
      ...(result.questions || []),
      ...(missing.length
        ? [
            "Crafton must review product image extraction for the recorded unresolved furniture lines; inspect the existing source before requesting client photos."
          ]
        : [])
    ],
    source_notes: [
      result.source_notes,
      `Saved ${saved} source product crop(s); ${missing.length} furniture line(s) need internal image review.`
    ]
      .filter(Boolean)
      .join("\n")
  };
}
