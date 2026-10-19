-- Small, write-maintained projections. Original jobs and evidence remain unchanged.
BEGIN;
CREATE TABLE IF NOT EXISTS public.portal_job_summaries (
 job_id uuid PRIMARY KEY REFERENCES public.intake_jobs(id) ON DELETE CASCADE,
 project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
 owner_id uuid, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 project_name text, destination text, status text, review_status text, rfq_status text,
 active boolean NOT NULL, is_addition boolean NOT NULL,
 items jsonb NOT NULL DEFAULT '[]', pieces numeric NOT NULL DEFAULT 0,
 cover jsonb, source jsonb, lifecycle text NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS portal_summary_owner_created ON public.portal_job_summaries(owner_id, created_at DESC, job_id DESC);
CREATE INDEX IF NOT EXISTS portal_summary_project ON public.portal_job_summaries(project_id);
ALTER TABLE public.portal_job_summaries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.portal_job_summaries FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.portal_job_summaries TO service_role;

-- Match existing Item Passport QR identifiers without loading original job JSON.
CREATE OR REPLACE FUNCTION public.portal_identity_token(value text, width integer)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE h bigint:=2166136261; c text; code integer; token text:='';
BEGIN
 FOR c IN SELECT regexp_split_to_table(value,'') LOOP
  code:=ascii(c); IF code>65535 THEN code:=55296+(code-65536)/1024; END IF;
  h:=((h # code::bigint)*16777619)%4294967296;
 END LOOP;
 LOOP token:=substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',(h%36)::integer+1,1)||token; h:=h/36; EXIT WHEN h=0; END LOOP;
 RETURN right(repeat('0',width)||token,width);
END $$;
REVOKE ALL ON FUNCTION public.portal_identity_token(text,integer) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.portal_summarize_job(j public.intake_jobs)
RETURNS public.portal_job_summaries LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE s public.portal_job_summaries; item jsonb; small jsonb; idx integer:=0; f public.intake_files; n text;
BEGIN
 SELECT * INTO f FROM public.intake_files WHERE id=j.intake_file_id;
 s.job_id:=j.id; s.project_id:=j.project_id; s.owner_id:=coalesce(j.user_id,j.requested_by,f.user_id,f.uploaded_by);
 s.created_at:=j.created_at; s.updated_at:=j.updated_at;
 s.project_name:=coalesce(j.project_name,j.result_json#>>'{project,name}','Untitled project');
 s.destination:=coalesce(j.destination,j.result_json#>>'{project,destination}','');
 s.status:=j.status; s.review_status:=coalesce(j.review_status,CASE WHEN j.status='completed' THEN 'approved' ELSE 'pending' END);
 s.rfq_status:=j.rfq_status; s.active:=j.client_import_state IS NULL OR j.client_import_state='merged';
 s.is_addition:=j.client_import_state IS NOT NULL; s.items:='[]'; s.pieces:=0;
 s.lifecycle:=coalesce(j.result_json#>>'{project_lifecycle,status}','active');
 s.source:=jsonb_build_object('bucket',f.storage_bucket,'path',f.storage_path,'mime',f.mime_type);
 FOR item IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(j.result_json->'items')='array' THEN j.result_json->'items' ELSE '[]' END) LOOP
   n:=substring(coalesce(item->>'quantity',item->>'qty',item->>'quantity_text','0') FROM '[0-9]+(?:\.[0-9]+)?');
   small:=jsonb_build_object('index',idx,'id',coalesce(item->>'id','DRAFT-ITEM-'||(idx+1)),
    'name',left(coalesce(item->>'item_type_en',item->>'typeEn',item->>'item_type_cn','Furniture'),240),
    'nameCn',left(coalesce(item->>'item_type_cn',item->>'typeCn',item->>'item_type_en','家具'),240),
    'quantity',coalesce(n::numeric,0),'quantityText',left(coalesce(item->>'quantity_text',n,'0'),80),
    'tracking',coalesce(item->>'tracking_id',item->>'trackingId',item->>'qr_tracking_id',item->>'qrTrackingId',item#>>'{technical_drawing,tracking_id}',item#>>'{technicalDrawing,trackingId}',''),
    'bucket',item->>'image_storage_bucket','path',item->>'image_storage_path',
    'drawing',jsonb_build_object('bucket',item#>>'{technical_drawing,storage_bucket}',
      'path',coalesce(item#>>'{technical_drawing,formal_storage_path}',item#>>'{technical_drawing,drawing_storage_path}',item#>>'{technical_drawing,draft_storage_path}')));
   s.items:=s.items||jsonb_build_array(small); s.pieces:=s.pieces+coalesce(n::numeric,0);
   IF s.cover IS NULL AND nullif(item->>'image_storage_path','') IS NOT NULL THEN s.cover:=jsonb_build_object('jobId',j.id,'index',idx,'version',j.updated_at); END IF;
   idx:=idx+1;
 END LOOP;
 IF idx=0 THEN s.pieces:=coalesce(substring(coalesce(j.quantity_text,'0') FROM '[0-9]+(?:\.[0-9]+)?')::numeric,0); END IF;
 IF s.cover IS NULL AND f.mime_type LIKE 'image/%' THEN s.cover:=jsonb_build_object('jobId',j.id,'index',-1,'version',j.updated_at); END IF;
 RETURN s;
END $$;
REVOKE ALL ON FUNCTION public.portal_summarize_job(public.intake_jobs) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.portal_sync_job_summary() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE s public.portal_job_summaries;
BEGIN
 s:=public.portal_summarize_job(NEW);
 INSERT INTO public.portal_job_summaries SELECT s.* ON CONFLICT(job_id) DO UPDATE SET
 project_id=excluded.project_id,owner_id=excluded.owner_id,created_at=excluded.created_at,updated_at=excluded.updated_at,
 project_name=excluded.project_name,destination=excluded.destination,status=excluded.status,review_status=excluded.review_status,
 rfq_status=excluded.rfq_status,active=excluded.active,is_addition=excluded.is_addition,items=excluded.items,pieces=excluded.pieces,
 cover=excluded.cover,source=excluded.source,lifecycle=excluded.lifecycle;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.portal_sync_job_summary() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS portal_job_summary ON public.intake_jobs;
CREATE TRIGGER portal_job_summary AFTER INSERT OR UPDATE ON public.intake_jobs FOR EACH ROW EXECUTE FUNCTION public.portal_sync_job_summary();
INSERT INTO public.portal_job_summaries SELECT (public.portal_summarize_job(j)).* FROM public.intake_jobs j
ON CONFLICT(job_id) DO UPDATE SET items=excluded.items,cover=excluded.cover,source=excluded.source;

CREATE OR REPLACE FUNCTION public.portal_directory(p_scope text DEFAULT 'client',p_search text DEFAULT '',p_filter text DEFAULT 'all',
 p_cursor jsonb DEFAULT NULL,p_limit integer DEFAULT 12,p_view text DEFAULT 'projects')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE answer jsonb; staff boolean:=public.is_crafton_staff();
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login required' USING ERRCODE='42501'; END IF;
 IF p_scope NOT IN ('client','staff') OR (p_scope='staff' AND NOT staff) THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501'; END IF;
 IF p_scope IS NULL OR p_view IS NULL OR p_limit IS NULL OR p_filter IS NULL OR p_search IS NULL OR
 p_view NOT IN ('projects','furniture') OR p_limit NOT BETWEEN 1 AND 24 OR length(p_search)>200 OR
 p_filter NOT IN ('all','action','intake','sourcing','production','shipping','archived') THEN RAISE EXCEPTION 'Invalid directory request'; END IF;
 WITH owned AS MATERIALIZED (
   SELECT s.*,coalesce(p.name,s.project_name) name,coalesce(nullif(u.full_name,''),nullif(u.company,''),p.client_name,'Client') client_name,
    coalesce(p.lifecycle_status,s.lifecycle,'active') lifecycle_status,
    greatest(coalesce(p.current_stage,1),CASE WHEN s.review_status IN ('approved','rfq_ready') OR s.rfq_status IN ('draft','sent') THEN 6
     WHEN s.review_status='revision_requested' THEN 2 WHEN jsonb_array_length(s.items)>0 THEN 3 ELSE 1 END,
     coalesce((SELECT max(substring(w.stage_id FROM '[0-9]+')::integer) FROM public.workflow_events w WHERE w.project_id=s.project_id),1)) stage,
    CASE WHEN s.project_id IS NULL THEN 'j:'||s.job_id ELSE 'p:'||s.project_id END key
   FROM public.portal_job_summaries s LEFT JOIN public.projects p ON p.id=s.project_id
   LEFT JOIN public.user_profiles u ON u.user_id=s.owner_id
   WHERE s.active AND (p_scope='staff' OR s.owner_id=auth.uid())
 ), grouped AS MATERIALIZED (
   SELECT key, max(name) name,max(destination) destination,max(client_name) client_name,max(owner_id::text) owner_id,
    max(project_id::text) project_id,(array_agg(job_id ORDER BY created_at DESC,job_id DESC))[1] job_id,
    max(created_at) created_at,max(updated_at) updated_at,max(stage) stage,
    max(lifecycle_status) lifecycle_status,sum(pieces) pieces,sum(jsonb_array_length(items)) item_count,
    count(*) FILTER(WHERE NOT is_addition) order_count,
    bool_or(review_status='revision_requested') client_action,
    bool_or(review_status='revision_requested' OR (stage<=5 AND review_status='pending') OR stage IN (4,5,8,11,16)) needs_action,
    (jsonb_agg(cover ORDER BY created_at DESC,job_id DESC) FILTER(WHERE cover IS NOT NULL))->0 cover
   FROM owned GROUP BY key
 ), all_projects AS MATERIALIZED (
  SELECT *,CASE WHEN stage<=5 THEN 'intake' WHEN stage<=8 THEN 'sourcing' WHEN stage<=11 THEN 'production' ELSE 'shipping' END flow FROM grouped
 ), filtered AS MATERIALIZED (
  SELECT * FROM all_projects WHERE
   (CASE WHEN p_filter='archived' THEN lifecycle_status<>'active' ELSE lifecycle_status='active' AND (p_scope='client' OR stage<17) END)
   AND (p_filter IN ('all','archived') OR (p_filter='action' AND CASE WHEN p_scope='staff' THEN needs_action ELSE client_action END) OR p_filter=flow)
   AND (p_search='' OR strpos(lower(name||' '||client_name||' '||destination),lower(trim(p_search)))>0
     OR EXISTS (SELECT 1 FROM owned o,jsonb_array_elements(o.items) i WHERE o.key=all_projects.key AND
       (strpos(lower(coalesce(i->>'name','')||' '||coalesce(i->>'nameCn','')),lower(trim(p_search)))>0 OR upper(i->>'tracking')=upper(trim(p_search))
        OR (p_search ILIKE 'TRK-%' AND upper(trim(p_search))='TRK-'||
          public.portal_identity_token(coalesce(o.project_id::text,nullif(concat_ws('|',nullif(trim(regexp_replace(lower(o.name),'[^[:alnum:]]+',' ','g')),''),nullif(trim(regexp_replace(lower(o.destination),'[^[:alnum:]]+',' ','g')),'')),''),o.job_id::text)||'|'||o.job_id||'|'||(i->>'id')||'|tracking',7)||
          public.portal_identity_token('tracking|'||coalesce(o.project_id::text,nullif(concat_ws('|',nullif(trim(regexp_replace(lower(o.name),'[^[:alnum:]]+',' ','g')),''),nullif(trim(regexp_replace(lower(o.destination),'[^[:alnum:]]+',' ','g')),'')),''),o.job_id::text)||'|'||o.job_id||'|'||(i->>'id'),5)))))
 ), records AS MATERIALIZED (
  SELECT f.created_at,f.key sort_key,to_jsonb(f) data FROM filtered f WHERE p_view='projects'
  UNION ALL
  SELECT o.created_at,o.job_id::text||':'||lpad(i->>'index',8,'0'),
   jsonb_build_object('key',f.key,'project_id',f.project_id,'job_id',o.job_id,'name',f.name,'client_name',f.client_name,'stage',f.stage,
    'item',jsonb_build_object('name',i->>'name','nameCn',i->>'nameCn','quantity',i->'quantity','quantityText',i->>'quantityText'),
    'cover',CASE WHEN nullif(i->>'path','') IS NOT NULL THEN jsonb_build_object('jobId',o.job_id,'index',i->'index','version',o.updated_at) ELSE NULL END)
  FROM filtered f JOIN owned o ON o.key=f.key CROSS JOIN LATERAL jsonb_array_elements(o.items) i WHERE p_view='furniture'
 ), remaining AS MATERIALIZED (
  SELECT * FROM records WHERE p_cursor IS NULL OR (created_at,sort_key)<((p_cursor->>'at')::timestamptz,p_cursor->>'key')
  ORDER BY created_at DESC,sort_key DESC LIMIT p_limit+1
 ), page AS MATERIALIZED (SELECT * FROM remaining ORDER BY created_at DESC,sort_key DESC LIMIT p_limit)
 SELECT jsonb_build_object('rows',coalesce((SELECT jsonb_agg(data ORDER BY created_at DESC,sort_key DESC) FROM page),'[]'),
 'total',(SELECT count(*) FROM records),
 'nextCursor',CASE WHEN (SELECT count(*) FROM remaining)>p_limit THEN (SELECT jsonb_build_object('at',created_at,'key',sort_key) FROM page ORDER BY created_at,sort_key LIMIT 1) ELSE NULL END,
 'stats',(SELECT jsonb_build_object('projects',count(*) FILTER(WHERE lifecycle_status='active' AND (p_scope='client' OR stage<17)),
  'clients',count(DISTINCT owner_id) FILTER(WHERE lifecycle_status='active' AND stage<17),
  'orders',coalesce(sum(order_count) FILTER(WHERE lifecycle_status='active'),0),'pieces',coalesce(sum(pieces) FILTER(WHERE lifecycle_status='active'),0),
  'productionPieces',coalesce(sum(pieces) FILTER(WHERE lifecycle_status='active' AND stage BETWEEN 9 AND 11),0),
  'action',count(*) FILTER(WHERE lifecycle_status='active' AND CASE WHEN p_scope='staff' THEN needs_action ELSE client_action END),
  'intake',count(*) FILTER(WHERE lifecycle_status='active' AND flow='intake'),
  'sourcing',count(*) FILTER(WHERE lifecycle_status='active' AND flow='sourcing'),
  'production',count(*) FILTER(WHERE lifecycle_status='active' AND flow='production'),
  'shipping',count(*) FILTER(WHERE lifecycle_status='active' AND flow='shipping' AND stage<17),
  'archived',count(*) FILTER(WHERE lifecycle_status<>'active')) FROM all_projects)) INTO answer;
 RETURN answer;
END $$;
REVOKE ALL ON FUNCTION public.portal_directory(text,text,text,jsonb,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_directory(text,text,text,jsonb,integer,text) TO authenticated, service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
