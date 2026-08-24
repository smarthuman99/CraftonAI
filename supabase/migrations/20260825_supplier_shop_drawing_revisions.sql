-- Supplier CAD / shop-drawing revision workflow.
-- Files stay private. Suppliers upload into their own auth folder; project owners may
-- read only files referenced by a project_files row belonging to their project.

UPDATE storage.buckets
SET file_size_limit = GREATEST(COALESCE(file_size_limit, 0), 52428800),
    allowed_mime_types = ARRAY[
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/dwg',
      'application/x-dwg',
      'application/acad',
      'image/vnd.dwg',
      'image/vnd.dxf',
      'application/dxf',
      'application/x-dxf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'text/plain',
      'application/octet-stream'
    ]
WHERE id = 'intake-files';

DROP POLICY IF EXISTS "Authenticated users can read own intake files" ON storage.objects;
CREATE POLICY "Authenticated users can read own intake files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'intake-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_crafton_staff()
    OR EXISTS (
      SELECT 1
      FROM public.project_files pf
      JOIN public.projects p ON p.id = pf.project_id
      WHERE pf.file_path = storage.objects.name
        AND coalesce(pf.payload ->> 'storage_bucket', 'intake-files') = storage.objects.bucket_id
        AND p.user_id = auth.uid()
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_project_files_shop_drawing_lookup
ON public.project_files (project_id, file_group, created_at DESC)
WHERE file_group = 'supplier_shop_drawing';

COMMENT ON INDEX public.idx_project_files_shop_drawing_lookup
IS 'Latest immutable supplier shop-drawing revision per project/item is resolved from project_files.payload.';
