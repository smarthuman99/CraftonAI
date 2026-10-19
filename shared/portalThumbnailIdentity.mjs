// Source identity must not include project/job updated_at: notes are not images.
export const THUMBNAIL_SPEC = "webp-320x240-q68-v2";
export function drawingSource(drawing = {}) {
  const formal = ["formal", "approved_for_manufacture"].includes(drawing.status);
  return {
    bucket: drawing.storage_bucket,
    path: (formal ? drawing.formal_storage_path : drawing.draft_storage_path) || drawing.drawing_storage_path
  };
}
export const thumbnailReferenceKey = (ref) =>
  JSON.stringify([ref.jobId, ref.index, ref.kind || "image", ref.version || ""]);
export function thumbnailSourceVersion(source = {}, revision = "") {
  return JSON.stringify([THUMBNAIL_SPEC, source.bucket || "", source.path || "", revision || ""]);
}
