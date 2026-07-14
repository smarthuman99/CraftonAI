-- Crafton AI - Complete S06-S17 admin workflow
-- Run after 20260708_admin_operations_workspace.sql.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE public.suppliers
    ADD COLUMN IF NOT EXISTS code TEXT,
    ADD COLUMN IF NOT EXISTS contact_position TEXT,
    ADD COLUMN IF NOT EXISTS reliability_score NUMERIC,
    ADD COLUMN IF NOT EXISTS currencies TEXT[] DEFAULT ARRAY['USD']::TEXT[],
    ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_code_unique
ON public.suppliers (code) WHERE code IS NOT NULL;

ALTER TABLE public.rfq_batches
    ADD COLUMN IF NOT EXISTS intake_job_id UUID REFERENCES public.intake_jobs(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS supplier_ids UUID[] DEFAULT ARRAY[]::UUID[],
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.supplier_quotes
    ADD COLUMN IF NOT EXISTS quote_code TEXT,
    ADD COLUMN IF NOT EXISTS moq INT,
    ADD COLUMN IF NOT EXISTS reliability_score NUMERIC,
    ADD COLUMN IF NOT EXISTS material_confirmation TEXT,
    ADD COLUMN IF NOT EXISTS validity_until DATE,
    ADD COLUMN IF NOT EXISTS recommendation TEXT,
    ADD COLUMN IF NOT EXISTS risk_notes TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;

ALTER TABLE public.inspection_reports
    ADD COLUMN IF NOT EXISTS color_score NUMERIC,
    ADD COLUMN IF NOT EXISTS geometry_score NUMERIC,
    ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

ALTER TABLE public.shipment_documents
    ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.production_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    stage_id TEXT NOT NULL DEFAULT 'S09',
    item_name TEXT,
    process_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    progress_percent NUMERIC NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    risk_level TEXT NOT NULL DEFAULT 'low',
    expected_at TIMESTAMPTZ,
    reported_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    evidence JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.packing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    stage_id TEXT NOT NULL DEFAULT 'S12',
    status TEXT NOT NULL DEFAULT 'draft',
    engine_mode TEXT NOT NULL DEFAULT 'fast',
    container_type TEXT,
    total_containers INT NOT NULL DEFAULT 0,
    utilization_percent NUMERIC,
    unpacked_count INT NOT NULL DEFAULT 0,
    plan_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    generated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    stage_id TEXT NOT NULL DEFAULT 'S14',
    reference_number TEXT,
    carrier TEXT,
    vessel_name TEXT,
    origin TEXT,
    destination TEXT,
    etd TIMESTAMPTZ,
    eta TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'booking',
    current_location TEXT,
    tracking_url TEXT,
    container_type TEXT,
    container_count INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quantity_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    stage_id TEXT NOT NULL DEFAULT 'S15',
    item_name TEXT NOT NULL,
    original_quantity NUMERIC NOT NULL,
    revised_quantity NUMERIC NOT NULL,
    unit_price NUMERIC DEFAULT 0,
    financial_impact NUMERIC DEFAULT 0,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'approved',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.handover_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    stage_id TEXT NOT NULL DEFAULT 'S16',
    status TEXT NOT NULL DEFAULT 'pending',
    accepted_quantity NUMERIC DEFAULT 0,
    issue_summary TEXT,
    signed_by TEXT,
    signed_at TIMESTAMPTZ,
    evidence JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_production_updates_project_created
ON public.production_updates (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_packing_plans_project_created
ON public.packing_plans (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_project_created
ON public.shipments (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quantity_adjustments_project_created
ON public.quantity_adjustments (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handover_reports_project_created
ON public.handover_reports (project_id, created_at DESC);

ALTER TABLE public.production_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantity_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_reports ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'production_updates', 'packing_plans', 'shipments',
        'quantity_adjustments', 'handover_reports'
    ] LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Users can view owned %s" ON public.%I', table_name, table_name);
        EXECUTE format(
            'CREATE POLICY "Users can view owned %s" ON public.%I FOR SELECT TO authenticated USING (public.is_crafton_staff() OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()))',
            table_name, table_name
        );
        EXECUTE format('DROP POLICY IF EXISTS "Staff can manage %s" ON public.%I', table_name, table_name);
        EXECUTE format(
            'CREATE POLICY "Staff can manage %s" ON public.%I FOR ALL TO authenticated USING (public.is_crafton_staff()) WITH CHECK (public.is_crafton_staff())',
            table_name, table_name
        );
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.touch_admin_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'suppliers', 'rfq_batches', 'supplier_quotes', 'approvals',
        'inspection_reports', 'shipment_documents', 'production_updates',
        'packing_plans', 'shipments', 'handover_reports'
    ] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_%s ON public.%I', table_name, table_name);
        EXECUTE format(
            'CREATE TRIGGER trg_touch_%s BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_admin_workflow_updated_at()',
            table_name, table_name
        );
    END LOOP;
END $$;

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'production_updates', 'packing_plans', 'shipments',
        'quantity_adjustments', 'handover_reports'
    ] LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END LOOP;
END $$;

COMMENT ON TABLE public.production_updates IS 'S09-S10 production milestones, progress, risks and evidence.';
COMMENT ON TABLE public.packing_plans IS 'S12 Loading AI container plans and utilization results.';
COMMENT ON TABLE public.shipments IS 'S14 shipment booking and tracking state.';
COMMENT ON TABLE public.quantity_adjustments IS 'S15 approved split-delivery and quantity recalculations.';
COMMENT ON TABLE public.handover_reports IS 'S16 client acceptance and issue evidence.';
