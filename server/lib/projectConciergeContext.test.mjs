import test from "node:test";
import assert from "node:assert/strict";
import { supportProjectContext } from "./projectConciergeContext.mjs";
const user = { id: "owner" },
  project = { id: "project", user_id: "owner", name: "Real project", current_stage: 1, lifecycle_status: "active" };
const job = {
  id: "order",
  user_id: "owner",
  review_status: "pending",
  rfq_status: "not_started",
  items: [
    {
      item_type_en: "Chair",
      quantity: 24,
      dimensions_text: "W 600 × D 550 × H 800 mm",
      material_en: "Oak",
      color_en: "Natural",
      unit_price: 999,
      supplier_cost: 123,
      notes_en: "Private internal note",
      technical_drawing: { secret: "never include" }
    }
  ]
};
test("matches active portal orders, includes dimensions and never forwards internal fields", () => {
  const c = supportProjectContext({
    user,
    project,
    jobs: [job, { ...job, id: "preview", client_import_state: "preview", items: [{ quantity: 100 }] }],
    specifications: [{ item_type_en: "Stale", quantity: 2 }]
  });
  assert.equal(c.items.length, 1);
  assert.equal(c.items[0].quantity, 24);
  assert.equal(c.items[0].dimensions, job.items[0].dimensions_text);
  assert.equal(c.project.current_stage, 3);
  assert.equal(c.items[0].record_status, "pending");
  assert.doesNotMatch(JSON.stringify(c), /999|123|Private internal note|never include|supplier_cost/);
});
test("does not expose another owner's job even under an owned project", () => {
  assert.throws(() => supportProjectContext({ user, project, jobs: [{ ...job, user_id: "another" }] }), {
    statusCode: 403
  });
  assert.throws(() => supportProjectContext({ user, project: { ...project, user_id: "another" } }), {
    statusCode: 404
  });
});
test("preserves archived state and takes the furthest recorded workflow stage", () => {
  const c = supportProjectContext({
    user,
    project: { ...project, current_stage: 9, lifecycle_status: "archived" },
    jobs: [{ ...job, review_status: "revision_requested" }],
    events: [{ stage_id: "S02" }, { stage_id: "S11" }]
  });
  assert.equal(c.project.current_stage, 11);
  assert.equal(c.project.lifecycle_status, "archived");
});
test("falls back to specifications only when no active intake items exist; missing quantity stays unknown", () => {
  const c = supportProjectContext({ user, project, specifications: [{ item_type_en: "Chair" }] });
  assert.equal(c.items[0].quantity, null);
  assert.equal(c.items[0].item_type_en, "Chair");
});
