import test from "node:test";
import assert from "node:assert/strict";
import {
  createRefreshQueue,
  createSignedPreviewCache,
  getVerifiedBrowserUser,
  clearVerifiedBrowserUser,
  mergeReviewPreviewUrls
} from "./portalPerformance.mjs";
import { readPortalWorkspace, readClientProgress, signIntakeRows } from "./portalWorkspace.mjs";

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const turn = () => new Promise((resolve) => setImmediate(resolve));
const ownerId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";

test("preview hydration preserves in-progress specifications, notes and manually changed photos", () => {
  const base = {
    projectKey: "project",
    previewUrl: "",
    items: [
      {
        id: "chair",
        sourceJobIds: ["job"],
        qty: 1,
        notesEn: "original",
        imageUrl: "",
        technicalDrawing: { status: "pending", url: "" }
      },
      { id: "table", sourceJobIds: ["job"], imageUrl: "" }
    ]
  };
  const draft = {
    ...base,
    reviewNotes: "Unsaved review",
    items: [
      { ...base.items[0], qty: 7, notesEn: "Unsaved specification" },
      { ...base.items[1], imageUrl: "new-user-photo" }
    ]
  };
  const refreshed = {
    ...base,
    items: base.items.map((item) => ({
      ...item,
      imageUrl: "signed-photo",
      technicalDrawing: { status: "old-server-status", url: "signed-drawing" }
    }))
  };
  const merged = mergeReviewPreviewUrls(draft, refreshed, base);
  assert.equal(merged.reviewNotes, "Unsaved review");
  assert.equal(merged.items[0].qty, 7);
  assert.equal(merged.items[0].notesEn, "Unsaved specification");
  assert.equal(merged.items[0].imageUrl, "signed-photo");
  assert.equal(merged.items[0].technicalDrawing.status, "pending");
  assert.equal(merged.items[0].technicalDrawing.url, "signed-drawing");
  assert.equal(merged.items[1].imageUrl, "new-user-photo");
});

test("admin list does not wait for Storage signatures", async () => {
  const image = deferred(),
    reviews = [];
  const row = {
    id: "job",
    user_id: ownerId,
    result_json: { items: [{ id: "chair", image_storage_bucket: "b", image_storage_path: "p" }] }
  };
  const client = database(({ table, filters }) => {
    if (table === "user_profiles") return { data: [{ user_id: ownerId, full_name: "QA" }] };
    if (table === "intake_jobs") return { data: filters.some(([method]) => method === "or") ? [] : [row] };
    return { data: [] };
  });
  const pending = readPortalWorkspace({
    client,
    ownerId,
    isStaff: true,
    previews: { sign: (_client, bucket) => (bucket ? image.promise : Promise.resolve("")) },
    onClientRows: () => {},
    onReviewRows: (rows, metadata) => reviews.push({ rows, metadata }),
    onReviewError: assert.fail,
    onProgressError: assert.fail,
    loadDrawings: async () => ({ files: [] })
  });
  await turn();
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0].metadata.previewsOnly, false);
  assert.equal(reviews[0].rows[0].owner_profile.full_name, "QA");
  image.resolve("signed");
  await pending;
  assert.equal(reviews[1].metadata.previewsOnly, true);
  assert.equal(reviews[1].rows[0].result_json.items[0].image_url, "signed");
});

test("concurrent reads share one request, but a save during it triggers a fresh read", async () => {
  const queue = createRefreshQueue();
  const first = deferred();
  let calls = 0;
  const read = () => {
    calls++;
    return calls === 1 ? first.promise : Promise.resolve("fresh");
  };
  const pending = queue.run("owner/project", read);
  assert.equal(queue.run("owner/project", read), pending);
  queue.run("owner/project", read, { invalidate: true });
  queue.run("owner/project", read, { invalidate: true });
  assert.equal(calls, 1);
  first.resolve("old");
  assert.equal(await pending, "fresh");
  assert.equal(calls, 2);
  assert.equal(await queue.run("different-owner/project", () => "separate"), "separate");
});

test("a rejected read is retryable", async () => {
  const queue = createRefreshQueue();
  await assert.rejects(queue.run("x", () => Promise.reject(new Error("offline"))));
  assert.equal(await queue.run("x", () => "recovered"), "recovered");
});

test("verified user requests are shared only for the same current session token", async () => {
  let token = "one";
  let calls = 0;
  const client = {
    auth: {
      getSession: async () => ({ data: { session: token ? { access_token: token } : null } }),
      getUser: async (value) => {
        calls++;
        return { data: { user: { id: value } } };
      }
    }
  };
  const users = await Promise.all([getVerifiedBrowserUser(client), getVerifiedBrowserUser(client)]);
  assert.equal(calls, 1);
  assert.deepEqual(
    users.map((user) => user.id),
    ["one", "one"]
  );
  token = "two";
  assert.equal((await getVerifiedBrowserUser(client)).id, "two");
  assert.equal(calls, 2);
  token = "";
  assert.equal(await getVerifiedBrowserUser(client), null);
  token = "one";
  await getVerifiedBrowserUser(client);
  assert.equal(calls, 3);
  clearVerifiedBrowserUser(client);
  await getVerifiedBrowserUser(client);
  assert.equal(calls, 4);
});

test("Storage deduplicates paths across jobs and image/draft/formal references, preserves full evidence", async () => {
  const requests = [];
  const client = {
    storage: {
      from: (bucket) => ({
        createSignedUrls: async (paths) => {
          requests.push({ bucket, paths });
          // Storage response ordering must not change which item receives a URL.
          return { data: [...paths].reverse().map((path) => ({ path, signedUrl: `signed:${bucket}/${path}` })) };
        }
      })
    }
  };
  const cache = createSignedPreviewCache();
  const makeRow = (id) => ({
    id,
    result_json: {
      evidence_gate: { keep: true },
      items: [
        {
          id: "item",
          image_storage_bucket: "private",
          image_storage_path: "photo",
          technical_drawing: {
            storage_bucket: "private",
            drawing_storage_path: "drawing",
            draft_storage_path: "drawing",
            formal_storage_path: "drawing"
          }
        }
      ]
    }
  });
  const rows = await signIntakeRows(client, [makeRow("a"), makeRow("b")], cache);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].paths, ["photo", "drawing"]);
  assert.equal(rows[1].result_json.items[0].image_url, "signed:private/photo");
  assert.equal(rows[0].result_json.items[0].technical_drawing.formal_url, "signed:private/drawing");
  assert.deepEqual(rows[0].result_json.evidence_gate, { keep: true });
  await signIntakeRows(client, [makeRow("a")], cache);
  assert.equal(requests.length, 1);
});

test("expired signatures refresh, failures retry, and a new account cache cannot reuse private URLs", async () => {
  let time = 0,
    calls = 0,
    fail = false;
  const client = {
    storage: {
      from: () => ({
        createSignedUrls: async (paths) => {
          calls++;
          return fail
            ? { error: new Error("offline") }
            : { data: paths.map((path) => ({ path, signedUrl: `url-${calls}` })) };
        }
      })
    }
  };
  const cache = createSignedPreviewCache({ now: () => time });
  assert.equal(await cache.sign(client, "b", "p"), "url-1");
  time = 55 * 60000;
  assert.equal(await cache.sign(client, "b", "p"), "url-2");
  fail = true;
  assert.equal(await cache.sign(client, "b", "failed"), "");
  fail = false;
  assert.equal(await cache.sign(client, "b", "failed"), "url-4");
  assert.equal(await createSignedPreviewCache().sign(client, "b", "p"), "url-5");
});

function database(handler) {
  return {
    from(table) {
      const query = { table, filters: [] };
      const builder = {};
      for (const method of ["select", "in", "or", "order", "limit"])
        builder[method] = (...args) => {
          query.filters.push([method, ...args]);
          return builder;
        };
      builder.then = (yes, no) =>
        Promise.resolve()
          .then(() => handler(query))
          .then(yes, no);
      return builder;
    }
  };
}

test("client list renders while progress and image signing are still pending; foreign rows never render", async () => {
  const progress = deferred(),
    images = deferred();
  const observations = [],
    requests = [];
  let drawingCalls = 0;
  const client = database((query) => {
    requests.push(query);
    if (query.table === "intake_jobs")
      return {
        data: [
          {
            id: "own",
            project_id: "project",
            user_id: ownerId,
            result_json: { items: [{ image_storage_bucket: "b", image_storage_path: "p" }] }
          },
          { id: "foreign", project_id: "other-project", user_id: otherId }
        ]
      };
    return progress.promise;
  });
  const pending = readPortalWorkspace({
    client,
    ownerId,
    isStaff: false,
    previews: { sign: (_client, bucket) => (bucket ? images.promise : Promise.resolve("")) },
    onClientRows: (rows) => observations.push(rows),
    onReviewRows: () => assert.fail("client read staff data"),
    onReviewError: assert.fail,
    onProgressError: assert.fail,
    loadDrawings: async () => {
      drawingCalls++;
      return { files: [] };
    }
  });
  await turn();
  assert.equal(observations.length, 1);
  assert.deepEqual(
    observations[0].map((row) => row.id),
    ["own"]
  );
  assert.ok(requests[0].filters.some(([method, value]) => method === "or" && value.includes(ownerId)));
  assert.ok(
    requests
      .filter((query) => query.table !== "intake_jobs")
      .every((query) =>
        query.filters.some(
          ([method, key, values]) => method === "in" && key === "project_id" && values.join() === "project"
        )
      )
  );
  images.resolve("signed-image");
  progress.resolve({ data: [] });
  await pending;
  assert.equal(observations.at(-1)[0].result_json.items[0].image_url, "signed-image");
  assert.equal(drawingCalls, 0);
});

test("only projects with supplier drawings request their register; partial table failures retain other progress", async () => {
  const calls = [],
    errors = [];
  const client = database(({ table }) => {
    if (table === "project_files")
      return { data: [{ id: "drawing", project_id: "with-drawing", file_group: "supplier_shop_drawing" }] };
    if (table === "shipments") return { error: new Error("temporary failure") };
    return { data: [{ id: "progress", project_id: "without-drawing" }] };
  });
  const result = await readClientProgress(
    client,
    [{ project_id: "with-drawing" }, { project_id: "without-drawing" }],
    async (id) => {
      calls.push(id);
      return { files: [{ id: "drawing", project_id: id, file_url: "signed" }] };
    },
    (error) => errors.push(error)
  );
  assert.deepEqual(calls, ["with-drawing"]);
  assert.equal(result.projectFiles[0].file_url, "signed");
  assert.equal(result.productionUpdates.length, 1);
  assert.equal("shipments" in result, false);
  assert.equal(errors.length, 1);
});
