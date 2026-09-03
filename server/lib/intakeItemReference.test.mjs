import test from "node:test";
import assert from "node:assert/strict";
import { patchIntakeItemReferenceResult } from "./intakeItemReference.mjs";

const image = {
  storageBucket: "intake-files",
  storagePath: "user/item-references/job/reference.jpg",
  mimeType: "image/jpeg",
  width: 1200,
  height: 900,
  byteLength: 123456,
  sha256: "image-hash"
};

test("attaches a manual image to one item without changing project workflow data", () => {
  const result = {
    project: { name: "Henley", destination: "London" },
    questions: ["Confirm fabric"],
    clarification_workflow: { status: "client_completion" },
    items: [
      {
        item_ref: "CHAIR-01",
        sku: "CRF-CHAIR-01",
        tracking_id: "TRK-CHAIR-01",
        material_en: "Fabric",
        technical_drawing: {
          status: "ai_concept",
          attempts: 2,
          drawing_storage_path: "old-drawing.png",
          revisions: [{ revision: "R00", storage_path: "old-drawing.png" }]
        }
      },
      { item_ref: "TABLE-01", technical_drawing: { status: "ai_concept" } }
    ]
  };

  const patched = patchIntakeItemReferenceResult({
    result,
    itemIndex: 0,
    expectedItemRef: "CHAIR-01",
    image,
    actorId: "user-1",
    uploadedAt: "2026-09-04T00:00:00.000Z"
  });

  assert.deepEqual(patched.project, result.project);
  assert.deepEqual(patched.questions, result.questions);
  assert.deepEqual(patched.clarification_workflow, result.clarification_workflow);
  assert.equal(patched.items[0].sku, "CRF-CHAIR-01");
  assert.equal(patched.items[0].tracking_id, "TRK-CHAIR-01");
  assert.equal(patched.items[0].material_en, "Fabric");
  assert.equal(patched.items[0].image_storage_path, image.storagePath);
  assert.equal(patched.items[0].image_mapping_status, "manual_reference");
  assert.equal(patched.items[0].technical_drawing.status, "not_started");
  assert.equal(patched.items[0].technical_drawing.attempts, 0);
  assert.equal(patched.items[0].technical_drawing.drawing_storage_path, "");
  assert.deepEqual(patched.items[0].technical_drawing.revisions, result.items[0].technical_drawing.revisions);
  assert.deepEqual(patched.items[1], result.items[1]);
  assert.deepEqual(result.items[0].technical_drawing.drawing_storage_path, "old-drawing.png");
});

test("rejects a stale furniture identity and approved supplier drawing", () => {
  assert.throws(
    () =>
      patchIntakeItemReferenceResult({
        result: { items: [{ item_ref: "CHAIR-02" }] },
        itemIndex: 0,
        expectedItemRef: "CHAIR-01",
        image,
        actorId: "user-1",
        uploadedAt: "2026-09-04T00:00:00.000Z"
      }),
    /furniture line changed/i
  );

  assert.throws(
    () =>
      patchIntakeItemReferenceResult({
        result: { items: [{ item_ref: "CHAIR-01", technical_drawing: { status: "approved_for_manufacture" } }] },
        itemIndex: 0,
        expectedItemRef: "CHAIR-01",
        image,
        actorId: "user-1",
        uploadedAt: "2026-09-04T00:00:00.000Z"
      }),
    /approved supplier drawing/i
  );

  assert.throws(
    () =>
      patchIntakeItemReferenceResult({
        result: {
          items: [
            {
              item_ref: "CHAIR-01",
              technical_drawing: {
                status: "ai_concept",
                revisions: [{ kind: "supplier_shop_drawing", review_status: "approved", revision: "R02" }]
              }
            }
          ]
        },
        itemIndex: 0,
        expectedItemRef: "CHAIR-01",
        image,
        actorId: "user-1",
        uploadedAt: "2026-09-04T00:00:00.000Z"
      }),
    /approved supplier drawing/i
  );
});
