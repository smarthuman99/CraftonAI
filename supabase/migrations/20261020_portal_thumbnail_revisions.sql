-- Add image-only revision metadata without changing source jobs or permissions.
BEGIN;
CREATE OR REPLACE FUNCTION public.portal_summarize_job(j public.intake_jobs)
RETURNS public.portal_job_summaries LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE s public.portal_job_summaries; item jsonb; small jsonb; idx integer:=0; f public.intake_files; n text;
BEGIN
 SELECT * INTO f FROM public.intake_files WHERE id=j.intake_file_id;
 s.job_id:=j.id; s.project_id:=j.project_id; s.owner_id:=coalesce(j.user_id,j.requested_by,f.user_id,f.uploaded_by);
 s.created_at:=j.created_at; s.updated_at:=j.updated_at;
 s.project_name:=coalesce(j.project_name,j.result_json#>>'{project,name}','Untitled project');
 s.destination:=coalesce(nullif(j.destination,''),nullif(j.result_json#>>'{project,destination}',''),'');
 s.status:=j.status; s.review_status:=coalesce(j.review_status,CASE WHEN j.status='completed' THEN 'approved' ELSE 'pending' END);
 s.rfq_status:=j.rfq_status; s.active:=j.client_import_state IS NULL OR j.client_import_state='merged';
 s.is_addition:=j.client_import_state IS NOT NULL; s.items:='[]'; s.pieces:=0;
 s.lifecycle:=coalesce(j.result_json#>>'{project_lifecycle,status}','active');
 s.source:=jsonb_build_object('bucket',f.storage_bucket,'path',f.storage_path,'mime',f.mime_type,'revision',coalesce(to_jsonb(f)->>'sha256',''));
 FOR item IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(j.result_json->'items')='array' THEN j.result_json->'items' ELSE '[]' END) LOOP
   n:=substring(coalesce(item->>'quantity',item->>'qty',item->>'quantity_text','0') FROM '[0-9]+(?:\.[0-9]+)?');
   small:=jsonb_build_object('index',idx,'id',coalesce(item->>'id','DRAFT-ITEM-'||(idx+1)),
    'name',left(coalesce(item->>'item_type_en',item->>'typeEn',item->>'item_type_cn','Furniture'),240),
    'nameCn',left(coalesce(item->>'item_type_cn',item->>'typeCn',item->>'item_type_en','家具'),240),
    'quantity',coalesce(n::numeric,0),'quantityText',left(coalesce(item->>'quantity_text',n,'0'),80),
    'tracking',coalesce(item->>'tracking_id',item->>'trackingId',item->>'qr_tracking_id',item->>'qrTrackingId',item#>>'{technical_drawing,tracking_id}',item#>>'{technicalDrawing,trackingId}',''),
    'bucket',item->>'image_storage_bucket','path',item->>'image_storage_path',
    'revision',coalesce(nullif(item->>'image_sha256',''),nullif(item->>'image_uploaded_at',''),item#>>'{image_storage_paths,0,sha256}',''),
    'drawing',jsonb_build_object('bucket',item#>>'{technical_drawing,storage_bucket}',
      'revision',coalesce(nullif(item#>>'{technical_drawing,generated_at}',''),item#>>'{technical_drawing,updated_at}',''),
      'path',CASE WHEN item#>>'{technical_drawing,status}' IN ('formal','approved_for_manufacture')
        THEN coalesce(nullif(item#>>'{technical_drawing,formal_storage_path}',''),nullif(item#>>'{technical_drawing,drawing_storage_path}',''))
        ELSE coalesce(nullif(item#>>'{technical_drawing,draft_storage_path}',''),nullif(item#>>'{technical_drawing,drawing_storage_path}','')) END));
   s.items:=s.items||jsonb_build_array(small); s.pieces:=s.pieces+coalesce(n::numeric,0);
   IF s.cover IS NULL AND nullif(item->>'image_storage_path','') IS NOT NULL THEN s.cover:=jsonb_build_object('jobId',j.id,'projectId',j.project_id,'index',idx,'version',jsonb_build_array('webp-320x240-q68-v2',small->>'bucket',small->>'path',small->>'revision')::text); END IF;
   idx:=idx+1;
 END LOOP;
 IF idx=0 THEN s.pieces:=coalesce(substring(coalesce(j.quantity_text,'0') FROM '[0-9]+(?:\.[0-9]+)?')::numeric,0); END IF;
 IF s.cover IS NULL AND f.mime_type LIKE 'image/%' THEN s.cover:=jsonb_build_object('jobId',j.id,'projectId',j.project_id,'index',-1,'version',jsonb_build_array('webp-320x240-q68-v2',s.source->>'bucket',s.source->>'path',s.source->>'revision')::text); END IF;
 RETURN s;
END $$;
REVOKE ALL ON FUNCTION public.portal_summarize_job(public.intake_jobs) FROM PUBLIC, anon, authenticated;


INSERT INTO public.portal_job_summaries SELECT (public.portal_summarize_job(j)).* FROM public.intake_jobs j
ON CONFLICT(job_id) DO UPDATE SET items=excluded.items,source=excluded.source,cover=excluded.cover;
COMMIT;
