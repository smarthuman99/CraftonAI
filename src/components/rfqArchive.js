export function downloadRfqBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = name;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Resolve a fresh credential each time. Never persist signed download URLs.
export async function readArchivedRfqFile(client, file) {
  const bucket = file.payload?.storage_bucket || "intake-files";
  const path = file.file_path || file.payload?.storage_path;
  if (!path) throw new Error("此记录没有可下载的文件，请重新生成。 / File is not archived.");
  const { data, error } = await client.storage.from(bucket).download(path);
  if (error || !data) throw error || new Error("File download failed.");
  return data;
}

export async function archiveRfqExport({ client, projectId, batch, supplierIds, exported, hash, group }) {
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth?.user?.id) throw authError || new Error("Staff session unavailable.");
  const path = `${auth.user.id}/rfq-exports/${projectId}/${globalThis.crypto.randomUUID()}-${exported.fileName}`;
  const blob = new globalThis.Blob([exported.buffer], { type: exported.mimeType });
  const { error: uploadError } = await client.storage.from("intake-files").upload(path, blob, {
    contentType: exported.mimeType,
    upsert: false
  });
  if (uploadError) throw uploadError;
  const { data, error } = await client
    .from("project_files")
    .insert({
      project_id: projectId,
      stage_id: "S06",
      file_group: group,
      file_name: exported.fileName,
      file_path: path,
      sha256: hash,
      audit_hash: hash,
      payload: {
        ...exported.metadata,
        rfq_batch_id: batch.id,
        rfq_code: batch.rfq_code,
        supplier_ids: supplierIds,
        storage_bucket: "intake-files",
        storage_path: path,
        mime_type: exported.mimeType,
        exported_at: new Date().toISOString()
      }
    })
    .select()
    .single();
  if (error) throw error;
  return { file: data, blob };
}
