import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { drawingDimensions, dimensionSummary } from "./drawingDimensions.mjs";
import { prepareDrawingViews, dimensionedViewsSvg } from "./drawingDimensionLayout.mjs";
import {
  buildItemTrackingUrl,
  buildTechnicalDrawingSvg,
  buildGenerationPrompt,
  generateTechnicalDrawingForItem,
  extractGeminiImage,
  formalizeTechnicalDrawing,
  refreshTechnicalDrawingPng,
  renderTechnicalDrawingPng,
  technicalDrawingEligible
} from "./technicalDrawing.mjs";

const image = { mimeType: "image/png", dataBase64: Buffer.alloc(256, 1).toString("base64") };

test("builds a secure IP Item Passport tracking URL", () => {
  const previous = process.env.THREE_VIEW_PUBLIC_APP_URL;
  process.env.THREE_VIEW_PUBLIC_APP_URL = "https://129.121.98.185:8443/";
  try {
    assert.equal(
      buildItemTrackingUrl("trk-example123"),
      "https://129.121.98.185:8443/?view=item-tracking&tracking=TRK-EXAMPLE123"
    );
  } finally {
    if (previous === undefined) delete process.env.THREE_VIEW_PUBLIC_APP_URL;
    else process.env.THREE_VIEW_PUBLIC_APP_URL = previous;
  }
});

const confirmedText = "W 610 x D 570 x H 640 mm; SD 470 x SH 440 mm";
test("keeps confirmed overall and seating dimensions separate and never invents seat width", () => {
  const dimensions = drawingDimensions({ dimensions_text: confirmedText });
  assert.deepEqual(dimensions.values, { width: 610, depth: 570, height: 640, seatDepth: 470, seatHeight: 440 });
  assert.deepEqual(dimensionSummary(dimensions), ["W 610 x D 570 x H 640 mm", "SD 470 · SH 440 mm"]);
  assert.deepEqual(drawingDimensions({ dimensions_text: "450 x 450 x 470" }).values, {
    width: 450,
    depth: 450,
    height: 470
  });
  assert.deepEqual(drawingDimensions({ dimensions_text: "610 x 570 x 640 mm; SH 440 mm" }).values, {
    seatHeight: 440,
    width: 610,
    depth: 570,
    height: 640
  });
});

test("normalizes explicit units and axes without treating a single width as a depth", () => {
  assert.deepEqual(drawingDimensions({ dimensions_text: "W 400 D 400 H 450 SH 450" }).issues, []);
  assert.deepEqual(dimensionSummary(drawingDimensions({ dimensions_text: "SH 440 mm" })), ["TO CONFIRM", "SH 440 mm"]);
  assert.deepEqual(drawingDimensions({ dimensions_text: "W 61 x D 57 x H 64 cm" }).values, {
    width: 610,
    depth: 570,
    height: 640
  });
  assert.deepEqual(drawingDimensions({ dimensions_text: "L 1200 x W 500 x H 750 mm" }).values, {
    width: 1200,
    depth: 500,
    height: 750
  });
  assert.deepEqual(drawingDimensions({ dimensions_text: "W 20 in x D 400 mm x H 0.7 m" }).values, {
    width: 508,
    depth: 400,
    height: 700
  });
  assert.deepEqual(drawingDimensions({ dimensions_text: "Ø 600 x H 700 mm" }).values, {
    diameter: 600,
    width: 600,
    depth: 600,
    height: 700
  });
  assert.deepEqual(drawingDimensions({ dimensions: { width: 600 } }).values, { width: 600 });
  assert.deepEqual(drawingDimensions({ dimensions: { length: 120, width: 50, height: 75, unit: "cm" } }).values, {
    width: 1200,
    depth: 500,
    height: 750
  });
  assert.deepEqual(drawingDimensions({ dimensions_text: "宽610 深570 高640 座深470 座高440 mm" }).values, {
    width: 610,
    depth: 570,
    height: 640,
    seatDepth: 470,
    seatHeight: 440
  });
});

test("holds ambiguous, contradictory and physically invalid dimensions instead of guessing", () => {
  for (const text of [
    "W 600-800 x D 400 x H 500 mm",
    "W 600 W 700 D 500 H 800",
    "W 600 D 500 H 800 SH 900",
    "W 600 D 500 H 800 SD 550",
    "W 0 D 400 H 500",
    "about W 600 D 400 H 500",
    "W 6 ft D 4 ft H 3 ft"
  ]) {
    const result = drawingDimensions({ dimensions_text: text });
    assert.deepEqual(result.values, {}, text);
    assert.ok(result.issues.length, text);
  }
  assert.deepEqual(
    drawingDimensions({ dimensions_text: "To confirm", dimensions: { width: 600, depth: 400, height: 800 } }).values,
    {},
    "stale structured dimensions must not override current text"
  );
  assert.deepEqual(drawingDimensions({ dimensions_text: "600 x 400" }).values, {});
});

async function fixtureViews(extra = "") {
  const buffer = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><rect width="1200" height="675" fill="white"/><g fill="none" stroke="black" stroke-width="2"><rect x="400" y="40" width="400" height="240"/><rect x="100" y="380" width="300" height="250"/><rect x="800" y="380" width="250" height="250"/>${extra}</g></svg>`
    )
  )
    .png()
    .toBuffer();
  return { mimeType: "image/png", dataBase64: buffer.toString("base64") };
}

test("isolates each view and renders exact source dimension arrows at common scale", async () => {
  const generatedImage = await fixtureViews();
  generatedImage.views = await prepareDrawingViews(generatedImage);
  assert.deepEqual(Object.keys(generatedImage.views), ["top", "front", "side"]);
  const dims = drawingDimensions({ dimensions_text: confirmedText });
  const svg = buildTechnicalDrawingSvg({ item: { dimensions_text: confirmedText }, generatedImage });
  for (const label of ["610 mm", "570 mm", "640 mm", "SD 470 mm", "SH 440 mm"]) assert.ok(svg.includes(label), label);
  assert.equal((svg.match(/data-dimension=/g) || []).length, 9);
  assert.doesNotMatch(svg, /data-dimension="top-seat-width"/);
  assert.doesNotMatch(
    dimensionedViewsSvg(generatedImage.views, drawingDimensions({ dimensions_text: "To confirm" })),
    /data-dimension=/
  );
  assert.doesNotMatch(
    dimensionedViewsSvg(generatedImage.views, drawingDimensions({ dimensions_text: "450 x 450 x 470" })),
    /data-dimension=".*seat/
  );
  const output = await renderTechnicalDrawingPng(svg);
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.width, 2000);
  assert.equal(metadata.height, 1300);
  const prompt = buildGenerationPrompt({ item: { dimensions_text: confirmedText } });
  assert.ok(prompt.includes(JSON.stringify(dims.values)));
  assert.match(prompt, /Do not infer seat width from seat depth/);
});

test("rejects overlapping or missing generated views before adding dimension labels", async () => {
  await assert.rejects(
    prepareDrawingViews(await fixtureViews('<line x1="200" y1="300" x2="200" y2="380"/>')),
    /gutters/
  );
  const blank = await sharp({ create: { width: 1200, height: 675, channels: 3, background: "#fff" } })
    .png()
    .toBuffer();
  await assert.rejects(
    prepareDrawingViews({ mimeType: "image/png", dataBase64: blank.toString("base64") }),
    /missing or clipped/
  );
});

test("generation stores an immutable annotated revision while retaining the previous drawing", async () => {
  const generated = await fixtureViews();
  const oldFetch = globalThis.fetch,
    oldKey = process.env.GEMINI_API_KEY;
  const uploads = [];
  const reference = Buffer.from(generated.dataBase64, "base64");
  const supabase = {
    storage: {
      from: () => ({
        download: async () => ({ data: new Blob([reference], { type: "image/png" }) }),
        upload: async (path, data, options) => {
          uploads.push({ path, data, options });
          return {};
        }
      })
    }
  };
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ output_image: { mime_type: generated.mimeType, data: generated.dataBase64 } })
  });
  process.env.GEMINI_API_KEY = "unit-test-only";
  try {
    const old = { revision: "R00", kind: "ai_concept", storage_path: "old.png" };
    const item = {
      dimensions_text: confirmedText,
      dimension_revision: { confirmed_text: confirmedText },
      image_storage_path: "reference.png",
      technical_drawing: { revisions: [old] }
    };
    const result = await generateTechnicalDrawingForItem({
      supabase,
      item,
      job: { id: "job" },
      itemIndex: 0,
      userId: "owner"
    });
    assert.equal(result.current_revision, "R01");
    assert.deepEqual(result.revisions[0], old);
    assert.equal(result.dimensions_source, "user_confirmed_revision");
    assert.equal(result.dimension_annotations.values.seatDepth, 470);
    assert.match(
      result.draft_storage_path,
      /owner\/derived\/job\/technical-drawings\/item-1-three-view-v2-dimensions-[\da-f-]+-draft.png/
    );
    assert.equal(uploads.length, 1);
    assert.equal((await sharp(uploads[0].data).metadata()).width, 2000);
    assert.equal(result.review_status, "reference_only");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = oldKey;
  }
});

test("extracts an image from Gemini interaction output", () => {
  const result = extractGeminiImage({ output_image: { mime_type: image.mimeType, data: image.dataBase64 } });
  assert.deepEqual(result, image);
});

test("separates AI concept references from supplier manufacturing drawings", () => {
  const input = {
    item: {
      item_type_en: "Curved Lounge Chair",
      quantity: 10,
      dimensions_text: "W 650 x D 650 x H 690 mm",
      material_en: "Linen / walnut base"
    },
    job: { id: "job-123", project_name: "Luna Project" },
    references: [image],
    generatedImage: image
  };
  const draft = buildTechnicalDrawingSvg(input);
  const formal = buildTechnicalDrawingSvg({ ...input, formal: true });
  assert.match(draft, /概念视图/);
  assert.match(draft, /REFERENCE ONLY · NOT FOR MANUFACTURE/);
  assert.match(draft, /CLIENT FF&amp;E · CONCEPT/);
  assert.doesNotMatch(draft, /\bAI\b|人工智能|人工智慧/);
  assert.match(formal, /供应商施工图/);
  assert.match(formal, /APPROVED FOR MANUFACTURE/);
  assert.match(formal, /SUPPLIER CAD \/ SHOP DRAWING/);
  assert.match(formal, /W 650 x D 650 x H 690 mm/);
  assert.match(draft, /ITEM TRACEABILITY/);
  assert.match(draft, /CRF-LP-/);
  assert.match(draft, /TRK-/);
  assert.match(draft, /data:image\/svg\+xml;base64/);
});

test("renders the composed drawing sheet as a PNG", async () => {
  const png = await renderTechnicalDrawingPng(
    '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1300"><rect width="2000" height="1300" fill="white"/></svg>'
  );
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const refreshed = await refreshTechnicalDrawingPng(png, {
    item: { item_type_en: "Chair", quantity: 10, material_en: "A very long material description that must fit" },
    job: { id: "550c6980-96f5-499e-a6cd-6026b43779e4", project_name: "Luna Project" }
  });
  assert.deepEqual([...refreshed.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

test("only queues items with a reference and no active drawing", () => {
  assert.equal(technicalDrawingEligible({ item: { image_storage_path: "client/item.png" } }), true);
  assert.equal(
    technicalDrawingEligible({
      item: { image_storage_path: "client/item.png", technical_drawing: { status: "system_generated" } }
    }),
    false
  );
  assert.equal(
    technicalDrawingEligible({
      item: { image_storage_path: "client/item.png", technical_drawing: { status: "ai_concept" } }
    }),
    false
  );
  assert.equal(technicalDrawingEligible({ item: {} }), false);
  assert.equal(
    technicalDrawingEligible({
      item: {
        image_storage_path: "client/item.png",
        technical_drawing: { status: "waiting_for_quota", retry_after: new Date(Date.now() + 60000).toISOString() }
      }
    }),
    false
  );
});

test("formalizes only an approved supplier shop-drawing revision", () => {
  const formal = formalizeTechnicalDrawing(
    {
      status: "ai_concept",
      storage_bucket: "intake-files",
      draft_storage_path: "concept.png",
      revisions: [
        {
          kind: "ai_concept",
          revision: "R00",
          review_status: "reference_only",
          storage_path: "concept.png"
        },
        {
          kind: "supplier_shop_drawing",
          revision: "R01",
          review_status: "approved",
          storage_bucket: "intake-files",
          storage_path: "supplier/R01.pdf"
        }
      ]
    },
    { approvedBy: "Cho" }
  );
  assert.equal(formal.status, "approved_for_manufacture");
  assert.equal(formal.current_revision, "R01");
  assert.equal(formal.drawing_storage_path, "supplier/R01.pdf");
  assert.equal(formal.approved_by, "Cho");
});
