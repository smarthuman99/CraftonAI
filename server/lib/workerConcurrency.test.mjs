import test from "node:test";
import assert from "node:assert/strict";
import { exclusiveTask } from "./workerConcurrency.mjs";

test("slow worker batches cannot overlap across polling intervals", async () => {
  let finish,
    claims = 0;
  const run = exclusiveTask(() => {
    claims++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const first = run();
  await Promise.resolve();
  for (let poll = 0; poll < 20; poll++) assert.equal(run(), first);
  assert.equal(claims, 1);
  finish();
  await first;
  const next = run();
  await Promise.resolve();
  assert.equal(claims, 2);
  finish();
  await next;
});

test("worker continues polling after a failed batch", async () => {
  let calls = 0;
  const run = exclusiveTask(() => {
    if (++calls === 1) throw new Error("temporary database failure");
    return "recovered";
  });
  await assert.rejects(run(), /temporary/);
  assert.equal(await run(), "recovered");
});
