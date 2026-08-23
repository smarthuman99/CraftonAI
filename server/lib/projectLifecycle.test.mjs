import test from "node:test";
import assert from "node:assert/strict";
import { getJobLifecycleStatus, isJobAutomationActive } from "./projectLifecycle.mjs";

test("project row lifecycle takes priority over the JSON fallback", () => {
  const job = {
    projects: { lifecycle_status: "archived" },
    result_json: { project_lifecycle: { status: "active" } }
  };
  assert.equal(getJobLifecycleStatus(job), "archived");
  assert.equal(isJobAutomationActive(job), false);
});

test("JSON lifecycle fallback stops automation before the migration is installed", () => {
  const job = { result_json: { project_lifecycle: { status: "abandoned" } } };
  assert.equal(getJobLifecycleStatus(job), "abandoned");
  assert.equal(isJobAutomationActive(job), false);
});

test("new and restored jobs remain active", () => {
  assert.equal(isJobAutomationActive({ result_json: {} }), true);
  assert.equal(isJobAutomationActive({ result_json: { project_lifecycle: { status: "active" } } }), true);
});
