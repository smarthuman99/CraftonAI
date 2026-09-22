BEGIN;

-- Existing project uploads are staged until the client confirms the merge.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_edit_revision bigint NOT NULL DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_details jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.intake_jobs ADD COLUMN IF NOT EXISTS client_import_state text
  CHECK (client_import_state IN ('processing', 'preview', 'merged', 'discarded'));
CREATE UNIQUE INDEX IF NOT EXISTS intake_jobs_one_client_import_per_file
  ON public.intake_jobs(intake_file_id) WHERE client_import_state IS NOT NULL;

-- Only the authenticated server may invoke these transactions. It supplies the
-- verified owner, never an owner from the browser request.
CREATE OR REPLACE FUNCTION public.queue_client_project_file(p_project_id uuid, p_owner_id uuid, p_file_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p projects; f intake_files; existing_id uuid; new_id uuid;
BEGIN
  SELECT * INTO p FROM projects WHERE id = p_project_id FOR UPDATE;
  IF p.id IS NULL OR p.user_id IS DISTINCT FROM p_owner_id THEN RAISE EXCEPTION 'Project access denied'; END IF;
  IF coalesce(p.lifecycle_status, 'active') <> 'active' THEN RAISE EXCEPTION 'Project is read-only'; END IF;
  SELECT * INTO f FROM intake_files WHERE id = p_file_id FOR UPDATE;
  IF f.id IS NULL OR f.user_id IS DISTINCT FROM p_owner_id OR (f.project_id IS NOT NULL AND f.project_id <> p.id)
    THEN RAISE EXCEPTION 'File access denied'; END IF;
  SELECT id INTO existing_id FROM intake_jobs WHERE intake_file_id = f.id AND client_import_state IS NOT NULL;
  IF existing_id IS NOT NULL THEN RETURN existing_id; END IF;
  UPDATE intake_files SET project_id = p.id WHERE id = f.id;
  INSERT INTO intake_jobs(project_id, user_id, requested_by, intake_file_id, project_name, destination,
    status, step, client_import_state)
  VALUES(p.id, p_owner_id, p_owner_id, f.id, p.name, p.client_contact, 'queued', 'parse_intake', 'processing')
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.queue_client_project_file(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_client_project_file(uuid, uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.commit_client_project_edit(
  p_project_id uuid, p_owner_id uuid, p_revision bigint, p_expected_jobs jsonb,
  p_project_patch jsonb, p_patches jsonb, p_guard_draft boolean, p_sync_specs boolean,
  p_actor_id uuid, p_operation text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p projects; j intake_jobs; patch jsonb; expected jsonb; item jsonb;
BEGIN
  SELECT * INTO p FROM projects WHERE id = p_project_id FOR UPDATE;
  IF p.id IS NULL OR p.user_id IS DISTINCT FROM p_owner_id THEN RAISE EXCEPTION 'Project access denied'; END IF;
  IF coalesce(p.lifecycle_status, 'active') <> 'active' THEN RAISE EXCEPTION 'Project is read-only'; END IF;
  IF p.client_edit_revision <> p_revision THEN RAISE EXCEPTION 'EDIT_CONFLICT'; END IF;
  PERFORM id FROM intake_jobs WHERE project_id = p.id ORDER BY id FOR UPDATE;
  IF (SELECT count(*) FROM intake_jobs WHERE project_id = p.id) <> jsonb_array_length(p_expected_jobs)
    THEN RAISE EXCEPTION 'EDIT_CONFLICT'; END IF;
  FOR expected IN SELECT value FROM jsonb_array_elements(p_expected_jobs) LOOP
    SELECT * INTO j FROM intake_jobs WHERE id = (expected->>'id')::uuid AND project_id = p.id;
    IF j.id IS NULL OR j.updated_at IS DISTINCT FROM (expected->>'updated_at')::timestamptz
      THEN RAISE EXCEPTION 'EDIT_CONFLICT'; END IF;
  END LOOP;
  IF p_sync_specs AND NOT p_guard_draft THEN RAISE EXCEPTION 'Draft guard required'; END IF;
  IF p_guard_draft AND (p.current_stage >= 6 OR p.selected_supplier IS NOT NULL
    OR EXISTS (SELECT 1 FROM rfq_batches WHERE project_id = p.id)
    OR EXISTS (SELECT 1 FROM supplier_quotes WHERE project_id = p.id)
    OR EXISTS (SELECT 1 FROM approvals WHERE project_id = p.id)
    OR EXISTS (SELECT 1 FROM intake_jobs WHERE project_id = p.id
      AND (client_import_state IS NULL OR client_import_state = 'merged')
      AND (review_status IN ('approved', 'rfq_ready') OR coalesce(rfq_status, 'not_started') <> 'not_started')))
    THEN RAISE EXCEPTION 'EDIT_REVIEW_REQUIRED'; END IF;
  IF p_guard_draft THEN
    FOR item IN SELECT value FROM intake_jobs ij, LATERAL jsonb_array_elements(coalesce(ij.result_json->'items', '[]'))
      WHERE ij.project_id = p.id AND (ij.client_import_state IS NULL OR ij.client_import_state = 'merged') LOOP
      IF item->'technical_drawing'->>'status' IN ('formal', 'approved', 'approved_for_manufacture')
        OR item->'technical_drawing'->>'review_status' = 'approved'
        OR item->'technical_drawing'->>'lifecycle_stage' = 'approved_for_manufacture'
        THEN RAISE EXCEPTION 'EDIT_REVIEW_REQUIRED'; END IF;
    END LOOP;
  END IF;
  UPDATE projects SET name = coalesce(p_project_patch->>'name', name),
    client_details = coalesce(p_project_patch->'client_details', client_details),
    client_edit_revision = client_edit_revision + 1 WHERE id = p.id;
  FOR patch IN SELECT value FROM jsonb_array_elements(p_patches) LOOP
    UPDATE intake_jobs SET result_json = coalesce(patch->'result_json', result_json),
      project_name = coalesce(p_project_patch->>'name', project_name),
      client_import_state = coalesce(patch->>'client_import_state', client_import_state),
      step = coalesce(patch->>'step', step), review_status = coalesce(patch->>'review_status', review_status)
      WHERE id = (patch->>'id')::uuid AND project_id = p.id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Project item access denied'; END IF;
  END LOOP;
  IF p_sync_specs THEN
    -- This table is the provisional BOM. Quoted/approved projects never reach this branch.
    DELETE FROM specifications WHERE project_id = p.id;
    INSERT INTO specifications(project_id, user_id, item_type_cn, item_type_en, quantity,
      material_cn, material_en, original_unit_price, unit_price, notes_cn, notes_en)
    SELECT p.id, p_owner_id, coalesce(i->>'item_type_cn', i->>'item_type_en', ''),
      coalesce(i->>'item_type_en', i->>'item_type_cn', ''), greatest(0, coalesce((i->>'quantity')::numeric, 0))::integer,
      coalesce(i->>'material_cn', ''), coalesce(i->>'material_en', ''),
      greatest(0, coalesce((i->>'original_unit_price')::numeric, 0)), greatest(0, coalesce((i->>'unit_price')::numeric, 0)),
      coalesce(i->>'notes_cn', ''), coalesce(i->>'notes_en', '')
    FROM intake_jobs ij, LATERAL jsonb_array_elements(coalesce(ij.result_json->'items', '[]')) i
    WHERE ij.project_id = p.id AND (ij.client_import_state IS NULL OR ij.client_import_state = 'merged');
  END IF;
  INSERT INTO workflow_events(project_id, user_id, stage_id, event_type, actor, message_cn, message_en, payload)
  VALUES(p.id, p_owner_id, 'S' || lpad(p.current_stage::text, 2, '0'), 'client_project_edit',
    p_actor_id::text, '项目资料已更新', 'Project workspace updated',
    jsonb_build_object('operation', p_operation, 'actor_id', p_actor_id, 'revision', p.client_edit_revision + 1,
      'previous_project', jsonb_build_object('name', p.name, 'client_details', p.client_details),
      'project_changes', p_project_patch, 'job_ids', (SELECT jsonb_agg(value->'id') FROM jsonb_array_elements(p_patches))));
END $$;
REVOKE ALL ON FUNCTION public.commit_client_project_edit(uuid, uuid, bigint, jsonb, jsonb, jsonb, boolean, boolean, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_client_project_edit(uuid, uuid, bigint, jsonb, jsonb, jsonb, boolean, boolean, uuid, text) TO service_role;

-- Older portal policies allow customers to update their own intake rows for
-- clarification answers. Keep that flow, but protect the new import/audit data.
CREATE OR REPLACE FUNCTION public.protect_client_project_edit_history()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role') OR public.is_crafton_staff() THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'projects' THEN
    IF NEW.name IS DISTINCT FROM OLD.name OR NEW.client_edit_revision IS DISTINCT FROM OLD.client_edit_revision
      OR NEW.client_details IS DISTINCT FROM OLD.client_details THEN RAISE EXCEPTION 'Use the project editing service'; END IF;
  ELSE
    IF TG_OP = 'INSERT' THEN
      IF NEW.client_import_state IS NOT NULL OR NEW.result_json ? 'client_change_requests' THEN RAISE EXCEPTION 'Use the project editing service'; END IF;
    ELSIF NEW.client_import_state IS DISTINCT FROM OLD.client_import_state OR OLD.client_import_state IS NOT NULL
      OR NEW.result_json->'client_change_requests' IS DISTINCT FROM OLD.result_json->'client_change_requests'
      OR (SELECT jsonb_agg(i->'client_revisions') FROM jsonb_array_elements(coalesce(NEW.result_json->'items', '[]')) i)
         IS DISTINCT FROM (SELECT jsonb_agg(i->'client_revisions') FROM jsonb_array_elements(coalesce(OLD.result_json->'items', '[]')) i)
      THEN RAISE EXCEPTION 'Use the project editing service'; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_protect_client_edit_project ON public.projects;
CREATE TRIGGER trg_protect_client_edit_project BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.protect_client_project_edit_history();
DROP TRIGGER IF EXISTS trg_protect_client_edit_job ON public.intake_jobs;
CREATE TRIGGER trg_protect_client_edit_job BEFORE INSERT OR UPDATE ON public.intake_jobs FOR EACH ROW EXECUTE FUNCTION public.protect_client_project_edit_history();

CREATE OR REPLACE FUNCTION public.touch_client_project_revision()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.client_edit_revision := OLD.client_edit_revision + 1;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_touch_client_project_revision ON public.projects;
CREATE TRIGGER trg_touch_client_project_revision BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_client_project_revision();

NOTIFY pgrst, 'reload schema';
COMMIT;
