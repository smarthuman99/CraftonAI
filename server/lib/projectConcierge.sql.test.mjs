import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("support migration applies; direct clients cannot read or forge messages/reviews", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE TABLE public.projects(id uuid PRIMARY KEY);
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;`);
  await db.exec(
    await readFile(new URL("../../supabase/migrations/20261114_project_support.sql", import.meta.url), "utf8")
  );
  const tables = [
    "project_support_sessions",
    "project_support_turns",
    "project_support_reviews",
    "project_support_limits"
  ];
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`SET ROLE ${role}`);
    for (const table of tables) {
      await assert.rejects(db.query(`SELECT * FROM ${table}`), /permission denied/);
      await assert.rejects(
        db.query(
          `INSERT INTO ${table}(${table === "project_support_limits" ? "user_id" : "id"}) VALUES(gen_random_uuid())`
        ),
        /permission denied/
      );
      await assert.rejects(db.query(`DELETE FROM ${table}`), /permission denied/);
    }
    await db.exec("RESET ROLE");
  }
  const rls = await db.query("SELECT relrowsecurity FROM pg_class WHERE relname = ANY($1)", [tables]);
  assert.equal(rls.rows.length, 4);
  assert.ok(rls.rows.every((r) => r.relrowsecurity));
  await db.exec("SET ROLE service_role");
  for (const table of tables) assert.equal((await db.query(`SELECT * FROM ${table}`)).rows.length, 0);
  await assert.rejects(db.query("UPDATE project_support_reviews SET note='forged'"), /permission denied/);
  await assert.rejects(db.query("DELETE FROM project_support_turns"), /permission denied/);
  await db.exec("RESET ROLE");
  const userId = "11111111-1111-4111-8111-111111111111",
    projectId = "22222222-2222-4222-8222-222222222222",
    sessionId = "33333333-3333-4333-8333-333333333333";
  await db.query("INSERT INTO auth.users(id) VALUES($1)", [userId]);
  await db.query("INSERT INTO projects(id) VALUES($1)", [projectId]);
  await db.query(
    "INSERT INTO project_support_sessions(id,user_id,project_id,client_name,project_name) VALUES($1,$2,$3,'Sarah','Demo')",
    [sessionId, userId, projectId]
  );
  const before = (await db.query("SELECT updated_at FROM project_support_sessions")).rows[0].updated_at;
  await db.exec("SET ROLE service_role");
  await db.query("SELECT review_project_support($1,$2,$3,'Verified','reviewed')", [sessionId, userId, before]);
  assert.equal((await db.query("SELECT status FROM project_support_sessions")).rows[0].status, "reviewed");
  assert.equal((await db.query("SELECT * FROM project_support_reviews")).rows.length, 1);
  await assert.rejects(
    db.query("SELECT review_project_support($1,$2,$3,'Stale','reviewed')", [sessionId, userId, before]),
    /Conversation changed/
  );
  assert.equal((await db.query("SELECT * FROM project_support_reviews")).rows.length, 1);
  const latest = (await db.query("SELECT updated_at FROM project_support_sessions")).rows[0].updated_at;
  await assert.rejects(
    db.query("SELECT review_project_support($1,$2,$3,'Invalid reviewer','needs_human')", [
      sessionId,
      "44444444-4444-4444-8444-444444444444",
      latest
    ]),
    /foreign key/
  );
  assert.equal((await db.query("SELECT status FROM project_support_sessions")).rows[0].status, "reviewed");
  await db.exec("RESET ROLE");

  await t.test("durable leases serialize requests and rate limits survive new callers", async () => {
    await db.exec("SET ROLE service_role");
    const lease = (await db.query("SELECT acquire_project_support($1) AS lease", [userId])).rows[0].lease;
    await assert.rejects(db.query("SELECT acquire_project_support($1)", [userId]), /Support request active/);
    await db.query("SELECT release_project_support($1,gen_random_uuid())", [userId]);
    await assert.rejects(db.query("SELECT acquire_project_support($1)", [userId]), /Support request active/);
    await db.query("SELECT release_project_support($1,$2)", [userId, lease]);
    for (let i = 1; i < 12; i++) {
      const next = (await db.query("SELECT acquire_project_support($1) AS lease", [userId])).rows[0].lease;
      await db.query("SELECT release_project_support($1,$2)", [userId, next]);
    }
    await assert.rejects(db.query("SELECT acquire_project_support($1)", [userId]), /Support rate limit/);
    await db.exec("RESET ROLE");
  });
  await t.test("pending turns invalidate reviews; completion preserves handoffs; stale work recovers", async () => {
    const turnId = "55555555-5555-4555-8555-555555555555";
    await db.exec("SET ROLE service_role");
    await db.query(
      "INSERT INTO project_support_turns(id,session_id,user_id,project_id,request_id,question,status,engine) VALUES($1,$2,$3,$4,gen_random_uuid(),'Progress?','pending','pending')",
      [turnId, sessionId, userId, projectId]
    );
    const pending = (await db.query("SELECT updated_at FROM project_support_sessions")).rows[0].updated_at;
    await assert.rejects(
      db.query("SELECT review_project_support($1,$2,$3,'Not yet','reviewed')", [sessionId, userId, pending]),
      /Conversation changed/
    );
    await db.query("UPDATE project_support_sessions SET status='needs_human' WHERE id=$1", [sessionId]);
    await db.query("SELECT finish_project_support_turn($1,'Recorded facts','[]','ai',false)", [turnId]);
    assert.equal(
      (await db.query("SELECT status FROM project_support_turns WHERE id=$1", [turnId])).rows[0].status,
      "complete"
    );
    assert.equal((await db.query("SELECT status FROM project_support_sessions")).rows[0].status, "needs_human");
    await db.query(
      "INSERT INTO project_support_turns(id,session_id,user_id,project_id,request_id,question,status,engine,created_at) VALUES(gen_random_uuid(),$1,$2,$3,gen_random_uuid(),'Old question','pending','pending',now()-interval '5 minutes')",
      [sessionId, userId, projectId]
    );
    await db.query("SELECT recover_project_support($1)", [userId]);
    const recovered = (await db.query("SELECT * FROM project_support_turns WHERE engine='recovery'")).rows[0];
    assert.equal(recovered.status, "complete");
    assert.match(recovered.answer, /interrupted/);
    assert.deepEqual(recovered.flags, ["interrupted_response"]);
    await db.exec("RESET ROLE");
  });
});
