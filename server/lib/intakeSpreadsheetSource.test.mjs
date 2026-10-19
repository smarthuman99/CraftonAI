import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import sharp from "sharp";
import { extractIntakeSource } from "./intakeSourceReader.mjs";
import { buildSpreadsheetManifest, spreadsheetColumnRole } from "./intakeSpreadsheetSource.mjs";
import {
  reconcileSpreadsheetRows,
  evaluateSpreadsheetCompleteness,
  applySpreadsheetCompleteness
} from "./intakeSpreadsheetCompleteness.mjs";
import { attachSpreadsheetImages } from "./intakeNativeImages.mjs";
import { createReviewSource } from "./intakeReviewSource.mjs";
import { evaluateEvidenceGate, mergeRiskReviewReplies } from "./intakeRiskReview.mjs";
import { prepareInitialClientCompletion } from "./intakeClientCompletion.mjs";

async function fixture({ broken = false } = {}) {
  const image = await sharp({ create: { width: 160, height: 120, channels: 3, background: "#96533b" } })
    .png()
    .toBuffer();
  const workbook = new ExcelJS.Workbook(),
    sheet = workbook.addWorksheet("Room");
  sheet.addRow(["Project", "Example"]);
  sheet.addRow(["CODE", "PHOTO", "ITEM", "DESCRIPTION", "MATERIALS", "QUANTITY", "NOTE", "Custom requirement"]);
  sheet.addRow([
    "A-01",
    { error: "#VALUE!" },
    "Chair",
    "Width 500mm Depth 600mm Height 800mm",
    "Oak",
    2,
    "Keep note",
    "Extra original data"
  ]);
  sheet.addRow(["A-02", { error: "#VALUE!" }, "Chair", "Width 500mm Depth 600mm Height 800mm", "Oak", 3]);
  sheet.addRow(["A-03", "", "Table", "Height 700mm", "Steel", 4]);
  sheet.addRow(["", "", "", "", "TOTAL", 9]);
  const id = workbook.addImage({ buffer: image, extension: "png" });
  sheet.addImage(id, { tl: { col: 1, row: 4 }, br: { col: 2, row: 5 } });
  sheet.addImage(id, { tl: { col: 1, row: 4 }, br: { col: 2, row: 5 } });
  const zip = await JSZip.loadAsync(await workbook.xlsx.writeBuffer());
  zip.file(
    "xl/worksheets/sheet1.xml",
    (await zip.file("xl/worksheets/sheet1.xml").async("string"))
      .replace(/r="B3"/g, 'r="B3" vm="1"')
      .replace(/r="B4"/g, 'r="B4" vm="2"')
  );
  zip.file(
    "xl/metadata.xml",
    `<metadata xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:rd="http://schemas.microsoft.com/office/spreadsheetml/2017/richdata"><metadataTypes><metadataType name="OTHER"/><metadataType name="XLRICHVALUE"/></metadataTypes><futureMetadata name="OTHER"><bk/></futureMetadata><futureMetadata name="XLRICHVALUE"><bk><extLst><ext><rd:rvb i="0"/></ext></extLst></bk></futureMetadata><valueMetadata><bk><rc t="2" v="0"/></bk><bk><rc t="2" v="0"/></bk></valueMetadata></metadata>`
  );
  zip.file("xl/richData/rdrichvalue.xml", '<rvData><rv s="0"><v>99</v><v>0</v></rv></rvData>');
  zip.file(
    "xl/richData/rdrichvaluestructure.xml",
    '<rvStructures><s t="_localImage"><k n="CalcOrigin"/><k n="_rvRel:LocalImageIdentifier"/></s></rvStructures>'
  );
  zip.file(
    "xl/richData/richValueRel.xml",
    '<richValueRels xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><rel r:id="photo"/></richValueRels>'
  );
  zip.file(
    "xl/richData/_rels/richValueRel.xml.rels",
    `<Relationships><Relationship Id="photo" Target="../media/${broken ? "missing.png" : "rich.png"}"/></Relationships>`
  );
  zip.file("xl/media/rich.png", image);
  return zip.generateAsync({ type: "nodebuffer" });
}

const load = async (options) =>
  extractIntakeSource({ file: { original_name: "source.xlsx" }, buffer: await fixture(options) });
const backend = () => {
  const stored = new Map();
  return {
    from() {
      return {
        async upload(key, bytes) {
          if (stored.has(key)) return { error: { statusCode: "409" } };
          stored.set(key, bytes);
          return {};
        },
        async download(key) {
          return { data: new Blob([stored.get(key)]) };
        }
      };
    }
  };
};
async function complete(source) {
  const manifest = source.sourceMetadata.spreadsheetManifest;
  const result = reconcileSpreadsheetRows({ items: [], questions: [] }, manifest);
  return attachSpreadsheetImages({
    result,
    manifest,
    images: source.extractedImages,
    storage: backend(),
    job: { id: "job" },
    userId: "owner"
  });
}

test("mixed Excel images follow metadata type and structure indices; duplicate anchors are removed without removing reused photos", async () => {
  const source = await load(),
    manifest = source.sourceMetadata.spreadsheetManifest;
  assert.equal(source.extractedImages.length, 3);
  assert.equal(source.extractedImages.filter((i) => i.nativeKind === "in_cell").length, 2);
  assert.equal(manifest.rows.length, 3);
  assert.ok(manifest.rows.every((r) => r.image_refs.length === 1));
  assert.deepEqual(manifest.issues, []);
  assert.equal(source.sourceMetadata.duplicateImageAnchorsRemoved, 1);
  assert.match(source.sourceText, /\[embedded photo\]/);
  assert.equal(manifest.rows[0].cells.find((c) => c.ref === "B3").value, "#VALUE!");
  assert.equal(spreadsheetColumnRole("UPHOLSTERY / FINISH"), "material");
  assert.deepEqual(
    manifest.rows.map((r) => r.quantity),
    [2, 3, 4]
  );
  const result = await complete(source);
  assert.equal(evaluateSpreadsheetCompleteness(result, manifest).status, "passed");
  const gate = evaluateEvidenceGate({ result, context: { ...(await createReviewSource({ source })).context } });
  assert.ok(!gate.risks.some((r) => ["duplicate_product", "shared_image_mapping"].includes(r.code)));
});

test("unsupported or broken cell relationships stay visible and block completion", async () => {
  const source = await load({ broken: true }),
    manifest = source.sourceMetadata.spreadsheetManifest;
  assert.equal(manifest.issues.filter((i) => i.code === "cell_image_unreadable").length, 2);
  const result = applySpreadsheetCompleteness(await complete(source), manifest);
  assert.equal(result.completeness_review.status, "internal_review_required");
  assert.equal(prepareInitialClientCompletion({ result }).readyForApproval, false);
});

test("an entirely omitted item is recovered from cells, preserving all raw columns and partial dimensions", async () => {
  const source = await load(),
    manifest = source.sourceMetadata.spreadsheetManifest;
  const result = reconcileSpreadsheetRows(
    {
      items: [
        { item_ref: "A-01", item_type_en: "Chair", quantity: 200, dimensions_text: "wrong", notes_en: "Model note" }
      ]
    },
    manifest
  );
  assert.equal(result.items.length, 3);
  assert.equal(result.source_reconciliation.recovered_rows.length, 2);
  assert.equal(result.items[0].quantity, 2);
  assert.match(result.items[0].notes_en, /Extra original data/);
  assert.match(result.items[0].notes_en, /Model note/);
  assert.equal(result.items[2].dimensions_text, "Height 700mm");
  assert.equal(result.items[2].unit_price, 0);
});

test("same-name rows cannot be joined by output order or guessed image IDs", async () => {
  const source = await load(),
    manifest = source.sourceMetadata.spreadsheetManifest;
  const result = reconcileSpreadsheetRows(
    { items: [{ item_type_en: "Chair", image_ref: 99, source_page: 99 }] },
    manifest
  );
  assert.ok(result.source_reconciliation.issues.some((i) => i.code === "ambiguous_product_row"));
  assert.equal(result.items[0].source_row_id, undefined);
  assert.equal(evaluateSpreadsheetCompleteness(result, manifest).status, "internal_review_required");
});

test("bidirectional checks detect missing rows, duplicate outputs, dropped fields, wrong totals and missing secondary photos", async () => {
  const source = await load(),
    manifest = source.sourceMetadata.spreadsheetManifest;
  const original = await complete(source);
  for (const [mutate, expected] of [
    [(r) => r.items.pop(), "missing_source_row"],
    [(r) => r.items.push(structuredClone(r.items[0])), "duplicate_output_row"],
    [(r) => r.items[0].source_fields.pop(), "source_field_not_retained"],
    [(r) => (r.items[0].quantity = 88), "source_value_mismatch"],
    [(r) => (r.items[0].image_storage_paths = []), "source_photo_not_verified"]
  ]) {
    const result = structuredClone(original);
    mutate(result);
    assert.ok(
      evaluateSpreadsheetCompleteness(result, manifest).issues.some((i) => i.code === expected),
      expected
    );
  }
  const conflicting = structuredClone(manifest);
  conflicting.totals[0].stated_quantity = 10;
  assert.ok(
    evaluateSpreadsheetCompleteness(original, conflicting).issues.some(
      (i) => i.code === "source_quantity_total_conflict"
    )
  );
});

test("slight image overhang is mapped by coverage; equal cross-row coverage remains unresolved", () => {
  const rows = [1, 2, 3].map((row) => ({
    row,
    cells:
      row === 1
        ? [
            { column: 1, ref: "A1", value: "Item" },
            { column: 2, ref: "B1", value: "Quantity" }
          ]
        : [
            { column: 1, ref: `A${row}`, value: `Chair ${row}` },
            { column: 2, ref: `B${row}`, value: "1" }
          ]
  }));
  const inputs = {
    sheets: [{ name: "Room", rows }],
    fileHash: "abc",
    images: [
      {
        page: 1,
        worksheet: "Room",
        sourceRow: 2,
        sourceEndRow: 3,
        rowCoverage: [
          { row: 2, points: 95 },
          { row: 3, points: 5 }
        ]
      }
    ]
  };
  assert.deepEqual(
    buildSpreadsheetManifest(inputs).rows.map((r) => r.image_refs.length),
    [1, 0]
  );
  inputs.images[0].rowCoverage = [
    { row: 2, points: 50 },
    { row: 3, points: 50 }
  ];
  assert.ok(buildSpreadsheetManifest(inputs).issues.some((i) => i.code === "image_spans_product_rows"));
});

test("total-like furniture names are retained and vertically merged product rows cannot pass automatically", async () => {
  const workbook = new ExcelJS.Workbook(),
    sheet = workbook.addWorksheet("Furniture");
  sheet.addRow(["Item", "Quantity", "Material"]);
  sheet.addRow(["Total Comfort Chair", 2, "Oak"]);
  sheet.addRow(["Another Chair", 3, "Oak"]);
  sheet.mergeCells("C2:C3");
  const source = await extractIntakeSource({
    file: { original_name: "merged.xlsx" },
    buffer: await workbook.xlsx.writeBuffer()
  });
  const manifest = source.sourceMetadata.spreadsheetManifest;
  assert.equal(manifest.rows.length, 2);
  assert.equal(manifest.rows[0].name, "Total Comfort Chair");
  assert.ok(manifest.issues.some((issue) => issue.code === "merged_product_rows"));
  const result = reconcileSpreadsheetRows({ items: [] }, manifest);
  assert.equal(result.items.length, 0);
  assert.equal(evaluateSpreadsheetCompleteness(result, manifest).status, "internal_review_required");
});

test("native review never converts Excel to PDF or lets a model crop replace verified originals", async () => {
  const source = await load(),
    result = await complete(source);
  const reader = await createReviewSource({
    source: { ...source, sourceBuffer: Buffer.from("not a PDF") },
    reader: {
      renderPages() {
        throw Error("must not render");
      }
    }
  });
  const batch = await reader.readReviewUnits([1], { itemIndices: [0], result });
  assert.equal(batch.sourceMedia.sourceKind, "spreadsheet_images");
  assert.equal(batch.sourceMedia.pages.length, 1);
  assert.match(batch.sourceMedia.pages[0].sourceLabel, /row 3, code A-01/);
  const merged = mergeRiskReviewReplies(result, {
    context: reader.context,
    plan: { item_indices: [0], source_units: [1], risk_codes: [] },
    failures: [],
    replies: [
      {
        ids: [1],
        source: batch,
        reply: {
          issues: [],
          items: [
            {
              item_ref: "REVIEW-ITEM-1",
              fields: [],
              quantity_rows: [],
              issues: [],
              photos: [
                {
                  source_page: 1,
                  bbox: { x_min: 1, y_min: 1, x_max: 999, y_max: 999 },
                  kind: "isolated_product",
                  confidence: 1
                }
              ]
            }
          ]
        }
      }
    ]
  });
  assert.equal(merged.items[0].image_storage_path, result.items[0].image_storage_path);
  assert.equal(merged.items[0].image_review_verified, true);
  await reader.destroy();
});
