import test from "node:test";
import assert from "node:assert/strict";
import { buildIntakeReferenceFiles, enrichRfqContextFromSupabase, mergeProjectIntakeJobs, mergeVerifiedIntakeItems } from "./rfqSourceData.mjs";
import { referenceStorageLocation, resolveRfqReference } from "../../shared/rfqReferences.mjs";
import { buildDeterministicRfq } from "./rfqGenerator.mjs";
import { rfqReviewWarnings } from "../../shared/rfqValidation.mjs";

test("RFQ references use durable customer document paths, including path-only images", async () => {
  const files = buildIntakeReferenceFiles({ items: [
    { id: "I1", item_type_en: "Bench", image_storage_bucket: "intake-files", image_storage_path: "owner/page.png", image_url: "https://db.example/storage/v1/object/sign/intake-files/old.png?token=expired" },
    { id: "I2", image_storage_bucket: "intake-files", image_storage_path: "owner/other.png" }
  ] }, "https://db.example");
  assert.equal(files.length, 2);
  assert.equal(files[0].path, "owner/page.png");
  assert.equal(files[0].url, "");
  assert.equal(files[0].mimeType, "image/png");
  assert.doesNotMatch(files[0].note, /Verified|catalogue/);
  const calls = [];
  const client = { supabaseUrl: "https://db.example", storage: { from: (bucket) => ({
    createSignedUrl: async (path) => { calls.push([bucket, path]); return { data: { signedUrl: "fresh" } }; }
  }) } };
  assert.equal(await resolveRfqReference(files[0], client), "fresh");
  assert.equal(await resolveRfqReference({ url: "https://db.example/storage/v1/object/sign/intake-files/legacy%20page.png?token=expired" }, client), "fresh");
  assert.deepEqual(calls, [["intake-files", "owner/page.png"], ["intake-files", "legacy page.png"]]);
  assert.equal(referenceStorageLocation({ url: "https://other.example/storage/v1/object/sign/bucket/path" }, client.supabaseUrl), null);
  await assert.rejects(resolveRfqReference(files[0], { storage: { from: () => ({
    createSignedUrl: async () => ({ error: new Error("Missing object") })
  }) } }), /Cannot open reference/);
});

test("RFQ keeps the real client, clarified destination and set quantity; unresolved data remains visible", async () => {
  const data = {
    projects: [{ id: "p1", name: "Outdoor", client_name: "Client Company" }],
    intake_jobs: [{ id: "j1", project_id: "p1", result_json: {
      project: { client_name: "Client Company", destination: "To confirm", delivery_address: "Confirmed warehouse", desired_delivery_date: "Nov 15th" },
      open_questions: ["Please confirm crib 5 scope.", "Please confirm unit pricing."],
      items: [{ id: "I1", item_type_en: "Bistro Set", quantity: 10, quantity_text: "10 sets", dimensions_text: "600 x 600 x 710 mm", material_en: "Metal", image_storage_bucket: "intake-files", image_storage_path: "owner/page.png" }]
    } }],
    intake_files: [], project_files: [], specifications: []
  };
  const supabase = { from: (table) => {
    const query = { select: () => query, eq: () => query, in: () => query, order: () => query,
      then: (resolve) => resolve({ data: data[table] }) };
    return query;
  } };
  const context = await enrichRfqContextFromSupabase({ supabase, context: {
    project: { id: "p1", clientName: "Cho (Manager)", destination: "To confirm" }
  } });
  const document = buildDeterministicRfq(context);
  assert.equal(document.project.clientName, "Client Company");
  assert.equal(document.items[0].unit, "sets");
  assert.equal(document.items[0].quantity, 10);
  assert.equal(document.commercialRequirements.find((row) => row.labelEn === "Delivery destination").value, "Confirmed warehouse");
  assert.ok(document.missingInformation.some((row) => row.field === "project.deliveryDate"));
  assert.ok(document.missingInformation.some((row) => row.field === "items.compliance"));
  assert.ok(document.missingInformation.some((row) => /crib 5/.test(row.messageEn)));
  assert.ok(!document.missingInformation.some((row) => /unit pricing/.test(row.messageEn)));
  document.items[0].finishColor = "Natural oak";
  assert.ok(!rfqReviewWarnings(document).some((row) => row.field === "items.finishColor"));
});

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
