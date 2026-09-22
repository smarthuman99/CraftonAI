import test from "node:test";
import assert from "node:assert/strict";
import {
  activeProjectJob,
  applyItemFields,
  buildEditPlan,
  importCandidates,
  itemFields,
  preserveItemIdentity,
  requiresProjectReview
} from "../../shared/clientProjectEditing.mjs";
import { assertProjectOwner, clientProjectCommand, projectEditVersion } from "./clientProjectEditing.mjs";
import { mergeProjectIntakeJobs } from "./rfqSourceData.mjs";
import { technicalDrawingPendingItems } from "./technicalDrawing.mjs";
import { isJobAutomationActive } from "./projectLifecycle.mjs";

const project = { id: "project-1", user_id: "client-1", name: "The Portal", current_stage: 3, client_edit_revision: 0 };
const chair = {
  id: "chair",
  item_ref: "CH-01",
  item_type_en: "Chair",
  item_type_cn: "椅",
  quantity: 2,
  dimensions_text: "600 × 600 × 800 mm",
  material_en: "Oak",
  notes_en: "Old note",
  color_en: "Natural",
  technical_drawing: { status: "ai_concept", drawing_storage_path: "old.png" }
};
const base = () => ({
  project: structuredClone(project),
  requiresReview: false,
  jobs: [
    {
      id: "job-1",
      project_id: project.id,
      user_id: "client-1",
      project_name: project.name,
      status: "needs_review",
      review_status: "pending",
      rfq_status: "not_started",
      updated_at: "2026-09-22T00:00:00Z",
      result_json: {
        items: [structuredClone(chair), { ...chair, id: "table", item_ref: "TB-01", item_type_en: "Table" }],
        payments: [{ amount: 500 }]
      }
    }
  ]
});
const opts = { actorId: "client-1", requestId: "request-1", at: "2026-09-22T01:00:00Z" };
const edit = (fields) => ({
  operation: "edit_item",
  jobId: "job-1",
  itemIndex: 0,
  fields: { ...itemFields(chair), ...fields }
});
const withImport = () => {
  const workspace = base();
  workspace.jobs.push({
    id: "import-1",
    client_import_state: "preview",
    status: "needs_review",
    updated_at: "v1",
    result_json: {
      items: [
        { ...chair, quantity: 5 },
        { ...chair, id: "new", item_ref: "SO-02", item_type_en: "Sofa" }
      ],
      project: { name: "Different name" }
    }
  });
  return workspace;
};

test("ownership uses authenticated identity, not editable user metadata", () => {
  assert.throws(
    () => assertProjectOwner(project, { id: "another-client", user_metadata: { role: "admin" } }),
    /access/
  );
  assert.doesNotThrow(() => assertProjectOwner(project, { id: "client-1" }));
  assert.doesNotThrow(() => assertProjectOwner(project, { id: "staff", app_metadata: { role: "admin" } }));
});
test("draft save changes one item, keeps audit, payments and tracking, invalidates only the old drawing", () => {
  const workspace = base(),
    before = structuredClone(workspace);
  const plan = buildEditPlan(
    workspace,
    edit({ name: "Lobby chair", quantity: "8", material: "Walnut", notes: "" }),
    opts
  );
  const next = plan.patches[0].result_json;
  assert.equal(next.items[0].quantity, 8);
  assert.equal(next.items[0].quantity_text, "8");
  assert.equal(next.items[0].notes_en, "");
  assert.equal(next.items[0].technical_drawing.status, "queued");
  assert.equal(next.items[0].client_revisions[0].previous.technical_drawing.drawing_storage_path, "old.png");
  assert.deepEqual(next.items[1], workspace.jobs[0].result_json.items[1]);
  assert.deepEqual(next.payments, [{ amount: 500 }]);
  assert.deepEqual(workspace, before);
  assert.equal(plan.guardDraft, true);
  assert.equal(plan.syncSpecs, true);
});
test("clearing fields removes legacy aliases instead of resurrecting previous content", () => {
  const item = { ...chair, notesEn: "stale", note: "stale", color: "red", colorEn: "red", materialEn: "old" };
  const next = applyItemFields(item, { ...itemFields(item), notes: "", color: "", material: "" }, opts);
  assert.equal(itemFields(next).notes, "");
  assert.equal(itemFields(next).color, "");
  assert.equal(itemFields(next).material, "");
});
test("quantity-only edits preserve bilingual names, materials and notes", () => {
  const original = { ...chair, material_cn: "橡木", notes_cn: "中文备注" };
  const next = applyItemFields(original, { ...itemFields(original), quantity: "6" }, opts);
  assert.equal(next.item_type_cn, "椅");
  assert.equal(next.material_cn, "橡木");
  assert.equal(next.notes_cn, "中文备注");
  assert.equal(next.item_type_en, "Chair");
});
test("invalid quantities, unsupported fields, stale indices and retired projects are rejected", () => {
  for (const quantity of ["", "1.5", "-1", "0", "1000001", "NaN"])
    assert.throws(() => buildEditPlan(base(), edit({ quantity }), opts), /Quantity/);
  assert.throws(() => buildEditPlan(base(), edit({ unit_price: 1 }), opts), /Unsupported/);
  assert.throws(() => buildEditPlan(base(), { ...edit({}), itemIndex: 20 }, opts), /could not be found/);
  const workspace = base();
  workspace.project.lifecycle_status = "archived";
  assert.throws(() => buildEditPlan(workspace, edit({}), opts), /read-only/);
});
test("renaming freezes the existing fallback SKU and tracking identity", () => {
  const workspace = base(),
    originalIdentity = preserveItemIdentity(project, workspace.jobs[0], chair, 0);
  const plan = buildEditPlan(workspace, { operation: "rename", name: "New hotel", notes: "Client reference" }, opts);
  const next = plan.patches[0].result_json.items[0];
  assert.equal(next.sku, originalIdentity.sku);
  assert.equal(next.tracking_id, originalIdentity.tracking_id);
  assert.equal(plan.projectPatch.name, "New hotel");
  assert.equal(plan.syncSpecs, false);
  const later = preserveItemIdentity({ ...project, name: "New hotel" }, workspace.jobs[0], next, 0);
  assert.equal(later.sku, next.sku);
  assert.equal(later.tracking_id, next.tracking_id);
});
test("quotes, approvals, production and approved drawings require review", () => {
  const jobs = base().jobs;
  assert.equal(requiresProjectReview(project, jobs), false);
  assert.equal(requiresProjectReview({ ...project, current_stage: 9 }, jobs), true);
  assert.equal(requiresProjectReview(project, [{ ...jobs[0], review_status: "approved" }]), true);
  assert.equal(requiresProjectReview(project, [{ ...jobs[0], rfq_status: "draft" }]), true);
  assert.equal(requiresProjectReview(project, jobs, true), true);
  jobs[0].result_json.items[0].technical_drawing.revisions = [
    { kind: "supplier_shop_drawing", review_status: "approved" }
  ];
  assert.equal(requiresProjectReview(project, jobs), true);
});
test("confirmed item edits and reference photos become requests, preserving the effective item", () => {
  const workspace = base();
  workspace.requiresReview = true;
  const plan = buildEditPlan(workspace, edit({ quantity: "9" }), {
    ...opts,
    image: { image_storage_path: "new.png", reference_file_id: "file-1" }
  });
  assert.equal(plan.outcome, "requested");
  assert.equal(plan.syncSpecs, false);
  assert.deepEqual(plan.patches[0].result_json.items, workspace.jobs[0].result_json.items);
  const request = plan.patches[0].result_json.client_change_requests[0];
  assert.equal(request.proposed.quantity, 9);
  assert.equal(request.before.quantity, 2);
  assert.equal(request.proposed.image_storage_path, "new.png");
  workspace.jobs[0].result_json = plan.patches[0].result_json;
  assert.throws(() => buildEditPlan(workspace, edit({ quantity: "10" }), opts), /already open/);
});
test("import previews match reference/name without merging until explicit confirmation", () => {
  const workspace = withImport();
  const preview = importCandidates(workspace.jobs, workspace.jobs[1]);
  assert.equal(preview[0].matches[0].jobId, "job-1");
  assert.throws(
    () =>
      buildEditPlan(
        workspace,
        { operation: "confirm_import", jobId: "import-1", choices: [{ action: "" }, { action: "add" }] },
        opts
      ),
    /Choose/
  );
  assert.throws(
    () =>
      buildEditPlan(
        workspace,
        {
          operation: "confirm_import",
          jobId: "import-1",
          choices: [{ action: "update", jobId: "alien", itemIndex: 0 }, { action: "skip" }]
        },
        opts
      ),
    /matching item/
  );
});
test("confirmed import updates selected row and appends new rows without replacing existing project or payments", () => {
  const workspace = withImport();
  const plan = buildEditPlan(
    workspace,
    {
      operation: "confirm_import",
      jobId: "import-1",
      choices: [{ action: "update", jobId: "job-1", itemIndex: 0 }, { action: "add" }]
    },
    opts
  );
  assert.equal(plan.patches[0].result_json.items[0].quantity, 5);
  assert.equal(plan.patches[0].result_json.items[1].item_type_en, "Table");
  assert.deepEqual(plan.patches[0].result_json.payments, [{ amount: 500 }]);
  const added = plan.patches.find((p) => p.id === "import-1");
  assert.equal(added.client_import_state, "merged");
  assert.equal(added.result_json.items.length, 1);
  assert.equal(added.result_json.source_items.length, 2);
  assert.equal(added.result_json.source_project.name, "Different name");
  assert.equal(added.result_json.project.name, project.name);
  const confirmedJobs = workspace.jobs.map((job) => ({ ...job, ...plan.patches.find((patch) => patch.id === job.id) }));
  assert.equal(mergeProjectIntakeJobs(confirmedJobs).order_count, 1);
  assert.deepEqual(plan.projectPatch, {});
  assert.notEqual(added.result_json.items[0].tracking_id, plan.patches[0].result_json.items[0].tracking_id);
});
test("advanced imports stay staged, duplicate targets and already merged imports are rejected", () => {
  const workspace = withImport();
  workspace.requiresReview = true;
  const command = { operation: "confirm_import", jobId: "import-1", choices: [{ action: "add" }, { action: "skip" }] };
  const plan = buildEditPlan(workspace, command, opts);
  assert.equal(plan.outcome, "requested");
  assert.equal(plan.patches[0].client_import_state, undefined);
  assert.equal(plan.syncSpecs, false);
  workspace.jobs[1].client_import_state = "merged";
  assert.throws(() => buildEditPlan(workspace, command, opts), /not ready/);
  const duplicate = withImport();
  duplicate.jobs[1].result_json.items[1] = chair;
  command.choices = [0, 1].map(() => ({ action: "update", jobId: "job-1", itemIndex: 0 }));
  assert.throws(() => buildEditPlan(duplicate, command, opts), /same furniture/);
});
test("staged and discarded imports never enter RFQ or drawing queues", () => {
  const workspace = withImport();
  workspace.jobs[1].result_json.items[0].image_storage_path = "image.png";
  assert.equal(mergeProjectIntakeJobs(workspace.jobs).items.length, 2);
  assert.equal(activeProjectJob(workspace.jobs[1]), false);
  assert.equal(isJobAutomationActive(workspace.jobs[1]), false);
  assert.equal(isJobAutomationActive(workspace.jobs[1], true), true);
  assert.deepEqual(technicalDrawingPendingItems(workspace.jobs[1]), []);
});
test("staff review records a response without altering effective specifications", () => {
  const workspace = base();
  workspace.requiresReview = true;
  workspace.jobs[0].result_json = buildEditPlan(workspace, edit({ quantity: "9" }), opts).patches[0].result_json;
  const command = {
    operation: "review_request",
    jobId: "job-1",
    requestId: "request-1",
    status: "in_review",
    note: "Checking delivery impact"
  };
  assert.throws(() => buildEditPlan(workspace, command, opts), /Only Crafton/);
  const plan = buildEditPlan(workspace, command, { ...opts, staff: true });
  assert.equal(plan.patches[0].result_json.client_change_requests[0].response, command.note);
  assert.equal(plan.patches[0].result_json.items[0].quantity, 2);
});
test("a request can close only after its specific item receives a newer specification approval", () => {
  const workspace = base();
  workspace.requiresReview = true;
  workspace.jobs[0].result_json = buildEditPlan(workspace, edit({ quantity: "9" }), opts).patches[0].result_json;
  const command = {
    operation: "review_request",
    jobId: "job-1",
    requestId: "request-1",
    status: "resolved",
    note: "Confirmed after revised quotation and approval."
  };
  assert.throws(
    () => buildEditPlan(workspace, command, { ...opts, staff: true }),
    /Approve the requested specification/
  );
  workspace.jobs[0].result_json.items[0] = workspace.jobs[0].result_json.client_change_requests[0].proposed;
  workspace.jobs[0].review_status = "approved";
  workspace.jobs[0].reviewed_at = "2026-09-22T02:00:00Z";
  const plan = buildEditPlan(workspace, command, { ...opts, staff: true });
  assert.equal(plan.patches[0].result_json.client_change_requests[0].status, "resolved");
  assert.equal(plan.syncSpecs, false);
});
test("version detects independent changes and stale commands never reach commit", async () => {
  const workspace = base(),
    before = projectEditVersion(workspace);
  workspace.jobs[0].updated_at = "later";
  assert.notEqual(projectEditVersion(workspace), before);
  let commits = 0;
  const supabase = {
    from(table) {
      const query = {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        order() {
          return this;
        },
        range() {
          return this;
        },
        maybeSingle() {
          return this;
        },
        then(resolve) {
          resolve({ data: table === "projects" ? project : table === "intake_jobs" ? workspace.jobs : [], count: 0 });
        }
      };
      return query;
    },
    rpc() {
      commits++;
    }
  };
  await assert.rejects(
    () =>
      clientProjectCommand({
        supabase,
        user: { id: "client-1" },
        body: { ...edit({}), projectId: project.id, version: "stale" }
      }),
    /has changed/
  );
  assert.equal(commits, 0);
});
