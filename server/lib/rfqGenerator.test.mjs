import assert from "node:assert/strict";
import test from "node:test";
import { buildDeterministicRfq } from "./rfqGenerator.mjs";
import { renderRfqEmail } from "./rfqDispatch.mjs";

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
    files: [{ original_name: "chair-reference.jpg", mime_type: "image/jpeg" }]
  });

  assert.equal(document.items[0].quantity, 15);
  assert.equal(document.items[0].dimensions, "L 500 x W 550 x H 900 mm");
  assert.equal(document.attachments[0].name, "chair-reference.jpg");
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
