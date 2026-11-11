import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { extractIntakeSource } from "./intakeSourceReader.mjs";
import {
  reconcileSpreadsheetRows,
  applySpreadsheetCompleteness,
  reviewSpreadsheetRow
} from "./intakeSpreadsheetCompleteness.mjs";
import { technicalDrawingPendingItems, technicalDrawingEligible } from "./technicalDrawing.mjs";

async function manifestFrom(buffer) {
  const extracted = await extractIntakeSource({ file: { original_name: "schedule.xlsx" }, buffer });
  return extracted.sourceMetadata.spreadsheetManifest;
}
function collect(manifest, items) {
  const draft = reconcileSpreadsheetRows({ items }, manifest);
  return applySpreadsheetCompleteness(draft, manifest);
}
const candidates = (manifest) =>
  manifest.rows.map((row) => ({
    source_row_id: row.id,
    item_ref: row.code,
    item_type_en: row.name,
    quantity: row.quantity,
    image_storage_path: "test/reference.jpg"
  }));
const queue = (result) => technicalDrawingPendingItems({ result_json: result }).map(({ item }) => item.source_row_id);
async function sample() {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Schedule");
  for (const cells of [
    ["Item", "Item", "Qty"],
    [1, "Chair", 2],
    [2, "Table", 3],
    [null, "Banquette", 1]
  ])
    sheet.addRow(cells);
  return manifestFrom(await wb.xlsx.writeBuffer());
}
test("hold every claimant of a duplicate and retain pre-correction quantities, including offsetting mistakes", async () => {
  const manifest = await sample(),
    input = candidates(manifest);
  const duplicated = collect(manifest, [...input, { ...input[0] }]);
  assert.deepEqual(
    duplicated.items.map((i) => i.item_type_en),
    ["Table", "Banquette"]
  );
  assert.equal(duplicated.spreadsheet_row_review.held.length, 2);
  assert.deepEqual(
    queue(duplicated),
    manifest.rows.slice(1).map((r) => r.id)
  );
  assert.ok(duplicated.spreadsheet_row_review.held.every((e) => !technicalDrawingEligible({ item: e.item })));
  const wrong = collect(manifest, [{ ...input[0], quantity: 3 }, { ...input[1], quantity: 2 }, input[2]]);
  assert.deepEqual(queue(wrong), [manifest.rows[2].id]);
  assert.deepEqual(
    wrong.spreadsheet_row_review.held.map((e) => e.issues[0].reported),
    [3, 2]
  );
  const cmd = { entryKey: "0", decision: "accept", quantity: 2, rowId: manifest.rows[0].id };
  const checked = reviewSpreadsheetRow(duplicated, cmd, "staff");
  assert.equal(checked.items.length, 3);
  assert.equal(queue(checked).length, 3);
  assert.throws(() => reviewSpreadsheetRow(checked, cmd, "staff"));
  assert.throws(() => reviewSpreadsheetRow(checked, { ...cmd, entryKey: "3" }, "staff"));
  const finished = reviewSpreadsheetRow(checked, { entryKey: "3", decision: "exclude" }, "staff");
  assert.ok(finished.spreadsheet_row_review.held.every((e) => e.decision));
  assert.equal(
    finished.items.reduce((n, i) => n + i.quantity, 0),
    6
  );
});
test("a claimed source row cannot be recovered even when its name and code fail; uncontested omissions recover once", async () => {
  const m = await sample(),
    input = candidates(m);
  const conflict = collect(m, [{ ...input[0], item_type_en: "Unknown", item_ref: "X" }, input[1]]);
  assert.deepEqual(conflict.source_reconciliation.recovered_rows, [m.rows[2].id]);
  assert.deepEqual(
    conflict.items.map((i) => i.item_type_en),
    ["Table", "Banquette"]
  );
  assert.equal(conflict.spreadsheet_row_review.held.length, 1);
  const unmapped = collect(m, [{ item_type_en: "Unknown", quantity: 1 }, input[1]]);
  assert.deepEqual(
    unmapped.items.map((i) => i.item_type_en),
    ["Table"]
  );
});
test("disputed subtotal holds its own section, and a missing quantity never becomes a zero-piece BOM line", async () => {
  const wb = new ExcelJS.Workbook(),
    s = wb.addWorksheet("Rooms");
  for (const cells of [
    ["Item", "Qty"],
    ["Chair", 2],
    ["Subtotal", 2],
    ["Sofa", 3],
    ["Subtotal", 4],
    ["Rug", null]
  ])
    s.addRow(cells);
  const m = await manifestFrom(await wb.xlsx.writeBuffer()),
    res = collect(m, candidates(m));
  assert.deepEqual(
    res.items.map((i) => i.item_type_en),
    ["Chair"]
  );
  assert.equal(res.spreadsheet_row_review.held.length, 2);
  assert.deepEqual(queue(res), [m.rows[0].id]);
});
// Keep the customer workbook outside Git. CI exercises the same rules on small fixtures above.
test(
  "Show Apartment original workbook and incident replay",
  { skip: !process.env.CRAFTON_SHOW_APARTMENT_XLSX },
  async () => {
    const m = await manifestFrom(await readFile(process.env.CRAFTON_SHOW_APARTMENT_XLSX));
    assert.equal(m.file_sha256, "ff52fdd107c2ed719df4cd616cb8cd4bb0965fe7801d45dff1c257e30e86b547");
    const input = process.env.CRAFTON_SHOW_APARTMENT_BACKUP
      ? JSON.parse(await readFile(process.env.CRAFTON_SHOW_APARTMENT_BACKUP, "utf8")).jobs[0].result_json.items.filter(
          (i) => !i.source_row_recovered
        )
      : candidates(m);
    const clean = collect(m, input);
    assert.equal(clean.items.length, 31);
    assert.equal(
      clean.items.reduce((sum, i) => sum + i.quantity, 0),
      37
    );
    assert.ok(clean.items.some((i) => i.item_type_en === "Banquette"));
    assert.equal(clean.spreadsheet_row_review, undefined);
    const historical = structuredClone(m);
    for (const r of historical.rows.filter((r) => r.code)) {
      r.name = r.code;
      r.code = "";
    }
    const replay = collect(historical, input);
    assert.equal(replay.source_reconciliation.recovered_rows.length, 0);
    assert.equal(replay.spreadsheet_row_review.held.length, 30);
    assert.deepEqual(
      replay.items.map((i) => i.item_type_en),
      ["Banquette"]
    );
    const extra = collect(m, [
      ...input,
      ...input.filter((i) => i.item_ref && /^\d+$/.test(i.item_ref)).map((i) => ({ ...i, item_type_en: i.item_ref }))
    ]);
    assert.equal(extra.completeness_review.output_rows, 61);
    assert.equal(extra.completeness_review.output_quantity, 73);
    assert.equal(extra.spreadsheet_row_review.held.length, 60);
    assert.deepEqual(
      extra.items.map((i) => i.item_type_en),
      ["Banquette"]
    );
    assert.ok(queue(extra).every((id) => id === extra.items[0].source_row_id));
    const badQty = collect(
      m,
      input.map((i, n) => (n === 0 ? { ...i, quantity: 999 } : i))
    );
    assert.equal(badQty.items.length, 30);
    assert.equal(
      badQty.spreadsheet_row_review.held[0].issues.find((i) => i.code === "quantity_mismatch").reported,
      999
    );
  }
);
