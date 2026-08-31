# Crafton AI Server

This folder contains the first durable backend worker for the 17-stage manufacturing workflow.

## Intake Worker

The intake worker processes rows from `intake_jobs`:

1. Customer uploads a source file to Supabase Storage bucket `intake-files`.
2. Frontend inserts an `intake_files` row and an `intake_jobs` row.
3. `server/intake-worker.mjs` claims queued jobs.
4. PDF uploads are opened through a signed Storage URL and parsed in configurable four-page batches. Text and one primary product image per page are extracted, and each successful batch is checkpointed in `intake_jobs.result_json.processing`.
5. If the worker restarts or a model call fails, the next attempt resumes from the last completed PDF batch. Jobs left in `processing` are reclaimed after the configured stale timeout.
6. XLSX/XLSM files retain worksheet rows and supported embedded PNG/JPEG/WebP product images. Image anchors are written beside their worksheet row so the structured item can link back to the correct image.
7. Legacy XLS files are converted to XLSX with headless LibreOffice when available, preserving both cells and images. Calamine provides a cell-only XLS fallback when conversion is unavailable.
8. For JPG/PNG/WebP uploads, the worker downloads the private Storage object and sends the image bytes plus the customer brief to Gemini for structured visual understanding. Text, CSV, XLSX, and DOCX files continue through their structured readers.
9. The worker creates or updates a `projects` record, writes draft `specifications`, `payments`, `agent_logs`, and `workflow_events`.
10. Visual fields (style, color, finish, visible construction features, confidence, OCR text, and limitations) are kept in `intake_jobs.result_json`; a concise evidence summary is also written to specification notes for Cho.
11. Quantity, dimensions, prices, dates, materials, and fire compliance are never treated as proven by appearance alone. Missing production-critical details remain clarification questions.
12. The job moves to `needs_review`, so Cho can approve the generated draft before RFQ.

## Setup

Run these migrations in Supabase SQL Editor after the existing `schema.sql`:

1. `supabase/migrations/20260627_intake_pipeline.sql`
2. `supabase/migrations/20260627_ai_support_conversations.sql`
3. `supabase/migrations/20260627_user_identity_and_ownership.sql`
4. `supabase/migrations/20260812_large_ffe_resumable_intake.sql`

The third migration makes `auth.users.id` the single internal user identifier for
Crafton business data. Projects, intake jobs, uploaded files, AI support
conversations, messages, payments, specifications, and workflow events are all
linked to `user_id`. Enable Email, Google, and Apple providers in Supabase Auth
and add your site URL as an allowed redirect URL for OAuth sign-in.

Create `server/.env` from `server/.env.example`:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
GEMINI_API_KEY=
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_VISION_MODEL=gemini-3.6-flash
GEMINI_API_REVISION=2026-05-20
GEMINI_VISION_TIMEOUT_MS=180000
GEMINI_INTAKE_MAX_OUTPUT_TOKENS=32768
INTAKE_DOCUMENT_MAX_FILE_BYTES=262144000
INTAKE_GEMINI_PDF_INLINE_MAX_BYTES=50331648
INTAKE_PDF_BATCH_PAGES=4
INTAKE_PDF_BATCH_RETRIES=2
INTAKE_PDF_VISUAL_FALLBACK_MIN_TEXT_CHARS_PER_PAGE=80
INTAKE_PDF_VISUAL_FALLBACK_RENDER_WIDTH=1400
INTAKE_WORKER_STALE_MINUTES=30
LIBREOFFICE_BIN=soffice
INTAKE_XLS_CONVERSION_TIMEOUT_MS=60000
INTAKE_OFFICE_CONVERSION_TIMEOUT_MS=90000
```

`DEEPSEEK_API_KEY` is optional. Without it, the worker uses deterministic text parsing so the pipeline can be tested end to end.

`GEMINI_API_KEY` makes Gemini the primary FF&E document analyzer. PDFs within the inline safety limit are sent to Gemini as one complete PDF so the model can classify every page, reconcile furniture across schedules/specifications/layouts, and return evidence plus product-photo coordinates. Larger PDFs are rendered as one visual document when possible. XLS/XLSX and DOC/DOCX files retain their native extracted rows/text and are also converted through headless LibreOffice for Gemini visual review. DeepSeek and deterministic parsing remain failure fallbacks; visual failures are preserved as explicit `manual_review_required` exceptions instead of being presented as customer questions.

Gemini document output is quality-gated: cover/index/floorplan/layout/drawing pages cannot create formal furniture lines, every accepted line must cite an orderable source page and evidence text, and a product photo is saved only when Gemini supplies a unique page bounding box. Items without a verified crop remain image-free rather than inheriting another item's image.

The default 12 MiB image limit leaves room for base64 expansion and prompts under Gemini's 20 MB inline-request limit. Larger source images should be resized before upload or moved to a future Files API flow.

PDFs up to 250 MiB use Supabase TUS resumable upload with 6 MiB chunks. The Supabase project's global Storage file-size limit must also be at least 250 MiB; the bucket limit cannot exceed the project-level setting.

## Local Run

```bash
npm run support:ai
npm run worker:intake:once
npm run worker:intake
```

`npm run support:ai` starts the server-side Crafton AI customer service chat endpoint at `http://127.0.0.1:8787/api/ai-support-chat`. The browser calls this endpoint instead of calling DeepSeek directly, so the model API key stays in `server/.env`.

For Bluehost VPS, run the long-lived command with `pm2` or `systemd`.
