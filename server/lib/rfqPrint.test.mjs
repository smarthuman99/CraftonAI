import assert from "node:assert/strict";
import test from "node:test";

import { buildPrintableRfqHtml } from "../../src/components/rfqPrint.js";

const fixture = {
  document: {
    titleCn: "酒店大堂家具询价",
    titleEn: "Hotel Lobby Furniture RFQ",
    introductionCn: "请按规格报价。",
    introductionEn: "Please quote to specification.",
    items: [
      {
        itemNo: "CHAIR-01",
        nameCn: "大堂扶手椅",
        nameEn: "Lobby armchair",
        quantity: 40,
        unit: "pcs",
        dimensions: "760 x 820 x 880 mm",
        tolerance: "+/- 5 mm",
        materialCn: "海军蓝亚麻",
        materialEn: "Navy linen",
        finishColor: "Matte black",
        hardware: "Steel legs",
        compliance: "UK Crib 5",
        supplierNotes: "Provide certificate"
      }
    ],
    commercialRequirements: [{ labelCn: "付款条件", labelEn: "Payment terms", value: "30 / 70" }],
    supplierResponseFields: [{ key: "lead", labelCn: "交期", labelEn: "Lead time" }],
    attachments: [{ id: "drawing", name: "chair-drawing.pdf", type: "application/pdf", note: "Dimensioned drawing" }],
    missingInformation: []
  },
  form: { dueAt: "2026-08-16T17:00:00.000Z", currency: "USD" },
  batch: { rfq_code: "RFQ-20260809-ABC123", created_at: "2026-08-09T08:00:00.000Z" },
  project: {
    id: "project-1",
    orderId: "CRAFT-2026-051",
    clientCompany: "Example Hospitality Ltd",
    projectLocation: "London, UK",
    desiredDeliveryDate: "2026-11-30"
  },
  attachmentUrls: { drawing: "https://example.com/chair-drawing.pdf" },
  lang: "En",
  autoPrint: false
};

test("buildPrintableRfqHtml creates a complete supplier RFQ", () => {
  const html = buildPrintableRfqHtml(fixture);

  assert.match(html, /RFQ-20260809-ABC123/);
  assert.match(html, /Example Hospitality Ltd/);
  assert.match(html, /Lobby armchair/);
  assert.match(html, /Supplier quotation/);
  assert.match(html, /Commercial requirements/);
  assert.match(html, /chair-drawing\.pdf/);
  assert.match(html, /window\.print\(\)/);
  assert.doesNotMatch(html, /addEventListener\("load"/);
});

test("buildPrintableRfqHtml escapes RFQ data and rejects unsafe attachment links", () => {
  const html = buildPrintableRfqHtml({
    ...fixture,
    document: {
      ...fixture.document,
      titleEn: '<script>alert("rfq")</script>',
      attachments: [{ id: "unsafe", name: "unsafe", url: "javascript:alert(1)" }]
    },
    attachmentUrls: {}
  });

  assert.doesNotMatch(html, /<script>alert\("rfq"\)<\/script>/);
  assert.match(html, /&lt;script&gt;alert\(&quot;rfq&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /href="javascript:/);
});
