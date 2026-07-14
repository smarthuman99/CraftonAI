-- Crafton AI - Milestone 1 intake acceptance hardening
-- Run after 20260629_intake_review_prequote.sql.
-- This migration removes prototype anon access and keeps the real flow:
-- authenticated client upload -> owned intake job -> service-role worker -> Cho staff review.

CREATE OR REPLACE FUNCTION public.is_crafton_staff()
RETURNS BOOLEAN AS $$
    SELECT coalesce((auth.jwt() ->> 'email') ILIKE '%@crafton.com', false);
$$ LANGUAGE sql STABLE;

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/avif',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/csv',
    'text/plain',
    'application/json'
]
WHERE id = 'intake-files';

ALTER TABLE public.intake_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Portal users can create intake files" ON public.intake_files;
DROP POLICY IF EXISTS "Portal users can view intake files" ON public.intake_files;
DROP POLICY IF EXISTS "Portal users can create intake jobs" ON public.intake_jobs;
DROP POLICY IF EXISTS "Portal users can view intake jobs" ON public.intake_jobs;
DROP POLICY IF EXISTS "Portal users can update own intake jobs" ON public.intake_jobs;
DROP POLICY IF EXISTS "Portal users can view workflow events" ON public.workflow_events;
DROP POLICY IF EXISTS "Portal users can create workflow events" ON public.workflow_events;

DROP POLICY IF EXISTS "Users can manage owned intake files" ON public.intake_files;
CREATE POLICY "Users can manage owned intake files"
ON public.intake_files FOR ALL TO authenticated
USING (user_id = auth.uid() OR uploaded_by = auth.uid() OR public.is_crafton_staff())
WITH CHECK (user_id = auth.uid() OR uploaded_by = auth.uid() OR public.is_crafton_staff());

DROP POLICY IF EXISTS "Users can manage owned intake jobs" ON public.intake_jobs;
CREATE POLICY "Users can manage owned intake jobs"
ON public.intake_jobs FOR ALL TO authenticated
USING (user_id = auth.uid() OR requested_by = auth.uid() OR public.is_crafton_staff())
WITH CHECK (user_id = auth.uid() OR requested_by = auth.uid() OR public.is_crafton_staff());

DROP POLICY IF EXISTS "Users can view owned workflow events" ON public.workflow_events;
CREATE POLICY "Users can view owned workflow events"
ON public.workflow_events FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Authenticated users can create owned workflow events" ON public.workflow_events;
CREATE POLICY "Authenticated users can create owned workflow events"
ON public.workflow_events FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_crafton_staff());

DROP POLICY IF EXISTS "Portal users can upload intake files" ON storage.objects;
DROP POLICY IF EXISTS "Portal users can read intake files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload own intake files" ON storage.objects;
CREATE POLICY "Authenticated users can upload own intake files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'intake-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authenticated users can read own intake files" ON storage.objects;
CREATE POLICY "Authenticated users can read own intake files"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'intake-files'
    AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR public.is_crafton_staff()
    )
);

COMMENT ON POLICY "Users can manage owned intake jobs" ON public.intake_jobs
IS 'Milestone 1: clients manage their own intake jobs; @crafton.com staff can review all jobs in Backoffice.';
