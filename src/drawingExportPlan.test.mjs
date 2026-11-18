import test from "node:test";
import assert from "node:assert/strict";
import { archiveName, drawingExportPlan } from "./drawingExportPlan.mjs";

const project = { projectName: "Dorset House" };
function chair(n, drawing = { draftUrl: "/chair.png" }) {
  return {
    sku: "CHAIR-" + n,
    item: {
      id: String(n),
      typeCn: "桌椅",
      typeEn: "Desk Chair",
      materialEn: "Oak",
      materialCn: "橡木",
      finishEn: "Lacquer",
      finishCn: "清漆",
      technicalDrawing: drawing
    }
  };
}
test("all pages export distinct UTF-8 filenames and specifications in the selected language", () => {
  const lines = Array.from({ length: 19 }, (_, i) => chair(i + 1));
  for (const lang of ["En", "Cn"]) {
    const { entries, pending } = drawingExportPlan({ project, lines, lang, supplierFiles: [] });
    assert.deepEqual(pending, []);
    assert.equal(entries.length, 19);
    assert.equal(new Set(entries.map((e) => e.filename)).size, 19);
    assert.match(entries[18].filename, /^019 - Dorset House - .*CHAIR-19/);
    assert.equal(entries[0].name, lang === "En" ? "Desk Chair" : "桌椅");
    assert.equal(entries[0].material, lang === "En" ? "Oak · Lacquer" : "橡木 · 清漆");
    assert.ok(archiveName(project, lang).endsWith(lang === "En" ? "EN.zip" : "中文.zip"));
  }
});
test("includes the concept and each supplier revision once and preserves the original formats", () => {
  const original = {
    file_path: "s/R02.dwg",
    file_name: "manufacture.dwg",
    file_url: "/signed/02",
    payload: { item_code: "chair-1", revision: "R02", review_status: "approved" }
  };
  const files = [
    original,
    {
      ...original,
      file_path: "s/R01.pdf",
      file_name: "draft.pdf",
      file_url: "/signed/01",
      payload: { ...original.payload, revision: "R01", review_status: "changes_required" }
    }
  ];
  const lines = [
    chair(1, {
      status: "approved_for_manufacture",
      currentRevision: "R02",
      draftUrl: "/concept",
      storagePath: original.file_path,
      url: "/other-signature"
    }),
    chair(2, {}),
    chair(3, { status: "formal" })
  ];
  const { entries, pending } = drawingExportPlan({ project, lang: "En", lines, supplierFiles: files });
  assert.deepEqual(
    entries.map((e) => e.url),
    ["/concept", "/signed/02", "/signed/01"]
  );
  assert.match(entries[0].filename, /Concept three-view R00/);
  assert.match(entries[1].filename, /Desk Chair.*R02 Approved - Original\.dwg$/);
  assert.match(entries[2].filename, /R01 Changes required - Original\.pdf$/);
  assert.deepEqual(pending, ["Desk Chair · CHAIR-2", "Desk Chair · CHAIR-3"]);
});
test("filenames are single portable path components even with long CJK names and punctuation", () => {
  const line = chair(1);
  line.item.typeCn = "長檯".repeat(100);
  const { entries } = drawingExportPlan({
    project: { projectName: "..\\/客廳:?*".repeat(60) },
    lang: "Cn",
    lines: [line],
    supplierFiles: []
  });
  assert.doesNotMatch(entries[0].filename, /[<>:"/\\|?*]/);
  assert.ok(Buffer.byteLength(entries[0].filename) <= 255);
  assert.match(entries[0].filename, /CHAIR-1.*中文\.png$/);
});
