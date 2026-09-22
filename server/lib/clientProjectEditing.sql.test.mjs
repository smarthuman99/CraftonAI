import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { buildEditPlan, itemFields } from "../../shared/clientProjectEditing.mjs";

const owner = "11111111-1111-4111-8111-111111111111",
  projectId = "22222222-2222-4222-8222-222222222222";
const jobId = "33333333-3333-4333-8333-333333333333",
  fileId = "44444444-4444-4444-8444-444444444444";
const item = {
  id: "chair",
  item_type_cn: "椅子",
  item_type_en: "Chair",
  quantity: 2,
  material_cn: "橡木",
  material_en: "Oak",
  original_unit_price: 20,
  unit_price: 20
};
const fixture = `
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE FUNCTION public.is_crafton_staff() RETURNS boolean LANGUAGE sql AS 'SELECT false';
CREATE TABLE projects(id uuid PRIMARY KEY, user_id uuid, name text NOT NULL, client_name text, client_contact text,
 current_stage integer NOT NULL DEFAULT 1, selected_supplier jsonb, lifecycle_status text DEFAULT 'active');
CREATE UNIQUE INDEX owned_project_name ON projects(user_id, name);
CREATE TABLE intake_files(id uuid PRIMARY KEY, project_id uuid REFERENCES projects(id), user_id uuid, uploaded_by uuid,
 original_name text, storage_bucket text, storage_path text, file_size bigint, mime_type text);
CREATE TABLE intake_jobs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid REFERENCES projects(id), user_id uuid, requested_by uuid,
 intake_file_id uuid REFERENCES intake_files(id), project_name text, destination text, status text, step text, result_json jsonb,
 review_status text DEFAULT 'pending', rfq_status text DEFAULT 'not_started', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE FUNCTION touch_job() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN NEW.updated_at := clock_timestamp(); RETURN NEW; END';
CREATE TRIGGER touch_job BEFORE UPDATE ON intake_jobs FOR EACH ROW EXECUTE FUNCTION touch_job();
CREATE TABLE specifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid REFERENCES projects(id), user_id uuid,
 item_type_cn text NOT NULL, item_type_en text NOT NULL, quantity integer NOT NULL CHECK(quantity >= 0), material_cn text NOT NULL,
 material_en text NOT NULL, original_unit_price numeric NOT NULL, unit_price numeric NOT NULL, notes_cn text, notes_en text);
CREATE TABLE payments(id uuid DEFAULT gen_random_uuid(), project_id uuid, amount numeric);
CREATE TABLE rfq_batches(id uuid DEFAULT gen_random_uuid(), project_id uuid);
CREATE TABLE supplier_quotes(id uuid DEFAULT gen_random_uuid(), project_id uuid);
CREATE TABLE approvals(id uuid DEFAULT gen_random_uuid(), project_id uuid);
CREATE TABLE workflow_events(id uuid DEFAULT gen_random_uuid(), project_id uuid, user_id uuid, stage_id text, event_type text,
 actor text, message_cn text, message_en text, payload jsonb);
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
`;

test("project edit migration and transactions against isolated PostgreSQL", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(fixture);
  const migration = await fs.readFile(
    new URL("../../supabase/migrations/20260922_client_project_editing.sql", import.meta.url),
    "utf8"
  );
  await db.exec(migration);
  await db.exec(migration); // Idempotent installation.
  const seed = async () => {
    await db.exec(
      "TRUNCATE projects, intake_files, intake_jobs, specifications, payments, rfq_batches, supplier_quotes, approvals, workflow_events CASCADE"
    );
    await db.query("INSERT INTO projects(id,user_id,name,current_stage) VALUES($1,$2,'The Portal',3)", [
      projectId,
      owner
    ]);
    await db.query(
      "INSERT INTO intake_files(id,user_id,original_name,storage_bucket,storage_path,file_size) VALUES($1,$2,'additions.xlsx','intake-files',$3,1000)",
      [fileId, owner, `${owner}/file.xlsx`]
    );
    await db.query(
      "INSERT INTO intake_jobs(id,project_id,user_id,requested_by,project_name,status,result_json) VALUES($1,$2,$3,$3,'The Portal','needs_review',$4)",
      [jobId, projectId, owner, JSON.stringify({ items: [item], payments: [{ amount: 100 }] })]
    );
    await db.query("INSERT INTO payments(project_id,amount) VALUES($1,100)", [projectId]);
  };
  const workspace = async () => ({
    project: (await db.query("SELECT row_to_json(p) AS row FROM projects p WHERE id=$1", [projectId])).rows[0].row,
    jobs: (
      await db.query("SELECT row_to_json(j) AS row FROM intake_jobs j WHERE project_id=$1 ORDER BY id", [projectId])
    ).rows.map((r) => r.row),
    requiresReview: false
  });
  const commit = (state, plan) =>
    db.query("SELECT commit_client_project_edit($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [
      projectId,
      owner,
      state.project.client_edit_revision,
      JSON.stringify(state.jobs.map(({ id, updated_at }) => ({ id, updated_at }))),
      JSON.stringify(plan.projectPatch),
      JSON.stringify(plan.patches),
      plan.guardDraft,
      plan.syncSpecs,
      owner,
      "test"
    ]);
  const editPlan = (state) =>
    buildEditPlan(
      state,
      { operation: "edit_item", jobId, itemIndex: 0, fields: { ...itemFields(item), quantity: "8" } },
      { actorId: owner, requestId: "req-1" }
    );

  await t.test("draft edit synchronises the full BOM and keeps payments", async () => {
    await seed();
    const state = await workspace();
    await commit(state, editPlan(state));
    assert.equal((await db.query("SELECT quantity FROM specifications")).rows[0].quantity, 8);
    assert.equal(Number((await db.query("SELECT amount FROM payments")).rows[0].amount), 100);
    assert.equal((await workspace()).jobs[0].result_json.items[0].quantity, 8);
    assert.equal((await db.query("SELECT count(*)::int n FROM workflow_events")).rows[0].n, 1);
  });
  await t.test("stale jobs and concurrent project metadata abort without partial writes", async () => {
    await seed();
    let state = await workspace();
    const plan = editPlan(state);
    await db.query("UPDATE intake_jobs SET step='changed' WHERE id=$1", [jobId]);
    await assert.rejects(() => commit(state, plan), /EDIT_CONFLICT/);
    assert.equal((await workspace()).jobs[0].result_json.items[0].quantity, 2);
    assert.equal((await db.query("SELECT count(*)::int n FROM specifications")).rows[0].n, 0);
    state = await workspace();
    await db.query("UPDATE projects SET name='Another name' WHERE id=$1", [projectId]);
    await assert.rejects(() => commit(state, plan), /EDIT_CONFLICT/);
    assert.equal((await workspace()).project.name, "Another name");
  });
  await t.test("draft guard rechecks downstream quotes inside the transaction", async () => {
    await seed();
    const state = await workspace();
    await db.query("INSERT INTO supplier_quotes(project_id) VALUES($1)", [projectId]);
    await assert.rejects(() => commit(state, editPlan(state)), /EDIT_REVIEW_REQUIRED/);
    assert.equal((await workspace()).jobs[0].result_json.items[0].quantity, 2);
  });
  await t.test("queueing is explicitly project-bound, owner checked and idempotent", async () => {
    await seed();
    const first = (await db.query("SELECT queue_client_project_file($1,$2,$3) id", [projectId, owner, fileId])).rows[0]
      .id;
    const retry = (await db.query("SELECT queue_client_project_file($1,$2,$3) id", [projectId, owner, fileId])).rows[0]
      .id;
    assert.equal(first, retry);
    const queued = (await workspace()).jobs.find((job) => job.id === first);
    assert.equal(queued.client_import_state, "processing");
    assert.equal(queued.status, "queued");
    assert.equal(queued.project_id, projectId);
    await assert.rejects(
      () =>
        db.query("SELECT queue_client_project_file($1,$2,$3)", [
          projectId,
          "55555555-5555-4555-8555-555555555555",
          fileId
        ]),
      /access denied/
    );
  });
  await t.test("confirmed additions preserve previous items; replay cannot double the BOM", async () => {
    await seed();
    const importId = (await db.query("SELECT queue_client_project_file($1,$2,$3) id", [projectId, owner, fileId]))
      .rows[0].id;
    await db.query(
      "UPDATE intake_jobs SET status='needs_review',client_import_state='preview',result_json=$2 WHERE id=$1",
      [importId, JSON.stringify({ items: [{ ...item, id: "table", item_type_en: "Table", quantity: 3 }] })]
    );
    const state = await workspace();
    const plan = buildEditPlan(
      state,
      { operation: "confirm_import", jobId: importId, choices: [{ action: "add" }] },
      { actorId: owner }
    );
    await commit(state, plan);
    assert.equal((await db.query("SELECT sum(quantity)::int n FROM specifications")).rows[0].n, 5);
    assert.equal((await workspace()).jobs.find((job) => job.id === jobId).result_json.items[0].quantity, 2);
    await assert.rejects(() => commit(state, plan), /EDIT_CONFLICT/);
    assert.equal((await db.query("SELECT sum(quantity)::int n FROM specifications")).rows[0].n, 5);
  });
  await t.test("customer role cannot call service transactions or forge import acceptance", async () => {
    await seed();
    await db.exec("SET ROLE authenticated");
    try {
      await assert.rejects(
        () => db.query("SELECT queue_client_project_file($1,$2,$3)", [projectId, owner, fileId]),
        /permission denied/
      );
      await assert.rejects(
        () => db.query("UPDATE intake_jobs SET client_import_state='merged' WHERE id=$1", [jobId]),
        /editing service/
      );
      await assert.rejects(
        () =>
          db.query(
            "UPDATE intake_jobs SET result_json=jsonb_set(result_json,'{client_change_requests}','[]') WHERE id=$1",
            [jobId]
          ),
        /editing service/
      );
      await assert.rejects(
        () => db.query("UPDATE projects SET name='Forged' WHERE id=$1", [projectId]),
        /editing service/
      );
      // Existing clarification workflow still works when protected data does not change.
      await db.query("UPDATE intake_jobs SET step='client_completion' WHERE id=$1", [jobId]);
    } finally {
      await db.exec("RESET ROLE");
    }
  });
});
