-- Crafton AI - User identity and business ownership model
-- Run after:
-- 1. schema.sql
-- 2. supabase/migrations/20260627_intake_pipeline.sql
-- 3. supabase/migrations/20260627_ai_support_conversations.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.generate_public_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'usr_' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 12));
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_crafton_staff()
RETURNS BOOLEAN AS $$
    SELECT coalesce((auth.jwt() ->> 'email') ILIKE '%@crafton.com', false);
$$ LANGUAGE sql STABLE;

CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    public_id TEXT NOT NULL UNIQUE DEFAULT public.generate_public_user_id(),
    full_name TEXT,
    company TEXT,
    preferred_messenger TEXT,
    messenger_id TEXT,
    avatar_url TEXT,
    locale TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'Asia/Taipei',
    onboarding_status TEXT NOT NULL DEFAULT 'new' CHECK (onboarding_status IN ('new', 'active', 'disabled')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.account_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('email', 'google', 'apple')),
    provider_subject TEXT NOT NULL,
    email TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (provider, provider_subject),
    UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_account_identities_user_id ON public.account_identities (user_id);

DROP TRIGGER IF EXISTS trg_touch_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_touch_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id,
        full_name,
        company,
        preferred_messenger,
        messenger_id,
        avatar_url
    )
    VALUES (
        NEW.id,
        coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
        NEW.raw_user_meta_data ->> 'company',
        NEW.raw_user_meta_data ->> 'preferred_messenger',
        NEW.raw_user_meta_data ->> 'messenger_id',
        NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.specifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.agent_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.agent_thought_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.intake_files ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.intake_jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.workflow_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.ai_support_conversations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.ai_support_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT;

UPDATE public.intake_files SET user_id = uploaded_by WHERE user_id IS NULL AND uploaded_by IS NOT NULL;
UPDATE public.intake_jobs SET user_id = requested_by WHERE user_id IS NULL AND requested_by IS NOT NULL;
UPDATE public.ai_support_conversations SET user_id = requested_by WHERE user_id IS NULL AND requested_by IS NOT NULL;

UPDATE public.specifications s
SET user_id = p.user_id
FROM public.projects p
WHERE s.project_id = p.id AND s.user_id IS NULL AND p.user_id IS NOT NULL;

UPDATE public.payments pay
SET user_id = p.user_id
FROM public.projects p
WHERE pay.project_id = p.id AND pay.user_id IS NULL AND p.user_id IS NOT NULL;

UPDATE public.agent_logs l
SET user_id = p.user_id
FROM public.projects p
WHERE l.project_id = p.id AND l.user_id IS NULL AND p.user_id IS NOT NULL;

UPDATE public.agent_thought_logs tl
SET user_id = p.user_id
FROM public.projects p
WHERE tl.project_id = p.id AND tl.user_id IS NULL AND p.user_id IS NOT NULL;

UPDATE public.workflow_events e
SET user_id = p.user_id
FROM public.projects p
WHERE e.project_id = p.id AND e.user_id IS NULL AND p.user_id IS NOT NULL;

UPDATE public.ai_support_messages m
SET user_id = c.user_id
FROM public.ai_support_conversations c
WHERE m.conversation_id = c.id AND m.user_id IS NULL AND c.user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_user_id_created_at ON public.projects (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_specifications_user_id_project_id ON public.specifications (user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id_project_id ON public.payments (user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id_project_id ON public.agent_logs (user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_agent_thought_logs_user_id_project_id ON public.agent_thought_logs (user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_intake_files_user_id_created_at ON public.intake_files (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intake_jobs_user_id_created_at ON public.intake_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_events_user_id_project_id ON public.workflow_events (user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_ai_support_conversations_user_id_created_at ON public.ai_support_conversations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_support_messages_user_id_conversation_id ON public.ai_support_messages (user_id, conversation_id);

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_user_id_name_unique ON public.projects (user_id, name) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_unowned_name_unique ON public.projects (name) WHERE user_id IS NULL;

CREATE OR REPLACE FUNCTION public.set_direct_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
        NEW.user_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_project_child_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL AND NEW.project_id IS NOT NULL THEN
        SELECT p.user_id INTO NEW.user_id
        FROM public.projects p
        WHERE p.id = NEW.project_id;
    END IF;

    IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
        NEW.user_id = auth.uid();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_ai_message_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        SELECT c.user_id INTO NEW.user_id
        FROM public.ai_support_conversations c
        WHERE c.id = NEW.conversation_id;
    END IF;

    IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
        NEW.user_id = auth.uid();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_projects_set_user_id ON public.projects;
CREATE TRIGGER trg_projects_set_user_id
BEFORE INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.set_direct_user_id();

DROP TRIGGER IF EXISTS trg_intake_files_set_user_id ON public.intake_files;
CREATE TRIGGER trg_intake_files_set_user_id
BEFORE INSERT ON public.intake_files
FOR EACH ROW
EXECUTE FUNCTION public.set_direct_user_id();

DROP TRIGGER IF EXISTS trg_intake_jobs_set_user_id ON public.intake_jobs;
CREATE TRIGGER trg_intake_jobs_set_user_id
BEFORE INSERT ON public.intake_jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_direct_user_id();

DROP TRIGGER IF EXISTS trg_ai_support_conversations_set_user_id ON public.ai_support_conversations;
CREATE TRIGGER trg_ai_support_conversations_set_user_id
BEFORE INSERT ON public.ai_support_conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_direct_user_id();

DROP TRIGGER IF EXISTS trg_specifications_set_user_id ON public.specifications;
CREATE TRIGGER trg_specifications_set_user_id
BEFORE INSERT ON public.specifications
FOR EACH ROW
EXECUTE FUNCTION public.set_project_child_user_id();

DROP TRIGGER IF EXISTS trg_payments_set_user_id ON public.payments;
CREATE TRIGGER trg_payments_set_user_id
BEFORE INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.set_project_child_user_id();

DROP TRIGGER IF EXISTS trg_agent_logs_set_user_id ON public.agent_logs;
CREATE TRIGGER trg_agent_logs_set_user_id
BEFORE INSERT ON public.agent_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_project_child_user_id();

DROP TRIGGER IF EXISTS trg_agent_thought_logs_set_user_id ON public.agent_thought_logs;
CREATE TRIGGER trg_agent_thought_logs_set_user_id
BEFORE INSERT ON public.agent_thought_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_project_child_user_id();

DROP TRIGGER IF EXISTS trg_workflow_events_set_user_id ON public.workflow_events;
CREATE TRIGGER trg_workflow_events_set_user_id
BEFORE INSERT ON public.workflow_events
FOR EACH ROW
EXECUTE FUNCTION public.set_project_child_user_id();

DROP TRIGGER IF EXISTS trg_ai_support_messages_set_user_id ON public.ai_support_messages;
CREATE TRIGGER trg_ai_support_messages_set_user_id
BEFORE INSERT ON public.ai_support_messages
FOR EACH ROW
EXECUTE FUNCTION public.set_ai_message_user_id();

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_thought_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
CREATE POLICY "Users can manage their own profile"
ON public.user_profiles FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_crafton_staff())
WITH CHECK (user_id = auth.uid() OR public.is_crafton_staff());

DROP POLICY IF EXISTS "Users can manage their own identities" ON public.account_identities;
CREATE POLICY "Users can manage their own identities"
ON public.account_identities FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_crafton_staff())
WITH CHECK (user_id = auth.uid() OR public.is_crafton_staff());

DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
CREATE POLICY "Users can manage their own projects"
ON public.projects FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_crafton_staff())
WITH CHECK (user_id = auth.uid() OR public.is_crafton_staff());

DROP POLICY IF EXISTS "Users can manage owned specifications" ON public.specifications;
CREATE POLICY "Users can manage owned specifications"
ON public.specifications FOR ALL TO authenticated
USING (
    user_id = auth.uid()
    OR public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
)
WITH CHECK (
    user_id = auth.uid()
    OR public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage owned payments" ON public.payments;
CREATE POLICY "Users can manage owned payments"
ON public.payments FOR ALL TO authenticated
USING (
    user_id = auth.uid()
    OR public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
)
WITH CHECK (
    user_id = auth.uid()
    OR public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage owned agent logs" ON public.agent_logs;
CREATE POLICY "Users can manage owned agent logs"
ON public.agent_logs FOR ALL TO authenticated
USING (
    user_id = auth.uid()
    OR public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
)
WITH CHECK (
    user_id = auth.uid()
    OR public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage owned agent thoughts" ON public.agent_thought_logs;
CREATE POLICY "Users can manage owned agent thoughts"
ON public.agent_thought_logs FOR ALL TO authenticated
USING (
    user_id = auth.uid()
    OR public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
)
WITH CHECK (
    user_id = auth.uid()
    OR public.is_crafton_staff()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

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

DROP POLICY IF EXISTS "Users can manage owned support conversations" ON public.ai_support_conversations;
CREATE POLICY "Users can manage owned support conversations"
ON public.ai_support_conversations FOR ALL TO authenticated
USING (user_id = auth.uid() OR requested_by = auth.uid() OR public.is_crafton_staff())
WITH CHECK (user_id = auth.uid() OR requested_by = auth.uid() OR public.is_crafton_staff());

DROP POLICY IF EXISTS "Users can manage owned support messages" ON public.ai_support_messages;
CREATE POLICY "Users can manage owned support messages"
ON public.ai_support_messages FOR ALL TO authenticated
USING (
    user_id = auth.uid()
    OR public.is_crafton_staff()
    OR EXISTS (
        SELECT 1 FROM public.ai_support_conversations c
        WHERE c.id = conversation_id
          AND (c.user_id = auth.uid() OR c.requested_by = auth.uid())
    )
)
WITH CHECK (
    user_id = auth.uid()
    OR public.is_crafton_staff()
    OR EXISTS (
        SELECT 1 FROM public.ai_support_conversations c
        WHERE c.id = conversation_id
          AND (c.user_id = auth.uid() OR c.requested_by = auth.uid())
    )
);

DROP POLICY IF EXISTS "Portal users can create intake files" ON public.intake_files;
DROP POLICY IF EXISTS "Portal users can view intake files" ON public.intake_files;
DROP POLICY IF EXISTS "Portal users can create intake jobs" ON public.intake_jobs;
DROP POLICY IF EXISTS "Portal users can view intake jobs" ON public.intake_jobs;
DROP POLICY IF EXISTS "Portal users can view workflow events" ON public.workflow_events;
DROP POLICY IF EXISTS "Portal users can create support conversations" ON public.ai_support_conversations;
DROP POLICY IF EXISTS "Portal users can view support conversations" ON public.ai_support_conversations;
DROP POLICY IF EXISTS "Portal users can update support conversations" ON public.ai_support_conversations;
DROP POLICY IF EXISTS "Portal users can create support messages" ON public.ai_support_messages;
DROP POLICY IF EXISTS "Portal users can view support messages" ON public.ai_support_messages;

DROP POLICY IF EXISTS "Portal users can upload intake files" ON storage.objects;
CREATE POLICY "Authenticated users can upload own intake files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'intake-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Portal users can read intake files" ON storage.objects;
CREATE POLICY "Authenticated users can read own intake files"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'intake-files'
    AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR public.is_crafton_staff()
    )
);

COMMENT ON TABLE public.user_profiles IS 'Application profile keyed by auth.users.id. user_id is the only durable account identifier used by business data.';
COMMENT ON TABLE public.account_identities IS 'Login provider identities linked to the internal auth user. Business tables never use provider IDs as owners.';
COMMENT ON COLUMN public.projects.user_id IS 'Owner auth.users.id. All orders/projects belong to this internal user id.';
COMMENT ON COLUMN public.ai_support_conversations.user_id IS 'Owner auth.users.id for AI support conversations.';
COMMENT ON COLUMN public.intake_jobs.user_id IS 'Owner auth.users.id for AI intake workflow jobs.';
