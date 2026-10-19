import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createThumbnailAssets } from "./portalThumbnailAssets.mjs";
const owner = "11111111-1111-4111-8111-111111111111",
  foreign = "22222222-2222-4222-8222-222222222222";

test("background assets enforce batch ownership, private signatures, expiry and immutable image versions", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "crafton-private-thumbnails-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  let time = 1800000000000,
    downloads = 0,
    resizes = 0,
    queries = 0,
    original = "original-a";
  const source = { bucket: "private", path: "owner/photo", revision: "v1" };
  const rows = [
    { job_id: owner, project_id: "p", owner_id: owner, items: [source] },
    { job_id: foreign, project_id: "q", owner_id: foreign, items: [source] }
  ];
  const supabase = {
    from: () => ({
      select: () => ({
        in: async (_column, ids) => {
          queries++;
          return { data: rows.filter((r) => ids.includes(r.job_id)) };
        }
      })
    }),
    storage: {
      from: () => ({
        info: async () => ({ data: { eTag: original, size: original.length } }),
        download: async () => {
          downloads++;
          return { data: new Blob([original]) };
        }
      })
    }
  };
  const assets = createThumbnailAssets({
    root,
    now: () => time,
    resize: async () => {
      resizes++;
      return Buffer.from("small-webp");
    }
  });
  const ref = { jobId: owner, index: 0, version: "v1" };
  const user = { id: owner, app_metadata: {} };
  const authorize = (body = { references: [ref], projectId: "p" }, customUser = user) =>
    assets.authorizeBatch({ supabase, user: customUser, body });
  await assert.rejects(authorize(undefined, null), { statusCode: 401 });
  await assert.rejects(authorize({ references: Array(25).fill(ref) }), { statusCode: 400 });
  await assert.rejects(authorize({ references: [ref, { ...ref, jobId: foreign }] }), { statusCode: 404 });
  await assert.rejects(authorize({ references: [ref], projectId: "q" }), { statusCode: 404 });
  assert.equal((await authorize()).images[0].status, "pending");
  assert.equal(downloads, 0);
  assert.equal(resizes, 0);
  await Promise.all([assets.prepare(supabase, source), assets.prepare(supabase, source)]);
  assert.equal(downloads, 1);
  assert.equal(resizes, 1);
  const before = queries,
    first = (await authorize()).images[0];
  assert.equal(queries - before, 1);
  assert.equal(first.status, "ready");
  const url = new URL(first.url, "https://thecrafton.com");
  const served = await assets.imageResponse(url);
  assert.equal(served.bytes.toString(), "small-webp");
  assert.equal(served.status, 200);
  assert.match(served.headers["Cache-Control"], /^private, max-age=\d+$/);
  assert.equal((await assets.imageResponse(url, served.headers.ETag)).status, 304);
  const altered = new URL(url);
  altered.searchParams.set("owner", foreign);
  await assert.rejects(assets.imageResponse(altered, served.headers.ETag), { statusCode: 403 });
  const traversal = new URL(url);
  traversal.searchParams.set("thumbnail", "../../etc/passwd");
  await assert.rejects(assets.imageResponse(traversal), { statusCode: 403 });
  rows[0].notes = "new notes";
  await assets.prepare(supabase, source);
  assert.equal(downloads, 1);
  assert.equal((await authorize()).images[0].url, first.url);
  source.revision = "v2";
  original = "original-b";
  assert.equal((await authorize()).images[0].status, "pending");
  await assets.prepare(supabase, source);
  assert.notEqual((await authorize()).images[0].version, first.version);
  assert.equal(resizes, 2);
  await assert.rejects(authorize({ references: [{ ...ref, jobId: foreign }] }), { statusCode: 404 });
  const staff = { id: owner, app_metadata: { role: "staff" } };
  assert.equal(
    (await authorize({ references: [{ ...ref, jobId: foreign }], projectId: "q" }, staff)).images[0].status,
    "ready"
  );
  time = first.expiresAt + 1;
  await assert.rejects(assets.imageResponse(url, served.headers.ETag), { statusCode: 403 });
});
