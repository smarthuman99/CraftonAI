import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import ExcelJS from "exceljs";

import {
  countPdfReadableCharacters,
  extractIntakeSource,
  getIntakeSourceKind,
  selectPdfProductImages,
  selectPdfVisualFallbackPages,
  selectPrimaryPdfImage
} from "./intakeSourceReader.mjs";

test("detects the supported FF&E source formats", () => {
  assert.equal(getIntakeSourceKind({ original_name: "schedule.xlsx" }), "spreadsheet");
  assert.equal(getIntakeSourceKind({ original_name: "brief.pdf" }), "pdf");
  assert.equal(getIntakeSourceKind({ original_name: "spec.docx" }), "docx");
  assert.equal(getIntakeSourceKind({ original_name: "legacy-spec.doc" }), "legacy_doc");
  assert.equal(getIntakeSourceKind({ original_name: "reference.webp" }), "image");
  assert.equal(getIntakeSourceKind({ original_name: "legacy.xls" }), "legacy_spreadsheet");
});

test("extracts embedded XLSX product images and preserves their anchor rows", async () => {
  const productImage = await readFile(new URL("../../src/media/image1.png", import.meta.url));
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Furniture Schedule");
  sheet.addRow(["Project", "Harbour Hotel"]);
  sheet.addRow(["Item", "Quantity", "Dimensions", "Material"]);
  sheet.addRow(["Lobby Sofa", 10, "W 2000 x D 900 x H 780 mm", "Blue wool"]);
  sheet.addRow(["Lounge Chair", 20, "W 760 x D 810 x H 780 mm", "Oak and linen"]);
  const imageId = workbook.addImage({ buffer: productImage, extension: "png" });
  sheet.addImage(imageId, { tl: { col: 4, row: 2 }, ext: { width: 320, height: 240 } });
  sheet.addImage(imageId, { tl: { col: 4, row: 3 }, ext: { width: 320, height: 240 } });

  const buffer = await workbook.xlsx.writeBuffer();
  const result = await extractIntakeSource({
    file: {
      original_name: "harbour-ffe.xlsx",
      mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    },
    buffer
  });

  assert.equal(result.mediaIssue, "");
  assert.equal(result.extractedImages.length, 2);
  assert.deepEqual(
    result.extractedImages.map((image) => image.page),
    [1, 2]
  );
  assert.deepEqual(
    result.extractedImages.map((image) => image.sourceRow),
    [3, 4]
  );
  assert.ok(result.extractedImages.every((image) => image.mimeType === "image/png" && image.data.length > 1000));
  assert.match(result.sourceText, /ROW 3: Lobby Sofa \| 10 \| W 2000 x D 900 x H 780 mm \| Blue wool/);
  assert.match(result.sourceText, /EMBEDDED IMAGE 1: sheet=Furniture Schedule \| anchor row=3/);
  assert.match(result.sourceText, /EMBEDDED IMAGE 2: sheet=Furniture Schedule \| anchor row=4/);
});

test("extracts project and furniture rows from an XLSX FF&E schedule", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("FF&E Schedule");
  sheet.addRow(["Project", "Luna Hotel"]);
  sheet.addRow(["Delivery address", "London, UK"]);
  sheet.addRow(["Item", "Quantity", "Dimensions", "Material"]);
  sheet.addRow(["Lobby armchair", 40, "W 760 x D 810 x H 780 mm", "Blue wool blend"]);
  sheet.addRow(["Dining table", 10, "2400 x 1000 x 750 mm", "Oak veneer"]);

  const buffer = await workbook.xlsx.writeBuffer();
  const result = await extractIntakeSource({
    file: {
      original_name: "luna-ffe.xlsx",
      mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    },
    buffer
  });

  assert.equal(result.sourceKind, "spreadsheet");
  assert.equal(result.mediaIssue, "");
  assert.match(result.sourceText, /WORKSHEET: FF&E Schedule/);
  assert.match(result.sourceText, /Luna Hotel/);
  assert.match(result.sourceText, /Lobby armchair \| 40 \| W 760 x D 810 x H 780 mm \| Blue wool blend/);
  assert.match(result.sourceText, /Dining table \| 10/);
});

test("keeps uploaded image bytes available for visual analysis", async () => {
  const result = await extractIntakeSource({
    file: { original_name: "chair.png", mime_type: "image/png" },
    buffer: Buffer.from("fixture-image")
  });

  assert.equal(result.sourceKind, "image");
  assert.equal(result.sourceMedia.mimeType, "image/png");
  assert.equal(result.sourceMedia.dataBase64, Buffer.from("fixture-image").toString("base64"));
});

test("prefers the largest transparent product cutout from a PDF page", () => {
  const referencePhoto = { name: "photo", width: 1200, height: 900, kind: 2, data: Buffer.from("photo") };
  const smallCutout = { name: "small", width: 400, height: 400, kind: 3, data: Buffer.from("small") };
  const productCutout = { name: "product", width: 900, height: 800, kind: 3, data: Buffer.from("product") };

  assert.equal(selectPrimaryPdfImage([referencePhoto, smallCutout, productCutout]).name, "product");
  assert.deepEqual(
    selectPdfProductImages([referencePhoto, smallCutout, productCutout], 3).map((image) => image.name),
    ["product", "small", "photo"]
  );
});

test("selects PDF pages with too little machine-readable text for visual fallback", () => {
  const textByPage = new Map([
    [1, ""],
    [2, "Item Quantity Dimensions Material Finish Location"],
    [3, "Sofa 4 W 2000 x D 900 x H 750 mm hand-woven rattan terrace"]
  ]);

  assert.equal(countPdfReadableCharacters("SOURCE PAGE 1"), 0);
  assert.deepEqual(selectPdfVisualFallbackPages({ pages: [1, 2, 3], textByPage, minTextCharsPerPage: 35 }), [1]);
});
