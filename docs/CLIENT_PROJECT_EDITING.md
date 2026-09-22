# Client project editing

The project header now has **Edit project**, **Add FF&E files** and **Change requests**. Each furniture row has **Edit item**; the reference-photo control opens the same editor. The Documents section also opens the upload/history panel. Editors keep the page position and return focus to the opening button. Mobile uses a full-screen panel.

Project edits cover the display name and project notes. Renaming freezes any existing computed SKU and tracking ID before updating names. Item edits cover name, quantity, dimensions with units, material, colour, location, notes and an optional reference photo. Unchanged bilingual descriptions are retained. Additional FF&E files increase file/furniture counts without creating another commercial order.

New files are bound to an explicit project ID. The intake worker parses them into `client_import_state = preview` without replacing the project's name, BOM, payments or live drawings. The client chooses **Add separately**, **Update existing** or **Skip** for each row. Reference/SKU/name matches are suggestions only; a possible duplicate requires an explicit choice. Original files and parsed source items remain available after confirmation. Intake jobs awaiting confirmation or discarded are excluded from the live project list, drawing queue and RFQ source data.

Draft edits commit together with the provisional BOM. Quoted, approved or production-stage projects use a change request instead. The effective item remains unchanged. Requests contain the previous specification, proposed revision and subsequent staff review history. The operations workspace has a **Client change requests** section for reviewing the differences, replying and declining a request. **Mark implemented** succeeds only after the specific requested specification has been applied and received a newer approval through the existing project workflow. It does not itself approve drawings, prices or production changes.

The service authenticates the caller, checks project/file ownership, validates editable fields and verifies a workspace version. Database transactions lock the project and intake rows, reject stale writes and recheck whether draft editing is permitted. The service-only queue transaction is idempotent per uploaded file. Existing clarification updates remain supported; import state and revision history require the editing service. Drawing-worker writes now use optimistic concurrency so an old drawing result cannot overwrite a later edit.

## Release order

1. Pause the intake and drawing workers during rollout. An old intake worker must never claim the new staged imports.
2. Apply `supabase/migrations/20260922_client_project_editing.sql` after the existing identity, review, operations and project-lifecycle migrations.
3. Deploy the updated API and worker code, then restart the workers.
4. Publish the updated frontend. Check an authenticated staging account's draft edit, file import and confirmed-project change request before promoting the release.

The deployment workflow now bundles `shared/`, pauses both systemd workers, and waits up to 15 minutes for all required columns and both service-only RPCs. Apply the migration while the log shows `CRAFTON_WORKERS_PAUSED_READY_FOR_MIGRATION`. The 2026-09-22 preflight found `20260824_project_lifecycle.sql` missing on production; install it immediately before the editing migration in the same SQL transaction. A schema timeout restarts the unchanged workers and leaves the frontend unchanged. After deployment begins, fix forward rather than starting an older worker against new staged imports.

Runtime and frontend backups are stored privately under `/var/backups/crafton/<release-sha>/`. Only the configured web directory and the two confirmed live static roots are published; historical backup folders are excluded. Frontend entry points are replaced after assets, and old hashed assets remain available to already-open pages. The deployment checks the project editing endpoint rejects anonymous requests and that both workers stay active before publishing the frontend.

Do not roll back to an older worker while staged imports remain queued. No production migration, upload or deployment was performed during this implementation.

## Verification

- `npm run test:project-editing`: 22 tests, including an isolated PostgreSQL runtime applying the migration twice and checking atomicity, ownership, stale writes, quote gating, upload idempotency and full-BOM preservation.
- `npm run test:intake`: 66 existing intake and file-reading tests passed.
- RFQ source aggregation, technical drawings and project lifecycle: 11 related tests passed.
- ESLint, production build and server syntax checks passed. The build retains the existing large-chunk advisory.
- Local browser: project rename retained the SKU, quantity edits updated the dashboard, duplicate import choices stayed disabled until resolved, confirmed additions preserved existing items, and production-stage requests retained the effective quantity. Mobile dialog fields, close/unsaved-changes handling, and file-upload failure/retry were exercised.
- Upload/extraction UI verification used the deterministic local fixture in `scratch/client-project-editing-preview.html`; no paid document-processing call or authenticated remote storage end-to-end test was performed. Database behavior was verified independently with PostgreSQL tests.

The existing customer service wording remains neutral, including “We’re checking your file…” and “File uploaded successfully.”
