// Offline regression check. Never calls a model or writes to production storage.
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { extractIntakeSource } from "../server/lib/intakeSourceReader.mjs";
import {
  reconcileSpreadsheetRows,
  evaluateSpreadsheetCompleteness
} from "../server/lib/intakeSpreadsheetCompleteness.mjs";
import { attachSpreadsheetImages } from "../server/lib/intakeNativeImages.mjs";
import { resizePortalThumbnail } from "../server/lib/portalThumbnail.mjs";

const filename = process.argv[2];
if (!filename) throw Error("Usage: node scripts/verify-ffe-workbook.mjs <original.xlsx>");
const source = await extractIntakeSource({ file: { original_name: filename }, buffer: await fs.readFile(filename) });
const manifest = source.sourceMetadata.spreadsheetManifest;
assert.ok(manifest);
const objects = new Map();
const storage = {
  from: () => ({
    async upload(path, data) {
      if (objects.has(path)) return { error: { statusCode: "409" } };
      objects.set(path, data);
      return {};
    },
    async download(path) {
      return { data: new Blob([objects.get(path)]) };
    }
  })
};
const parsed = reconcileSpreadsheetRows({ items: [], questions: [] }, manifest);
const result = await attachSpreadsheetImages({
  result: parsed,
  manifest,
  images: source.extractedImages,
  storage,
  job: { id: "offline-verification" },
  userId: "offline-owner"
});
const check = evaluateSpreadsheetCompleteness(result, manifest, source.sourceMetadata);
assert.equal(check.status, "passed", JSON.stringify(check.issues));
let thumbnailBytes = 0;
for (const bytes of objects.values()) thumbnailBytes += (await resizePortalThumbnail(bytes)).length;
console.log(
  JSON.stringify(
    {
      ...check,
      source_gaps: check.source_gaps.length,
      uniqueOriginals: objects.size,
      inCellImages: source.extractedImages.filter((i) => i.nativeKind === "in_cell").length,
      duplicateAnchorsRemoved: source.sourceMetadata.duplicateImageAnchorsRemoved,
      thumbnailBytes,
      textTruncated: source.sourceMetadata.textTruncated
    },
    null,
    2
  )
);
