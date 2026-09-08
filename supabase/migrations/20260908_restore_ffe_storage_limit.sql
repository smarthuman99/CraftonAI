-- Client FF&E and supplier drawings share this bucket. Supplier workspace reads
-- must not overwrite its configuration or lower the FF&E limit.
-- Keep existing MIME types and private access policies unchanged.
UPDATE storage.buckets
SET file_size_limit = GREATEST(COALESCE(file_size_limit, 0), 262144000)
WHERE id = 'intake-files';
