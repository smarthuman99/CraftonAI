import assert from "node:assert/strict";
import test from "node:test";
import { buildDeterministicRfq } from "./rfqGenerator.mjs";
import { renderRfqEmail } from "./rfqDispatch.mjs";
import { mergeVerifiedIntakeItems } from "./rfqSourceData.mjs";

test("RFQ generation preserves verified production data and source files", () => {
  const document = buildDeterministicRfq({
    project: { projectName: "Harbour Restaurant", destination: "Zhongshan", currency: "USD" },
    items: [
      {
        typeCn: "餐椅",
        typeEn: "Dining Chair",
        qty: 15,
        length: 500,
        width: 550,
        height: 900,
        unit: "mm",
        tolerance: "+/-5mm",
        materialEn: "Solid wood and fabric"
      }
    ],
    files: [
      {
        id: "source-file-1",
        original_name: "chair-reference.jpg",
        mime_type: "image/jpeg",
        storage_bucket: "intake-files",
        storage_path: "client/chair-reference.jpg"
      }
    ]
  });

  assert.equal(document.items[0].quantity, 15);
  assert.equal(document.items[0].dimensions, "L 500 x W 550 x H 900 mm");
  assert.equal(document.attachments[0].name, "chair-reference.jpg");
  assert.equal(document.attachments[0].id, "source-file-1");
  assert.equal(document.attachments[0].bucket, "intake-files");
  assert.equal(document.attachments[0].path, "client/chair-reference.jpg");
  assert.equal(document.missingInformation.length, 0);
});

test("RFQ generation flags absent drawings and dimensions instead of inventing them", () => {
  const document = buildDeterministicRfq({
    project: { projectName: "Incomplete project" },
    items: [{ typeEn: "Lounge Chair", qty: 4 }]
  });

  assert.equal(document.items[0].dimensions, "待确认 / To confirm");
  assert.ok(document.missingInformation.some((warning) => warning.field === "attachments"));
  assert.ok(document.missingInformation.some((warning) => warning.field.endsWith("dimensions")));
});

test("supplier email escapes untrusted project text", () => {
  const document = buildDeterministicRfq({
    project: { projectName: "<script>alert(1)</script>" },
    items: [{ typeEn: "Chair", qty: 1, dimensions: "500 mm", materialEn: "Oak" }],
    files: [{ name: "reference.jpg" }]
  });
  const html = renderRfqEmail({ rfqCode: "RFQ-1", document, supplier: { name: "Factory <One>" } });

  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /Factory &lt;One&gt;/);
});

test("Supabase intake dimensions and production fields override incomplete UI items", () => {
  const items = mergeVerifiedIntakeItems(
    [{ itemNo: "DRAFT-1", typeEn: "Stool", quantity: 15 }],
    [
      {
        item_type_cn: "凳子",
        item_type_en: "Stool",
        quantity: 15,
        dimensions: { length: "28", width: "28", height: "100", unit: "cm" },
        tolerance: "±5mm",
        material_cn: "金属加海绵",
        material_en: "Metal and foam",
        fire_standard: "UK Crib 5 required"
      }
    ]
  );

  assert.equal(items[0].dimensions, "L 28 x W 28 x H 100 cm");
  assert.equal(items[0].tolerance, "±5mm");
  assert.equal(items[0].materialEn, "Metal and foam");
  assert.equal(items[0].compliance, "UK Crib 5 required");
});
