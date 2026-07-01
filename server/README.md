# Crafton AI Server

This folder contains the first durable backend worker for the 17-stage manufacturing workflow.

## Intake Worker

The intake worker processes rows from `intake_jobs`:

1. Customer uploads a source file to Supabase Storage bucket `intake-files`.
2. Frontend inserts an `intake_files` row and an `intake_jobs` row.
3. `server/intake-worker.mjs` claims queued jobs.
4. The worker parses the brief, creates or updates a `projects` record, writes draft `specifications`, `payments`, `agent_logs`, and `workflow_events`.
5. The job moves to `needs_review`, so Cho can approve the generated draft before RFQ.

## Setup

Run these migrations in Supabase SQL Editor after the existing `schema.sql`:

1. `supabase/migrations/20260627_intake_pipeline.sql`
2. `supabase/migrations/20260627_ai_support_conversations.sql`
3. `supabase/migrations/20260627_user_identity_and_ownership.sql`

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
```

The `DEEPSEEK_API_KEY` is optional. Without it, the worker uses deterministic parsing so the pipeline can be tested end to end.

## Local Run

```bash
npm run support:ai
npm run worker:intake:once
npm run worker:intake
```

`npm run support:ai` starts the server-side Crafton AI customer service chat endpoint at `http://127.0.0.1:8787/api/ai-support-chat`. The browser calls this endpoint instead of calling DeepSeek directly, so the model API key stays in `server/.env`.

For Bluehost VPS, run the long-lived command with `pm2` or `systemd`.
