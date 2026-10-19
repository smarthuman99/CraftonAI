import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const owner = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222";
const uuid = (n) => `33333333-3333-4333-8333-${String(n).padStart(12, "0")}`;
test("directory migration: isolated Postgres, owner isolation, cursor traversal, counts and updates", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;
 CREATE FUNCTION public.is_crafton_staff() RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.staff',true),'false')='true'$$;
 CREATE TABLE projects(id uuid PRIMARY KEY,user_id uuid,name text,client_name text,client_contact text,current_stage integer,lifecycle_status text DEFAULT 'active');
 CREATE TABLE user_profiles(user_id uuid PRIMARY KEY,full_name text,company text);
 CREATE TABLE intake_files(id uuid PRIMARY KEY,user_id uuid,uploaded_by uuid,storage_bucket text,storage_path text,mime_type text);
 CREATE TABLE intake_jobs(id uuid PRIMARY KEY,project_id uuid REFERENCES projects(id),user_id uuid,requested_by uuid,intake_file_id uuid,
  project_name text,destination text,quantity_text text,status text,review_status text,rfq_status text,client_import_state text,result_json jsonb,
  created_at timestamptz DEFAULT '2026-10-20',updated_at timestamptz DEFAULT now());
 CREATE TABLE workflow_events(id uuid,project_id uuid,stage_id text);
 GRANT USAGE ON SCHEMA public,auth TO authenticated,anon,service_role;`);
  const sql = await fs.readFile(
    new URL("../../supabase/migrations/20261020_portal_directory.sql", import.meta.url),
    "utf8"
  );
  await db.exec(sql);
  await db.exec(sql);
  await db.query("INSERT INTO user_profiles VALUES($1,'Owner A',null),($2,'Owner B',null)", [owner, other]);
  for (let n = 1; n <= 27; n++) {
    const user = n === 27 ? other : owner;
    await db.query("INSERT INTO projects(id,user_id,name,current_stage) VALUES($1,$2,$3,3)", [
      uuid(n),
      user,
      `Project ${n}`
    ]);
    await db.query(
      `INSERT INTO intake_jobs(id,project_id,user_id,status,review_status,result_json) VALUES($1,$1,$2,'needs_review','pending',$3)`,
      [
        uuid(n),
        user,
        JSON.stringify({
          evidence: "PRIVATE-LARGE-EVIDENCE".repeat(1000),
          items: [
            {
              id: "chair",
              item_type_en: n === 25 ? "Needle chair" : "Chair",
              quantity: 2,
              image_storage_bucket: "private",
              image_storage_path: `${user}/photo.png`,
              tracking_id: `TRK-${n}`
            }
          ]
        })
      ]
    );
  }
  const rpc = async (args = {}) =>
    (
      await db.query("SELECT portal_directory($1,$2,$3,$4,$5,$6) d", [
        args.scope || "client",
        args.search || "",
        args.filter || "all",
        args.cursor || null,
        args.limit || 12,
        args.view || "projects"
      ])
    ).rows[0].d;
  await t.test("anonymous blocked and client cannot ask for staff scope or inspect the projection table", async () => {
    await db.exec("SET ROLE authenticated");
    await assert.rejects(rpc(), /Login required/);
    await db.query("SELECT set_config('test.uid',$1,false)", [owner]);
    await assert.rejects(rpc({ scope: "staff" }), /Access denied/);
    await assert.rejects(db.query("SELECT portal_directory(p_limit:=NULL)"), /Invalid directory request/);
    await assert.rejects(db.query("SELECT * FROM portal_job_summaries"), /permission denied/);
  });
  await t.test("stable cursor with equal timestamps, exact global totals and no full JSON payload", async () => {
    let cursor = null;
    const ids = [];
    do {
      const page = await rpc({ cursor });
      assert.equal(page.stats.projects, 26);
      assert.equal(page.stats.pieces, 52);
      assert.ok(page.rows.length <= 12);
      assert.ok(!JSON.stringify(page).includes("PRIVATE-LARGE"));
      assert.ok(!JSON.stringify(page).includes("storage_path"));
      ids.push(...page.rows.map((r) => r.key));
      cursor = page.nextCursor;
    } while (cursor);
    assert.equal(ids.length, 26);
    assert.equal(new Set(ids).size, 26);
    assert.ok(!ids.includes(`p:${uuid(27)}`));
  });
  await t.test("server-wide search finds records outside current page; furniture bounded to 24", async () => {
    assert.equal((await rpc({ search: "Needle" })).total, 1);
    assert.equal((await rpc({ search: "TRK-25" })).rows[0].name, "Project 25");
    const token = (value, length) => {
      let h = 2166136261;
      for (const c of value) {
        h ^= c.charCodeAt(0);
        h = Math.imul(h, 16777619);
      }
      return (h >>> 0).toString(36).toUpperCase().padStart(length, "0").slice(-length);
    };
    const identity = `${uuid(25)}|${uuid(25)}|chair`;
    const legacy = `TRK-${token(`${identity}|tracking`, 7)}${token(`tracking|${identity}`, 5)}`;
    assert.equal((await rpc({ search: legacy })).rows[0].name, "Project 25");
    assert.equal((await rpc({ search: "%" })).total, 0);
    const page = await rpc({ view: "furniture", limit: 24 });
    assert.equal(page.rows.length, 24);
    assert.equal(page.total, 26);
    assert.ok(page.nextCursor);
  });
  await t.test("staff scope independent from client scope and never inherited by a customer", async () => {
    await db.exec("SET test.staff='true'");
    assert.equal((await rpc({ scope: "staff" })).stats.projects, 27);
    assert.equal((await rpc()).stats.projects, 26);
    await db.exec("SET test.staff='false'");
    await db.query("SELECT set_config('test.uid',$1,false)", [other]);
    assert.equal((await rpc()).stats.projects, 1);
  });
  await t.test("write-through projection updates count, lifecycle, ownership and deletion", async () => {
    await db.exec("RESET ROLE");
    for (const [status, expected] of [
      ["draft", "current-draft.png"],
      ["approved_for_manufacture", "approved.png"]
    ]) {
      await db.query(
        `UPDATE intake_jobs SET result_json=jsonb_set(result_json,'{items,0,technical_drawing}',$2) WHERE id=$1`,
        [
          uuid(27),
          JSON.stringify({
            status,
            storage_bucket: "private",
            draft_storage_path: "current-draft.png",
            formal_storage_path: "approved.png"
          })
        ]
      );
      assert.equal(
        (await db.query("SELECT items#>>'{0,drawing,path}' path FROM portal_job_summaries WHERE job_id=$1", [uuid(27)]))
          .rows[0].path,
        expected
      );
    }
    await db.query(
      `UPDATE intake_jobs SET result_json=jsonb_set(result_json,'{items,0,quantity}','7'),review_status='revision_requested' WHERE id=$1`,
      [uuid(27)]
    );
    await db.query(`UPDATE projects SET lifecycle_status='archived' WHERE id=$1`, [uuid(27)]);
    await db.exec("SET ROLE authenticated");
    assert.equal((await rpc()).total, 0);
    const page = await rpc({ filter: "archived" });
    assert.equal(page.total, 1);
    assert.equal(page.rows[0].pieces, 7);
    await db.exec("RESET ROLE");
    await db.query("DELETE FROM intake_jobs WHERE id=$1", [uuid(27)]);
    await db.exec("SET ROLE authenticated");
    assert.equal((await rpc({ filter: "archived" })).total, 0);
  });
  await t.test("staff directory retains existing status filter and destination fallback", async () => {
    await db.exec("RESET ROLE");
    await db.query("INSERT INTO intake_jobs(id,user_id,status) VALUES($1,$2,'failed')", [uuid(28), other]);
    await db.query("UPDATE projects SET client_contact='Fallback destination' WHERE id=$1", [uuid(1)]);
    await db.exec("SET ROLE authenticated; SET test.staff='true'");
    assert.equal((await rpc({ scope: "staff" })).total, 26);
    assert.equal(
      (await rpc({ scope: "staff", search: "Project 1" })).rows.find((r) => r.name === "Project 1").destination,
      "Fallback destination"
    );
    assert.equal((await rpc()).total, 1);
  });
});
