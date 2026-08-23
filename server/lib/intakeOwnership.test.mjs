import test from "node:test";
import assert from "node:assert/strict";
import { bindIntakeResultToOwner, resolveOwnerClientName } from "./intakeOwnership.mjs";

test("uses the account full name for project ownership and preserves an extracted end-client name", () => {
  const result = bindIntakeResultToOwner(
    { project: { name: "The Portal Amenity", client_name: "Fossey Arora" }, items: [] },
    { profile: { full_name: "Craftonadmin", company: "The Crafton Ltd" } }
  );

  assert.equal(result.project.client_name, "Craftonadmin");
  assert.equal(result.project.source_client_name, "Fossey Arora");
});

test("falls back to the account company when the full name is empty", () => {
  assert.equal(resolveOwnerClientName({ full_name: "", company: "The Crafton Ltd" }), "The Crafton Ltd");
});

test("does not preserve a generic portal placeholder as a source client", () => {
  const result = bindIntakeResultToOwner(
    { project: { name: "Portal Amenity", client_name: "Portal Intake Client" } },
    { profile: { full_name: "Craftonadmin" } }
  );

  assert.equal(result.project.client_name, "Craftonadmin");
  assert.equal(result.project.source_client_name, undefined);
});
