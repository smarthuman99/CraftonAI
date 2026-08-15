-- Allow one-piece FF&E PDF uploads while the worker processes the document in page batches.
UPDATE storage.buckets
SET file_size_limit = 262144000
WHERE id = 'intake-files';

CREATE INDEX IF NOT EXISTS idx_intake_jobs_processing_updated_at
ON public.intake_jobs (updated_at)
WHERE status = 'processing';
