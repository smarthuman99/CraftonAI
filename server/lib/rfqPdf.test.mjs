import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import pdfMake from "pdfmake";
import sharp from "sharp";
import { PDFParse } from "pdf-parse";
import { buildRfqPdfDefinition } from "../../src/components/rfqPdf.js";
import { referencesForItem } from "../../shared/rfqReferences.mjs";
import { archiveRfqExport, readArchivedRfqFile } from "../../src/components/rfqArchive.js";

test("PDF contains embedded product images and readable bilingual text without network access", async () => {
  const png = await sharp({ create: { width: 40, height: 20, channels: 3, background: "#4A3525" } })
    .png()
    .toBuffer();
  const options = {
    project: { projectName: "Furniture" },
    batch: { rfq_code: "RFQ-TEST", status: "approved", payload: { version: 2 } },
    document: {
      titleCn: "供应商询价",
      titleEn: "Supplier RFQ",
      project: { clientName: "Verified Client" },
      items: [{ itemNo: "A", nameEn: "Outdoor Bistro Set", nameCn: "户外套装", quantity: 10, unit: "sets" }]
    },
    references: [
      { name: "photo.png", itemNo: "A", type: "image/png", url: `data:image/png;base64,${png.toString("base64")}` }
    ]
  };
  const definition = await buildRfqPdfDefinition(options);
  assert.equal(Object.keys(definition.images).length, 1);
  assert.ok(definition.content.some((node) => node.image === "reference0"));
  const font = fileURLToPath(new URL("../../public/fonts/NotoSansCJKsc-Regular.otf", import.meta.url));
  pdfMake.addFonts({ CraftonCJK: { normal: font, bold: font, italics: font, bolditalics: font } });
  pdfMake.setUrlAccessPolicy(() => false);
  pdfMake.setLocalAccessPolicy((path) => path === font);
  const buffer = await pdfMake.createPdf(definition).getBuffer();
  assert.match(buffer.toString("latin1"), /\/Subtype \/Image/);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  assert.match(result.text, /供应商询价/);
  assert.match(result.text, /10 sets/);
  assert.match(result.text, /Verified Client/);
  await assert.rejects(
    buildRfqPdfDefinition({ ...options, references: [{ name: "lost.png", type: "image/png", url: "" }] }),
    /无法嵌入/
  );
});

test("product references never match by array position or override an explicit item ID", () => {
  const item = { itemNo: "A", referenceFiles: ["legacy.png", "wrong.png"] };
  const refs = [{ name: "wrong.png", itemNo: "B" }, { name: "legacy.png" }, { name: "new.png", itemNo: "A" }];
  assert.deepEqual(
    referencesForItem(item, refs).map((row) => row.name),
    ["legacy.png", "new.png"]
  );
});

test("archived exports can be reopened in a new session using their durable path", async () => {
  const blobs = new Map();
  let record;
  const storage = {
    from: (bucket) => ({
      upload: async (path, blob) => {
        blobs.set(`${bucket}/${path}`, blob);
        return {};
      },
      download: async (path) => ({ data: blobs.get(`${bucket}/${path}`) })
    })
  };
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "staff" } } }) },
    storage,
    from: () => ({
      insert: (value) => ({ select: () => ({ single: async () => ({ data: (record = { id: "file", ...value }) }) }) })
    })
  };
  const saved = await archiveRfqExport({
    client,
    projectId: "project",
    batch: { id: "batch", rfq_code: "RFQ-TEST" },
    supplierIds: ["supplier"],
    group: "rfq_pdf",
    hash: "hash",
    exported: {
      buffer: new TextEncoder().encode("%PDF-test"),
      mimeType: "application/pdf",
      fileName: "RFQ.pdf",
      metadata: { document_version: 2 }
    }
  });
  assert.equal(record.file_group, "rfq_pdf");
  assert.equal(record.payload.rfq_batch_id, "batch");
  assert.equal(record.payload.document_version, 2);
  assert.equal(record.file_url, undefined);
  assert.equal(
    await (await readArchivedRfqFile({ storage }, JSON.parse(JSON.stringify(saved.file)))).text(),
    "%PDF-test"
  );
  await assert.rejects(readArchivedRfqFile({ storage }, { payload: {} }), /没有可下载/);
});
