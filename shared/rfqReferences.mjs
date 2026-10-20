// Keep durable Storage locations in RFQs; signed URLs are only a viewing credential.
export function referenceStorageLocation(file = {}, supabaseUrl = "") {
  const bucket = file.bucket || file.storage_bucket || file.image_storage_bucket;
  const path = file.path || file.storage_path || file.image_storage_path;
  if (bucket && path) return { bucket, path };
  try {
    const url = new URL(file.url || file.image_url || "");
    if (!supabaseUrl || url.origin !== new URL(supabaseUrl).origin) return null;
    const match = url.pathname.match(/^\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/(.+)$/);
    return match ? { bucket: decodeURIComponent(match[1]), path: decodeURIComponent(match[2]) } : null;
  } catch {
    return null;
  }
}

export function isImageReference(file = {}) {
  return (
    /^image\//i.test(file.type || file.mimeType || "") ||
    /\.(png|jpe?g|webp|avif|gif|heic)(?:[?#]|$)/i.test(file.path || file.url || file.name || "")
  );
}

// Match by a durable item identifier or an explicitly linked filename, never by
// array position: source documents and unassigned references may be interleaved.
export function referencesForItem(item, references = []) {
  return references.filter((file) =>
    file.itemNo ? String(file.itemNo) === String(item.itemNo) : (item.referenceFiles || []).includes(file.name)
  );
}

export async function resolveRfqReference(file, supabase) {
  const location = referenceStorageLocation(file, supabase.supabaseUrl);
  if (location) {
    const { data, error } = await supabase.storage.from(location.bucket).createSignedUrl(location.path, 3600);
    if (error || !data?.signedUrl) throw new Error(`Cannot open reference: ${file.name || "attachment"}`);
    return data.signedUrl;
  }
  return file.url || "";
}
