-- Crafton AI - Admin operations workspace tables
-- Supports the four Backoffice progress boards after intake acceptance.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.is_crafton_staff()
RETURNS BOOLEAN AS $$
    SELECT coalesce((auth.jwt() ->> 'email') ILIKE '%@crafton.com', false);
$$ LANGUAGE sql STABLE;

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    contact_name TEXT,
    contact_email TEXT,
    phone TEXT,
    country TEXT,
    city TEXT,
    quality_score NUMERIC,
    status TEXT NOT NULL DEFAULT 'active',
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rfq_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rfq_code TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    supplier_count INT DEFAULT 0,
    invited_count INT DEFAULT 0,
    sent_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.supplier_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    rfq_batch_id UUID REFERENCES public.rfq_batches(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT,
    currency TEXT DEFAULT 'USD',
    unit_price NUMERIC,
    total_amount NUMERIC,
    lead_time_days INT,
    quality_score NUMERIC,
    payment_terms TEXT,
    ai_verdict TEXT,
    status TEXT NOT NULL DEFAULT 'quoted',
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    stage_id TEXT NOT NULL,
    approval_type TEXT NOT NULL DEFAULT 'stage_review',
    status TEXT NOT NULL DEFAULT 'pending',
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewer_name TEXT,
    notes TEXT,
    reviewed_at TIMESTAMPTZ,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inspection_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    stage_id TEXT NOT NULL DEFAULT 'S11',
    report_code TEXT,
    item_name TEXT,
    work_package TEXT,
    ai_match_score NUMERIC,
    status TEXT NOT NULL DEFAULT 'pending',
    issues JSONB DEFAULT '[]'::jsonb,
    inspected_at TIMESTAMPTZ,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shipment_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    stage_id TEXT NOT NULL,
    document_type TEXT NOT NULL,
    document_name TEXT,
    file_path TEXT,
    file_url TEXT,
    version TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    check_result TEXT,
    notes TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    stage_id TEXT,
    file_group TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT,
    file_url TEXT,
    sha256 TEXT,
    audit_hash TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rfq_batches_project_created ON public.rfq_batches (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_project_created ON public.supplier_quotes (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_batch ON public.supplier_quotes (rfq_batch_id);
CREATE INDEX IF NOT EXISTS idx_approvals_project_stage ON public.approvals (project_id, stage_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspection_reports_project_stage ON public.inspection_reports (project_id, stage_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipment_documents_project_stage ON public.shipment_documents (project_id, stage_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_files_project_stage ON public.project_files (project_id, stage_id, created_at DESC);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can view suppliers"
ON public.suppliers FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Staff can manage suppliers" ON public.suppliers;
CREATE POLICY "Staff can manage suppliers"
ON public.suppliers FOR ALL TO authenticated
USING (public.is_crafton_staff())
WITH CHECK (public.is_crafton_staff());

DROP POLICY IF EXISTS "Users can view project rfq batches" ON public.rfq_batches;
CREATE POLICY "Users can view project rfq batches"
ON public.rfq_batches FOR SELECT TO authenticated
USING (
    public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Staff can manage project rfq batches" ON public.rfq_batches;
CREATE POLICY "Staff can manage project rfq batches"
ON public.rfq_batches FOR ALL TO authenticated
USING (public.is_crafton_staff())
WITH CHECK (public.is_crafton_staff());

DROP POLICY IF EXISTS "Users can view supplier quotes" ON public.supplier_quotes;
CREATE POLICY "Users can view supplier quotes"
ON public.supplier_quotes FOR SELECT TO authenticated
USING (
    public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Staff can manage supplier quotes" ON public.supplier_quotes;
CREATE POLICY "Staff can manage supplier quotes"
ON public.supplier_quotes FOR ALL TO authenticated
USING (public.is_crafton_staff())
WITH CHECK (public.is_crafton_staff());

DROP POLICY IF EXISTS "Users can view project approvals" ON public.approvals;
CREATE POLICY "Users can view project approvals"
ON public.approvals FOR SELECT TO authenticated
USING (
    public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Staff can manage project approvals" ON public.approvals;
CREATE POLICY "Staff can manage project approvals"
ON public.approvals FOR ALL TO authenticated
USING (public.is_crafton_staff())
WITH CHECK (public.is_crafton_staff());

DROP POLICY IF EXISTS "Users can view inspection reports" ON public.inspection_reports;
CREATE POLICY "Users can view inspection reports"
ON public.inspection_reports FOR SELECT TO authenticated
USING (
    public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Staff can manage inspection reports" ON public.inspection_reports;
CREATE POLICY "Staff can manage inspection reports"
ON public.inspection_reports FOR ALL TO authenticated
USING (public.is_crafton_staff())
WITH CHECK (public.is_crafton_staff());

DROP POLICY IF EXISTS "Users can view shipment documents" ON public.shipment_documents;
CREATE POLICY "Users can view shipment documents"
ON public.shipment_documents FOR SELECT TO authenticated
USING (
    public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Staff can manage shipment documents" ON public.shipment_documents;
CREATE POLICY "Staff can manage shipment documents"
ON public.shipment_documents FOR ALL TO authenticated
USING (public.is_crafton_staff())
WITH CHECK (public.is_crafton_staff());

DROP POLICY IF EXISTS "Users can view project files" ON public.project_files;
CREATE POLICY "Users can view project files"
ON public.project_files FOR SELECT TO authenticated
USING (
    public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Staff can manage project files" ON public.project_files;
CREATE POLICY "Staff can manage project files"
ON public.project_files FOR ALL TO authenticated
USING (public.is_crafton_staff())
WITH CHECK (public.is_crafton_staff());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_batches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approvals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipment_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_files TO authenticated;

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.rfq_batches;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_quotes;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.approvals;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.inspection_reports;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.shipment_documents;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.project_files;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
