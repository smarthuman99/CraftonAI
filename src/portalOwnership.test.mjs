import test from "node:test";
import assert from "node:assert/strict";
import { buildPortalOwnershipFilter, filterPortalJobsForOwner, getPortalJobOwnerId } from "./portalOwnership.js";

const ownerA = "11111111-1111-4111-8111-111111111111";
const ownerB = "22222222-2222-4222-8222-222222222222";

test("Client Portal ownership accepts both current and legacy owner columns", () => {
  assert.equal(getPortalJobOwnerId({ user_id: ownerA, requested_by: ownerB }), ownerA);
  assert.equal(getPortalJobOwnerId({ requested_by: ownerB }), ownerB);
  assert.equal(getPortalJobOwnerId({ intake_files: [{ uploaded_by: ownerA }] }), ownerA);
});

test("Client Portal never returns another account's projects", () => {
  const jobs = [
    { id: "owned-current", user_id: ownerA },
    { id: "owned-legacy", requested_by: ownerA },
    { id: "another-account", user_id: ownerB },
    { id: "unowned" }
  ];
  assert.deepEqual(
    filterPortalJobsForOwner(jobs, ownerA).map((job) => job.id),
    ["owned-current", "owned-legacy"]
  );
  assert.deepEqual(filterPortalJobsForOwner(jobs, ""), []);
});

test("database query filter binds both ownership columns to auth.uid", () => {
  assert.equal(buildPortalOwnershipFilter(ownerA), `user_id.eq.${ownerA},requested_by.eq.${ownerA}`);
  assert.throws(() => buildPortalOwnershipFilter("not-a-user-id"), /valid authenticated owner id/i);
});
