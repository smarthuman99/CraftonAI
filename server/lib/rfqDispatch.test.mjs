import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGeneratedRfqAttachments,
  buildRfqResponseCsv,
  getRfqDispatchStatus,
  renderSupplierRfqAttachment
} from "./rfqDispatch.mjs";

const document = {
  titleCn: "家具询价单",
  titleEn: "Furniture RFQ",
  introductionEn: "Please quote the following items.",
  items: [
    {
      itemNo: "SF-101",
      nameCn: "模块沙发",
      nameEn: "Modular Sofa",
      quantity: 10,
      unit: "pcs",
      dimensions: "W 2800 x D 980 x H 730 mm",
      tolerance: "+/- 5 mm",
      materialCn: "高性能圈绒",
      materialEn: "Performance boucle",
      finishColor: "Project finish schedule",
      hardware: "Concealed connectors",
      compliance: "UK BS 5852"
    }
  ],
  supplierResponseFields: [
    { key: "unitPrice", labelCn: "单价", labelEn: "Unit price" },
    { key: "leadTime", labelCn: "交期", labelEn: "Lead time" }
  ]
};

test("supplier response CSV keeps every BOM item and blank quote columns", () => {
  const csv = buildRfqResponseCsv({ rfqCode: "RFQ-TEST", document });
  assert.match(csv, /RFQ-TEST/);
  assert.match(csv, /SF-101/);
  assert.match(csv, /Modular Sofa \/ 模块沙发/);
  assert.match(csv, /Supplier unit price \/ 供应商单价/);
});

test("generated RFQ attachments include a response CSV and printable inquiry", () => {
  const attachments = buildGeneratedRfqAttachments({ rfqCode: "RFQ-TEST", document });
  assert.deepEqual(
    attachments.map((attachment) => attachment.filename),
    ["RFQ-TEST-supplier-response.csv", "RFQ-TEST-inquiry.html"]
  );
  assert.match(Buffer.from(attachments[0].content, "base64").toString("utf8"), /模块沙发/);
  assert.match(Buffer.from(attachments[1].content, "base64").toString("utf8"), /Unit price/);
});

test("printable supplier attachment includes response columns", () => {
  const html = renderSupplierRfqAttachment({ rfqCode: "RFQ-TEST", document });
  assert.match(html, /Furniture RFQ/);
  assert.match(html, /Lead time/);
  assert.match(html, /UK BS 5852/);
});

test("dispatch status does not expose secrets", () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.RFQ_FROM_EMAIL;
  process.env.RESEND_API_KEY = "secret-test-key";
  process.env.RFQ_FROM_EMAIL = "Crafton <rfq@example.com>";
  const status = getRfqDispatchStatus();
  assert.equal(status.configured, true);
  assert.equal(JSON.stringify(status).includes("secret-test-key"), false);
  if (previousKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = previousKey;
  if (previousFrom === undefined) delete process.env.RFQ_FROM_EMAIL;
  else process.env.RFQ_FROM_EMAIL = previousFrom;
});
