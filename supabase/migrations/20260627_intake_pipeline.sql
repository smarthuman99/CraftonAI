-- Crafton AI - Intake Pipeline Extension
-- Run this after schema.sql. It adds a durable file/job layer for AI intake processing.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Storage bucket used by the client portal to upload sketches, PDFs, spreadsheets, and photos.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'intake-files',
    'intake-files',
    false,
    52428800,
    ARRAY[
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'text/plain'
    ]
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS intake_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    original_name TEXT NOT NULL,
    storage_bucket TEXT NOT NULL DEFAULT 'intake-files',
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    file_size BIGINT,
    sha256 TEXT,
    intake_type TEXT NOT NULL DEFAULT 'DESIGN_BRIEF',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS intake_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_file_id UUID REFERENCES intake_files(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'needs_review', 'completed', 'failed')),
    step TEXT NOT NULL DEFAULT 'parse_intake',
    project_name TEXT,
    destination TEXT,
    quantity_text TEXT,
    brief_text TEXT,
    result_json JSONB,
    error_message TEXT,
    attempts INT NOT NULL DEFAULT 0,
    locked_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    job_id UUID REFERENCES intake_jobs(id) ON DELETE SET NULL,
    stage_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT 'system',
    message_cn TEXT NOT NULL,
    message_en TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intake_jobs_status_created_at ON intake_jobs (status, created_at);
CREATE INDEX IF NOT EXISTS idx_intake_jobs_project_id ON intake_jobs (project_id);
CREATE INDEX IF NOT EXISTS idx_intake_files_project_id ON intake_files (project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_project_id ON workflow_events (project_id, created_at DESC);

CREATE OR REPLACE FUNCTION touch_intake_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_intake_jobs_updated_at ON intake_jobs;
CREATE TRIGGER trg_touch_intake_jobs_updated_at
BEFORE UPDATE ON intake_jobs
FOR EACH ROW
EXECUTE FUNCTION touch_intake_jobs_updated_at();

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE intake_files;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE intake_jobs;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE workflow_events;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- RLS is enabled so customer-facing reads/writes can be tightened when Supabase Auth is connected.
ALTER TABLE intake_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;

-- Prototype-friendly policies. Replace with stricter client/company policies before production.
DROP POLICY IF EXISTS "Portal users can create intake files" ON intake_files;
CREATE POLICY "Portal users can create intake files"
ON intake_files FOR INSERT TO anon, authenticated
WITH CHECK (uploaded_by = auth.uid() OR uploaded_by IS NULL);

DROP POLICY IF EXISTS "Portal users can view intake files" ON intake_files;
CREATE POLICY "Portal users can view intake files"
ON intake_files FOR SELECT TO anon, authenticated
USING (uploaded_by = auth.uid() OR uploaded_by IS NULL);

DROP POLICY IF EXISTS "Portal users can create intake jobs" ON intake_jobs;
CREATE POLICY "Portal users can create intake jobs"
ON intake_jobs FOR INSERT TO anon, authenticated
WITH CHECK (requested_by = auth.uid() OR requested_by IS NULL);

DROP POLICY IF EXISTS "Portal users can view intake jobs" ON intake_jobs;
CREATE POLICY "Portal users can view intake jobs"
ON intake_jobs FOR SELECT TO anon, authenticated
USING (requested_by = auth.uid() OR requested_by IS NULL);

DROP POLICY IF EXISTS "Portal users can view workflow events" ON workflow_events;
CREATE POLICY "Portal users can view workflow events"
ON workflow_events FOR SELECT TO anon, authenticated
USING (true);

-- Storage policies for direct portal upload.
DROP POLICY IF EXISTS "Portal users can upload intake files" ON storage.objects;
CREATE POLICY "Portal users can upload intake files"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'intake-files');

DROP POLICY IF EXISTS "Portal users can read intake files" ON storage.objects;
CREATE POLICY "Portal users can read intake files"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'intake-files');

COMMENT ON TABLE intake_files IS 'Customer uploaded source files for AI intake processing.';
COMMENT ON TABLE intake_jobs IS 'Durable queue of AI intake work to be processed by a VPS worker.';
COMMENT ON TABLE workflow_events IS 'Append-only lifecycle events for project workflow observability.';
