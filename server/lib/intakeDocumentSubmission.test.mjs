import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import sharp from "sharp";
import { analyzeOriginalPdf } from "./intakeOriginalPdf.mjs";
import { parseIntakeBrief } from "./intakeProcessor.mjs";
import { extractIntakeSource } from "./intakeSourceReader.mjs";

const pdf = Buffer.from("%PDF-1.7\noriginal input, sentinel bytes\n%%EOF");
const file = { original_name: "customer.pdf", mime_type: "application/pdf" };
function gemini(t, fetch) {
  t.mock.method(globalThis, "fetch", fetch);
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test";
  t.after(() => {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  });
}
const reply = () =>
  Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{"items":[]}' }] } }] });

test("inline PDF sends only the complete unchanged document to generateContent", async (t) => {
  let parts;
  gemini(t, async (url, { body }) => {
    assert.match(String(url), /:generateContent$/);
    parts = JSON.parse(body).contents[0].parts;
    return reply();
  });
  const result = await analyzeOriginalPdf({ buffer: pdf, pages: [1, 2], job: {}, file });
  assert.deepEqual(parts.slice(1), [{ inlineData: { mimeType: "application/pdf", data: pdf.toString("base64") } }]);
  assert.equal(result.visual_analysis.source_format, "original_pdf");
  assert.equal(result.visual_analysis.submission, "inline");
});

for (const fails of [false, true])
  test("large PDF upload preserves every byte and cleans up on " + (fails ? "model failure" : "success"), async (t) => {
    const calls = [];
    gemini(t, async (url, options) => {
      const request = String(url);
      calls.push(options.method || "POST");
      if (request.includes("/upload/v1beta/files"))
        return new Response(null, { headers: { "x-goog-upload-url": "https://upload.test/session" } });
      if (request === "https://upload.test/session") {
        assert.deepEqual(options.body, pdf);
        return Response.json({ file: { name: "files/test", uri: "https://gemini.test/files/test", state: "ACTIVE" } });
      }
      if (options.method === "DELETE") return new Response(null, { status: 204 });
      const parts = JSON.parse(options.body).contents[0].parts;
      assert.deepEqual(parts.slice(1), [
        { fileData: { mimeType: "application/pdf", fileUri: "https://gemini.test/files/test" } }
      ]);
      return fails ? new Response("Service unavailable", { status: 503 }) : reply();
    });
    const result = await analyzeOriginalPdf({ buffer: pdf, pages: [1], job: {}, file, inlineBytes: 1 });
    assert.equal(calls.at(-1), "DELETE");
    if (fails) {
      assert.deepEqual(result.items, []);
      assert.equal(result.review_routing.route, "internal_review");
    } else assert.equal(result.visual_analysis.submission, "files_api");
  });

for (const inlineBytes of [1024, 1])
  test(
    "billing failure is recorded without retrying another submission mode (inline limit " + inlineBytes + ")",
    async (t) => {
      gemini(t, async () => new Response("Prepayment credits are depleted", { status: 402 }));
      const result = await analyzeOriginalPdf({ buffer: pdf, pages: [1], job: {}, file, inlineBytes });
      assert.equal(globalThis.fetch.mock.callCount(), 1);
      assert.deepEqual(result.items, []);
      assert.equal(result.visual_analysis.reason, "gemini_payment_required");
    }
  );

test("a PDF over the page limit goes to staff with zero proposed items", async (t) => {
  gemini(t, () => {
    throw new Error("unexpected HTTP call");
  });
  const result = await analyzeOriginalPdf({
    buffer: pdf,
    pages: Array.from({ length: 1001 }, (_, i) => i + 1),
    job: {},
    file
  });
  assert.equal(globalThis.fetch.mock.callCount(), 0);
  assert.deepEqual(result.items, []);
  assert.equal(result.quality_gate.reason, "pdf_exceeds_gemini_document_limit");
});

test("Excel sends native rows with labelled regions only for the complex sheet, including cross-row photos and footnotes", async (t) => {
  const book = new ExcelJS.Workbook();
  const simple = book.addWorksheet("Simple");
  simple.addRows([
    ["Code", "Product", "Qty"],
    ["B1", "Bench", 1]
  ]);
  const ws = book.addWorksheet("Guest suite");
  ws.addRow(["Furniture schedule"]);
  ws.mergeCells("A1:D1");
  ws.addRows([
    ["Code", "Product", "Qty", "Photo"],
    ["C1", "Chair", 2],
    ["D1", "Desk", 3],
    ["", "Note: confirm finish"]
  ]);
  ws.getCell("C3").note = "Count per suite.";
  const png = await sharp({ create: { width: 20, height: 30, channels: 3, background: "#557733" } })
    .png()
    .toBuffer();
  const photo = book.addImage({ buffer: png, extension: "png" });
  ws.addImage(photo, { tl: { col: 3, row: 2 }, ext: { width: 32, height: 40 } });
  const excelFile = { original_name: "sheet.xlsx" };
  const source = await extractIntakeSource({ file: excelFile, buffer: await book.xlsx.writeBuffer() });
  assert.deepEqual(
    source.sourceMetadata.spreadsheetManifest.rows.map((r) => [r.name, r.quantity]),
    [
      ["Bench", 1],
      ["Chair", 2],
      ["Desk", 3]
    ]
  );
  const pages = source.sourceMedia.pages;
  assert.equal(source.sourceMetadata.spreadsheetManifest.image_inventory[0].status, "ambiguous");
  assert.ok(pages.length);
  assert.ok(pages.every((p) => p.pageNumber === 2 && p.sheet === "Guest suite"));
  for (const reason of ["merged cells", "image crossing rows", "footnote"])
    assert.ok(pages.some((p) => p.sourceLabel.includes(reason)));
  assert.equal((await sharp(Buffer.from(pages[0].dataBase64, "base64")).metadata()).format, "jpeg");
  let input;
  gemini(t, async (_url, opts) => {
    input = JSON.parse(opts.body).input;
    return Response.json({ output_text: '{"items":[]}' });
  });
  const result = await parseIntakeBrief({ job: {}, file: excelFile, ...source });
  assert.match(input[0].text, /WORKSHEET: Simple/);
  assert.match(input[0].text, /ROW 3: C1 \| Chair \| 2/);
  assert.equal(input[1].text, pages[0].sourceLabel);
  assert.equal(input[2].data, pages[0].dataBase64);
  assert.deepEqual(
    result.visual_analysis.worksheet_regions,
    pages.map((p) => p.sourceLabel)
  );
});
