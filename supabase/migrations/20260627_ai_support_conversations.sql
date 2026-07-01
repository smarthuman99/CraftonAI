-- Crafton AI - AI Customer Service Conversation Persistence
-- Run this after 20260627_intake_pipeline.sql.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS ai_support_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_name TEXT,
    client_email TEXT,
    company TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'submitted', 'closed')),
    project_name TEXT,
    destination TEXT,
    quantity_text TEXT,
    summary_text TEXT,
    latest_intake_file_id UUID REFERENCES intake_files(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_support_conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('client', 'ai', 'system')),
    message_text TEXT NOT NULL,
    attachment_file_id UUID REFERENCES intake_files(id) ON DELETE SET NULL,
    ai_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_support_conversations_requested_by ON ai_support_conversations (requested_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_support_messages_conversation_id ON ai_support_messages (conversation_id, created_at ASC);

CREATE OR REPLACE FUNCTION touch_ai_support_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_ai_support_conversations_updated_at ON ai_support_conversations;
CREATE TRIGGER trg_touch_ai_support_conversations_updated_at
BEFORE UPDATE ON ai_support_conversations
FOR EACH ROW
EXECUTE FUNCTION touch_ai_support_conversations_updated_at();

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE ai_support_conversations;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE ai_support_messages;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

ALTER TABLE ai_support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Portal users can create support conversations" ON ai_support_conversations;
CREATE POLICY "Portal users can create support conversations"
ON ai_support_conversations FOR INSERT TO anon, authenticated
WITH CHECK (requested_by = auth.uid() OR requested_by IS NULL);

DROP POLICY IF EXISTS "Portal users can view support conversations" ON ai_support_conversations;
CREATE POLICY "Portal users can view support conversations"
ON ai_support_conversations FOR SELECT TO anon, authenticated
USING (requested_by = auth.uid() OR requested_by IS NULL);

DROP POLICY IF EXISTS "Portal users can update support conversations" ON ai_support_conversations;
CREATE POLICY "Portal users can update support conversations"
ON ai_support_conversations FOR UPDATE TO anon, authenticated
USING (requested_by = auth.uid() OR requested_by IS NULL)
WITH CHECK (requested_by = auth.uid() OR requested_by IS NULL);

DROP POLICY IF EXISTS "Portal users can create support messages" ON ai_support_messages;
CREATE POLICY "Portal users can create support messages"
ON ai_support_messages FOR INSERT TO anon, authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM ai_support_conversations c
        WHERE c.id = conversation_id
          AND (c.requested_by = auth.uid() OR c.requested_by IS NULL)
    )
);

DROP POLICY IF EXISTS "Portal users can view support messages" ON ai_support_messages;
CREATE POLICY "Portal users can view support messages"
ON ai_support_messages FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM ai_support_conversations c
        WHERE c.id = conversation_id
          AND (c.requested_by = auth.uid() OR c.requested_by IS NULL)
    )
);

COMMENT ON TABLE ai_support_conversations IS 'AI customer service conversations before a project brief is submitted.';
COMMENT ON TABLE ai_support_messages IS 'Durable AI customer service message transcript, including attachment references.';
