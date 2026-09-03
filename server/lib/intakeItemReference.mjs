import { createHash } from "node:crypto";
import sharp from "sharp";

const REFERENCE_BUCKET = "intake-files";
const MAX_REFERENCE_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);
const LOCK_RETRY_LIMIT = 5;

const readObject = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const clean = (value, maxLength = 500) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const requestError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizedIdentity = (value) => clean(value, 120).toUpperCase();

const isStaffUser = (user = {}) => {
  const role = String(user.app_metadata?.role || "").toLowerCase();
  const email = String(user.email || "").toLowerCase();
  return ["staff", "admin"].includes(role) || email.endsWith("@crafton.com");
};

const userOwnsJob = (user, job) =>
  isStaffUser(user) || [job.user_id, job.requested_by].filter(Boolean).some((id) => String(id) === String(user.id));

const drawingCanBeRegenerated = (drawing = {}) => {
  if (["formal", "approved_for_manufacture"].includes(String(drawing.status || "").toLowerCase())) {
    return false;
  }
  return !(Array.isArray(drawing.revisions) ? drawing.revisions : []).some(
    (revision) =>
      revision?.kind === "supplier_shop_drawing" && String(revision?.review_status || "").toLowerCase() === "approved"
  );
};

const imageMimeType = (format) => (format === "jpeg" ? "image/jpeg" : `image/${format}`);

export function patchIntakeItemReferenceResult({
  result,
  itemIndex,
  expectedItemRef = "",
  expectedSku = "",
  image,
  actorId,
  uploadedAt
}) {
  const source = readObject(result);
  const items = Array.isArray(source.items) ? source.items : [];
  if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= items.length) {
    throw requestError("The selected furniture item could not be found.", 404);
  }

  const currentItem = readObject(items[itemIndex]);
  const currentRef = normalizedIdentity(currentItem.item_ref || currentItem.itemRef);
  const currentSku = normalizedIdentity(currentItem.sku || currentItem.sku_code || currentItem.item_no);
  if (expectedItemRef && currentRef && normalizedIdentity(expectedItemRef) !== currentRef) {
    throw requestError("The furniture line changed while the reference image was being added. Please refresh and retry.", 409);
  }
  if (!expectedItemRef && expectedSku && currentSku && normalizedIdentity(expectedSku) !== currentSku) {
    throw requestError("The furniture line changed while the reference image was being added. Please refresh and retry.", 409);
  }

  const previousDrawing = readObject(currentItem.technical_drawing || currentItem.technicalDrawing);
  if (!drawingCanBeRegenerated(previousDrawing)) {
    throw requestError("An approved supplier drawing already controls this item. Its reference image cannot be replaced here.", 409);
  }

  const storageReference = {
    storage_bucket: image.storageBucket,
    storage_path: image.storagePath,
    mime_type: image.mimeType,
    width: image.width,
    height: image.height,
    byte_length: image.byteLength,
    sha256: image.sha256,
    source: "manual_reference"
  };
  const nextDrawing = {
    ...previousDrawing,
    status: "not_started",
    drawing_kind: "ai_concept",
    lifecycle_stage: "concept_generation",
    review_status: "not_applicable",
    attempts: 0,
    source_count: 1,
    source_images: [storageReference],
    drawing_storage_path: "",
    draft_storage_path: "",
    formal_storage_path: "",
    drawing_url: "",
    draft_url: "",
    formal_url: "",
    generated_at: null,
    started_at: null,
    retry_after: null,
    error_code: "",
    reference_updated_at: uploadedAt,
    reference_updated_by: actorId,
    revisions: Array.isArray(previousDrawing.revisions) ? previousDrawing.revisions : []
  };
  const nextItem = {
    ...currentItem,
    image_url: "",
    image_storage_bucket: image.storageBucket,
    image_storage_path: image.storagePath,
    image_storage_paths: [storageReference],
    image_mime_type: image.mimeType,
    image_width: image.width,
    image_height: image.height,
    image_sha256: image.sha256,
    image_mapping_status: "manual_reference",
    image_source: "manual_upload",
    image_uploaded_at: uploadedAt,
    image_uploaded_by: actorId,
    technical_drawing: nextDrawing
  };

  return {
    ...source,
    items: items.map((item, index) => (index === itemIndex ? nextItem : item))
  };
}

export async function attachIntakeItemReference({ supabase, user, body = {} }) {
  const jobId = clean(body.jobId, 100);
  const itemIndex = Number(body.itemIndex);
  const storageBucket = clean(body.storageBucket || REFERENCE_BUCKET, 100);
  const storagePath = clean(body.storagePath, 1000);
  if (!jobId || !Number.isInteger(itemIndex) || itemIndex < 0) {
    throw requestError("A valid intake job and furniture line are required.");
  }
  if (storageBucket !== REFERENCE_BUCKET) {
    throw requestError("Reference images must use the protected intake-files bucket.");
  }
  const requiredPrefix = `${user.id}/item-references/${jobId}/`;
  if (!storagePath.startsWith(requiredPrefix)) {
    throw requestError("The uploaded reference image is not owned by this signed-in account.", 403);
  }

  const { data: blob, error: downloadError } = await supabase.storage.from(storageBucket).download(storagePath);
  if (downloadError || !blob) throw requestError("The uploaded reference image could not be read.", 404);
  const buffer = Buffer.from(await blob.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_REFERENCE_IMAGE_BYTES) {
    throw requestError("Use a JPG, PNG or WebP image no larger than 12MB.");
  }

  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw requestError("The selected file is not a readable product image.");
  }
  if (!ALLOWED_FORMATS.has(metadata.format) || !metadata.width || !metadata.height) {
    throw requestError("Use a JPG, PNG or WebP product image.");
  }

  const image = {
    storageBucket,
    storagePath,
    mimeType: imageMimeType(metadata.format),
    width: metadata.width,
    height: metadata.height,
    byteLength: buffer.length,
    sha256: createHash("sha256").update(buffer).digest("hex")
  };
  const uploadedAt = new Date().toISOString();

  for (let attempt = 0; attempt < LOCK_RETRY_LIMIT; attempt += 1) {
    const { data: job, error: jobError } = await supabase
      .from("intake_jobs")
      .select("id,user_id,requested_by,status,result_json,updated_at")
      .eq("id", jobId)
      .single();
    if (jobError || !job) throw requestError("The intake project could not be found.", 404);
    if (!userOwnsJob(user, job)) throw requestError("You do not have access to this project.", 403);
    if (!["needs_review", "completed"].includes(job.status)) {
      throw requestError("Wait for the intake analysis to finish before adding an item reference.", 409);
    }

    const nextResult = patchIntakeItemReferenceResult({
      result: job.result_json,
      itemIndex,
      expectedItemRef: body.itemRef,
      expectedSku: body.sku,
      image,
      actorId: user.id,
      uploadedAt
    });
    const { data: updated, error: updateError } = await supabase
      .from("intake_jobs")
      .update({ result_json: nextResult })
      .eq("id", job.id)
      .eq("updated_at", job.updated_at)
      .select("id,updated_at")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) continue;

    return {
      ok: true,
      jobId: job.id,
      itemIndex,
      drawingStatus: "queued",
      updatedAt: updated.updated_at,
      image
    };
  }

  throw requestError("The project changed while the image was being saved. Please retry.", 409);
}
