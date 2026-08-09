import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import { buildRfqWorkbook, parseSupplierRfqWorkbook } from "../../src/components/rfqExcel.js";
import { matchSupplierReturn, mergeImportedQuoteLines, quoteLinesForBatch } from "../../src/components/quoteIntake.js";

const project = {
  id: "project-terra",
  orderId: "Terra project",
  clientName: "The Crafton Ltd"
};

const batch = {
  id: "rfq-terra",
  rfq_code: "RFQ-20260808-TERRA",
  currency: "USD",
  payload: { version: 2 }
};

const document = {
  titleEn: "Terra project Supplier Request for Quotation",
  titleCn: "Terra project 供应商询价单",
  introductionEn: "Please complete every supplier response field.",
  introductionCn: "请填写所有供应商报价字段。",
  items: [
    {
      itemNo: "SF-101",
      nameEn: "Arden Modular Sofa",
      nameCn: "Arden 模块沙发",
      quantity: 10,
      unit: "pcs",
      dimensions: "W 2800 x D 980 x H 730 mm",
      tolerance: "To confirm",
      materialEn: "Performance boucle / kiln-dried hardwood",
      materialCn: "高性能圈绒 / 窑干硬木",
      finishColor: "Made to project finish schedule",
      hardware: "-",
      compliance: "UK BS 5852 Source 5 available",
      supplierNotes: "Confirm every deviation."
    },
    {
      itemNo: "SF-103",
      nameEn: "Mercer Three-Seat Sofa",
      nameCn: "Mercer 三人沙发",
      quantity: 20,
      unit: "pcs",
      dimensions: "W 2240 x D 920 x H 790 mm",
      tolerance: "To confirm",
      materialEn: "Full-grain leather / walnut plinth",
      materialCn: "全粒面皮革 / 胡桃木底座",
      finishColor: "Made to project finish schedule",
      hardware: "-",
      compliance: "US 16 CFR Part 1640 available",
      supplierNotes: "Confirm every deviation."
    }
  ],
  commercialRequirements: [
    { labelEn: "Delivery destination", labelCn: "交货目的地", value: "London" },
    { labelEn: "Payment terms", labelCn: "付款条款", value: "Supplier to propose" }
  ]
};

const form = {
  dueAt: "2026-08-20T18:00",
  currency: "USD"
};

test("RFQ workbook keeps identity metadata and imports supplier prices", async () => {
  const exported = await buildRfqWorkbook({ project, batch, document, form, references: [] });
  assert.match(exported.fileName, /supplier-RFQ\.xlsx$/);
  assert.equal(Buffer.from(exported.buffer).subarray(0, 2).toString(), "PK");

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(exported.buffer);
  const sheet = workbook.getWorksheet("RFQ");
  sheet.getCell("B6").value = "Hansen Furniture Co.";
  sheet.getCell("H6").value = "HANSEN-TERRA-01";
  sheet.getCell("M7").value = 10;
  sheet.getCell("H8").value = 35;
  sheet.getCell("M8").value = "30% deposit, 70% before shipment";
  sheet.getCell("B9").value = "Confirmed";
  sheet.getCell("I15").value = 2480;
  sheet.getCell("J15").value = { formula: "C15*I15", result: 24800 };
  sheet.getCell("I16").value = 3250;
  sheet.getCell("J16").value = { formula: "C16*I16", result: 65000 };
  const returnedBuffer = await workbook.xlsx.writeBuffer();
  const returnedFile = {
    name: "Hansen-Terra-return.xlsx",
    arrayBuffer: async () => returnedBuffer
  };

  const parsed = await parseSupplierRfqWorkbook(returnedFile);
  assert.equal(parsed.metadata.project_id, project.id);
  assert.equal(parsed.metadata.rfq_batch_id, batch.id);
  assert.equal(parsed.supplierCompany, "Hansen Furniture Co.");
  assert.equal(parsed.quoteCode, "HANSEN-TERRA-01");
  assert.equal(parsed.quotedItemCount, 2);
  assert.equal(parsed.items[0].unitPrice, 2480);
  assert.equal(parsed.items[1].lineTotal, 65000);
  assert.equal(parsed.totalAmount, 89800);
  assert.equal(parsed.leadTimeDays, 35);
});

test("RFQ importer reads a generic supplier quotation table", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Supplier Quote");
  sheet.addRows([
    ["Supplier", "Hansen Furniture Co."],
    ["Quotation No.", "HANSEN-02"],
    ["Currency", "USD"],
    [],
    ["Product code", "Description", "Quantity", "Unit price", "Amount"],
    ["SF-101", "Arden Modular Sofa", 10, 2480, 24800],
    ["SF-103", "Mercer Three-Seat Sofa", 20, 3250, 65000]
  ]);
  const buffer = await workbook.xlsx.writeBuffer();
  const parsed = await parseSupplierRfqWorkbook({
    name: "hansen-quotation.xlsx",
    arrayBuffer: async () => buffer
  });

  assert.equal(parsed.genericFormat, true);
  assert.equal(parsed.supplierCompany, "Hansen Furniture Co.");
  assert.equal(parsed.quoteCode, "HANSEN-02");
  assert.equal(parsed.items.length, 2);
  assert.equal(parsed.items[0].itemName, "Arden Modular Sofa");
  assert.equal(parsed.items[1].unitPrice, 3250);
  assert.equal(parsed.totalAmount, 89800);
});

test("RFQ importer rejects spreadsheets without a recognizable price table", async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet("RFQ").getCell("A1").value = "Unrelated notes";
  const buffer = await workbook.xlsx.writeBuffer();
  await assert.rejects(
    () =>
      parseSupplierRfqWorkbook({
        name: "unrelated.xlsx",
        arrayBuffer: async () => buffer
      }),
    /recognizable item and unit-price table/
  );
});

test("returned RFQ items map to the approved batch BOM instead of ITEM placeholders", () => {
  const batchWithDocument = { ...batch, supplier_ids: ["supplier-hansen"], payload: { document } };
  const lines = quoteLinesForBatch(batchWithDocument, { items: [{ nameEn: "Wrong fallback item", qty: 1 }] });
  const merged = mergeImportedQuoteLines(lines, [
    { itemNo: "SF-101", itemName: "Arden Modular Sofa", unitPrice: 2480 },
    { itemNo: "SF-103", itemName: "Mercer Three-Seat Sofa", unitPrice: 3250 }
  ]);
  const supplierMatch = matchSupplierReturn({
    imported: { supplierCompany: "Hansen Furniture Co." },
    suppliers: [
      { id: "supplier-hansen", name: "震森家具制造有限公司 (Hansen Furniture Co.)" },
      { id: "supplier-other", name: "Elite Leather Tech" }
    ],
    batch: batchWithDocument,
    fileName: "hansen-return.xlsx"
  });

  assert.deepEqual(
    lines.map((line) => line.item_no),
    ["SF-101", "SF-103"]
  );
  assert.equal(merged.matchedCount, 2);
  assert.equal(merged.lines[0].unit_price, "2480");
  assert.equal(supplierMatch.supplier.id, "supplier-hansen");
});
