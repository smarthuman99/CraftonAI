-- Crafton AI - Intake review and pre-quote workflow
-- Run after 20260627_user_identity_and_ownership.sql.
-- Safe to re-run. It also adds the minimum user_id ownership columns if the
-- earlier identity migration has not been applied yet.

ALTER TABLE public.intake_jobs
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE public.workflow_events
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT;

UPDATE public.intake_jobs
SET user_id = requested_by
WHERE user_id IS NULL AND requested_by IS NOT NULL;

ALTER TABLE public.intake_jobs
ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending'
CHECK (review_status IN ('pending', 'revision_requested', 'approved', 'rejected', 'rfq_ready'));

ALTER TABLE public.intake_jobs
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS client_answers JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rfq_status TEXT NOT NULL DEFAULT 'not_started'
CHECK (rfq_status IN ('not_started', 'draft', 'sent', 'priced')),
ADD COLUMN IF NOT EXISTS rfq_draft_json JSONB,
ADD COLUMN IF NOT EXISTS rfq_created_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_intake_jobs_review_status_created_at
ON public.intake_jobs (review_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_intake_jobs_rfq_status_created_at
ON public.intake_jobs (rfq_status, created_at DESC);

DROP POLICY IF EXISTS "Portal users can update own intake jobs" ON public.intake_jobs;
CREATE POLICY "Portal users can update own intake jobs"
ON public.intake_jobs FOR UPDATE TO anon, authenticated
USING (requested_by = auth.uid() OR user_id = auth.uid() OR requested_by IS NULL)
WITH CHECK (requested_by = auth.uid() OR user_id = auth.uid() OR requested_by IS NULL);

DROP POLICY IF EXISTS "Portal users can create workflow events" ON public.workflow_events;
CREATE POLICY "Portal users can create workflow events"
ON public.workflow_events FOR INSERT TO anon, authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

COMMENT ON COLUMN public.intake_jobs.review_status IS 'Cho review lifecycle for parsed intake drafts before RFQ.';
COMMENT ON COLUMN public.intake_jobs.client_answers IS 'Customer answers to Cho or AI clarification questions.';
COMMENT ON COLUMN public.intake_jobs.rfq_draft_json IS 'Pre-quote RFQ package assembled from approved intake specs.';
