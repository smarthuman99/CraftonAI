-- Crafton AI - reversible project retirement and audited permanent deletion

ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'active'
        CHECK (lifecycle_status IN ('active', 'abandoned', 'archived')),
    ADD COLUMN IF NOT EXISTS retirement_reason TEXT,
    ADD COLUMN IF NOT EXISTS abandoned_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS lifecycle_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    ADD COLUMN IF NOT EXISTS lifecycle_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_lifecycle_status_created_at
ON public.projects (lifecycle_status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.project_lifecycle_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID,
    project_name TEXT NOT NULL,
    previous_status TEXT,
    next_status TEXT NOT NULL,
    reason TEXT,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_lifecycle_audit_project_created
ON public.project_lifecycle_audit (project_id, created_at DESC);

ALTER TABLE public.project_lifecycle_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view project lifecycle audit" ON public.project_lifecycle_audit;
CREATE POLICY "Staff can view project lifecycle audit"
ON public.project_lifecycle_audit FOR SELECT TO authenticated
USING (public.is_crafton_staff());

GRANT SELECT ON public.project_lifecycle_audit TO authenticated;

COMMENT ON COLUMN public.projects.lifecycle_status IS
'Operational visibility state. Abandoned and archived projects are excluded from active Back Office metrics and automation.';
COMMENT ON TABLE public.project_lifecycle_audit IS
'Append-only staff audit retained after a project is permanently deleted.';
