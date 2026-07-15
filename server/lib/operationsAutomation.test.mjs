import test from "node:test";
import assert from "node:assert/strict";
import { buildOperationsPlan } from "./operationsAutomation.mjs";

const context = {
  project: { id: "project-1", name: "Hotel", desired_delivery_date: "2026-10-30", destination: "London" },
  rfqs: [
    {
      payload: {
        document: {
          items: [{ nameEn: "Stool", quantity: 15, dimensions: "L 28 x W 28 x H 100 cm", materialEn: "Metal / fabric" }]
        }
      }
    }
  ],
  quotes: [
    { id: "quote-1", supplier_id: "supplier-1", supplier_name: "Supplier 1", lead_time_days: 35, status: "selected" }
  ],
  suppliers: [{ id: "supplier-1", name: "Supplier 1" }],
  productionUpdates: [],
  inspections: [],
  packingPlans: [],
  shipmentDocuments: [],
  shipments: [],
  handovers: []
};

test("builds six production work packages with a Cho quality gate", () => {
  const result = buildOperationsPlan(context, "production");
  assert.equal(result.production.workPackages.length, 6);
  assert.equal(result.production.qualityGate.stage, "S11");
  assert.equal(result.decisionState, "supplier_approved");
  assert.equal(result.humanGates.some((gate) => gate.stage === "S11" && gate.owner === "Cho"), true);
});

test("never invents shipment facts and exposes missing packing inputs", () => {
  const result = buildOperationsPlan(context, "delivery");
  assert.equal(result.delivery.tracking.referenceNumber, null);
  assert.equal(result.delivery.tracking.carrier, null);
  assert.match(result.delivery.tracking.alert, /No live carrier booking/);
  assert.equal(result.delivery.packing.missingInputs.some((value) => value.includes("packed weight")), true);
});
