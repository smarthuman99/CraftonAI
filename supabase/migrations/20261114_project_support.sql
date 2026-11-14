-- Apply after identity + complete_admin_workflow migrations. Separate from intake chat.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE public.project_support_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  client_name text NOT NULL,
  company text,
  project_name text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','needs_human','reviewed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.project_support_turns (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.project_support_sessions(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  request_id uuid NOT NULL,
  question text NOT NULL CHECK (length(question) BETWEEN 1 AND 2000),
  answer text NOT NULL DEFAULT '',
  status text NOT NULL CHECK (status IN ('pending','complete')),
  flags jsonb NOT NULL DEFAULT '[]',
  engine text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]',
  context_snapshot jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, request_id)
);
CREATE TABLE public.project_support_reviews (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.project_support_sessions(id) ON DELETE RESTRICT,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  note text NOT NULL CHECK (length(note) BETWEEN 1 AND 2000),
  status text NOT NULL CHECK (status IN ('reviewed','needs_human')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.project_support_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0,
  lease_id uuid,
  active_until timestamptz
);
CREATE INDEX ON public.project_support_sessions(user_id, updated_at DESC);
CREATE INDEX ON public.project_support_sessions(status, updated_at DESC);
CREATE INDEX ON public.project_support_turns(session_id, created_at);
CREATE INDEX ON public.project_support_reviews(session_id, created_at);
-- Service-only access. All reads, writes and reviewer checks go through authenticated
-- server endpoints. Clients cannot forge assistant replies, evidence or review notes.
ALTER TABLE public.project_support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_support_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_support_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_support_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.project_support_sessions, public.project_support_turns, public.project_support_reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.project_support_sessions, public.project_support_turns TO service_role;
GRANT SELECT, INSERT ON public.project_support_reviews TO service_role;
REVOKE ALL ON public.project_support_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.project_support_limits TO service_role;

CREATE FUNCTION public.acquire_project_support(p_user_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE r project_support_limits; token uuid:=gen_random_uuid();
BEGIN
  INSERT INTO project_support_limits(user_id) VALUES(p_user_id) ON CONFLICT DO NOTHING;
  SELECT * INTO r FROM project_support_limits WHERE user_id=p_user_id FOR UPDATE;
  IF r.active_until>clock_timestamp() THEN RAISE EXCEPTION 'Support request active' USING ERRCODE='55000'; END IF;
  IF r.window_started_at<=clock_timestamp()-interval '1 minute' THEN r.request_count:=0; r.window_started_at:=clock_timestamp(); END IF;
  IF r.request_count>=12 THEN RAISE EXCEPTION 'Support rate limit' USING ERRCODE='55000'; END IF;
  UPDATE project_support_limits SET window_started_at=r.window_started_at,request_count=r.request_count+1,
    lease_id=token,active_until=clock_timestamp()+interval '2 minutes' WHERE user_id=p_user_id;
  RETURN token;
END $$;
CREATE FUNCTION public.release_project_support(p_user_id uuid,p_lease_id uuid) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$
  UPDATE project_support_limits SET active_until=NULL,lease_id=NULL WHERE user_id=p_user_id AND lease_id=p_lease_id;
$$;
CREATE FUNCTION public.begin_project_support_turn() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
  UPDATE project_support_sessions SET updated_at=clock_timestamp(),status=CASE WHEN status='needs_human' OR jsonb_array_length(NEW.flags)>0 THEN 'needs_human' ELSE 'open' END
    WHERE id=NEW.session_id AND user_id=NEW.user_id AND project_id=NEW.project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversation owner mismatch'; END IF;
  IF (SELECT count(*) FROM project_support_turns WHERE session_id=NEW.session_id)>=120 THEN RAISE EXCEPTION 'Conversation is full'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER begin_project_support_turn BEFORE INSERT ON public.project_support_turns FOR EACH ROW EXECUTE FUNCTION public.begin_project_support_turn();
CREATE FUNCTION public.finish_project_support_turn(p_turn_id uuid,p_answer text,p_sources jsonb,p_engine text,p_needs_review boolean) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE sid uuid;
BEGIN
  IF length(p_answer) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Invalid answer'; END IF;
  UPDATE project_support_turns SET answer=p_answer,sources=p_sources,engine=p_engine,status='complete' WHERE id=p_turn_id AND status='pending' RETURNING session_id INTO sid;
  IF sid IS NULL THEN RAISE EXCEPTION 'Turn is no longer pending'; END IF;
  UPDATE project_support_sessions SET updated_at=clock_timestamp(),status=CASE WHEN status='needs_human' OR p_needs_review THEN 'needs_human' ELSE 'open' END WHERE id=sid;
END $$;
CREATE FUNCTION public.recover_project_support(p_user_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
  WITH recovered AS (
    UPDATE project_support_turns SET status='complete',engine='recovery',flags=flags||'["interrupted_response"]'::jsonb,
      answer='上一輪回覆因服務中斷未能完成，您的問題已保存並轉入人工復查。您可以重新提問。 / The previous reply was interrupted. Your question is saved for human review; you may ask again.'
    WHERE user_id=p_user_id AND status='pending' AND created_at<clock_timestamp()-interval '3 minutes' RETURNING session_id
  ) UPDATE project_support_sessions SET status='needs_human',updated_at=clock_timestamp() WHERE id IN (SELECT session_id FROM recovered);
END $$;
REVOKE ALL ON FUNCTION public.acquire_project_support(uuid),public.release_project_support(uuid,uuid),public.begin_project_support_turn(),public.finish_project_support_turn(uuid,text,jsonb,text,boolean),public.recover_project_support(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_project_support(uuid),public.release_project_support(uuid,uuid),public.begin_project_support_turn(),public.finish_project_support_turn(uuid,text,jsonb,text,boolean),public.recover_project_support(uuid) TO service_role;
-- Review decision + note commit together, and never mark newer/unseen messages
-- reviewed. The service verifies an assigned app_metadata role before invoking.
CREATE FUNCTION public.review_project_support(p_session_id uuid, p_reviewer_id uuid,
  p_expected_updated_at timestamptz, p_note text, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF p_status NOT IN ('reviewed','needs_human') OR length(trim(p_note)) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'Invalid review' USING ERRCODE = '22023';
  END IF;
  PERFORM 1 FROM project_support_sessions WHERE id=p_session_id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM project_support_turns WHERE session_id=p_session_id AND status='pending') THEN
    RAISE EXCEPTION 'Conversation changed';
  END IF;
  UPDATE project_support_sessions SET status = p_status, updated_at = clock_timestamp()
    WHERE id = p_session_id AND updated_at = p_expected_updated_at;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversation changed'; END IF;
  INSERT INTO project_support_reviews(id,session_id,reviewer_id,note,status)
    VALUES(gen_random_uuid(),p_session_id,p_reviewer_id,p_note,p_status);
END $$;
REVOKE ALL ON FUNCTION public.review_project_support(uuid,uuid,timestamptz,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_project_support(uuid,uuid,timestamptz,text,text) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
