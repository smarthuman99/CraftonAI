import test from "node:test";
import assert from "node:assert/strict";
import { mergeProjectIntakeJobs, mergeVerifiedIntakeItems } from "./rfqSourceData.mjs";

test("project intake aggregation keeps every linked Set Furniture order", () => {
  const jobs = [
    {
      id: "job-mercer",
      result_json: {
        source_mode: "set_furniture",
        project: { name: "Solar Project" },
        items: [{ id: "SF-103", item_type_en: "Mercer Three-Seat Sofa", quantity: 20, image_url: "mercer.webp" }]
      }
    },
    {
      id: "job-como",
      result_json: {
        source_mode: "set_furniture",
        project: { name: "Solar Project" },
        items: [{ id: "SF-102", item_type_en: "Como Curved Sofa", quantity: 10, image_url: "como.webp" }]
      }
    },
    {
      id: "job-arden",
      result_json: {
        source_mode: "set_furniture",
        project: { name: "Solar Project" },
        items: [{ id: "SF-101", item_type_en: "Arden Modular Sofa", quantity: 10, image_url: "arden.webp" }]
      }
    }
  ];

  const merged = mergeProjectIntakeJobs(jobs);

  assert.equal(merged.order_count, 3);
  assert.equal(merged.items.length, 3);
  assert.equal(merged.items.reduce((total, item) => total + item.quantity, 0), 40);
  assert.deepEqual(merged.intake_job_ids, ["job-mercer", "job-como", "job-arden"]);
  assert.equal(merged.items.filter((item) => item.image_url).length, 3);
});

test("verified intake data matches BOM rows by furniture name when row order differs", () => {
  const contextItems = [
    { typeEn: "Arden Modular Sofa", quantity: 10 },
    { typeEn: "Mercer Three-Seat Sofa", quantity: 20 }
  ];
  const verifiedItems = [
    { id: "SF-103", item_type_en: "Mercer Three-Seat Sofa", quantity: 20, image_url: "mercer.webp" },
    { id: "SF-101", item_type_en: "Arden Modular Sofa", quantity: 10, image_url: "arden.webp" }
  ];

  const merged = mergeVerifiedIntakeItems(contextItems, verifiedItems);

  assert.equal(merged[0].id, "SF-101");
  assert.equal(merged[0].imageUrl, "arden.webp");
  assert.equal(merged[1].id, "SF-103");
  assert.equal(merged[1].imageUrl, "mercer.webp");
});
