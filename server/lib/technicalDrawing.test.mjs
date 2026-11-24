import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { drawingDimensions, drawingViewDimensions, dimensionSummary } from "./drawingDimensions.mjs";
import { prepareDrawingViews, dimensionedViewsSvg } from "./drawingDimensionLayout.mjs";
import {
  buildItemTrackingUrl,
  buildTechnicalDrawingSvg,
  buildGenerationPrompt,
  generateTechnicalDrawingForItem,
  drawingGeometryInputKey,
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

test("keeps source section sizes and per-piece sizes distinct from overall dimensions", () => {
  const sofa = drawingDimensions({ dimensions_text: "4499 x 942 x 762 2 sections 2249.5 x 942 x762" });
  assert.deepEqual(sofa.values, { width: 4499, depth: 942, height: 762 });
  assert.deepEqual(sofa.sections, { count: 2, values: { width: 2249.5, depth: 942, height: 762 } });
  assert.equal(drawingViewDimensions(sofa).values.width, 2249.5);
  assert.match(sofa.notes[0], /EACH W 2249.5/);
  assert.deepEqual(drawingDimensions({ dimensions_text: "4400 x 942 x 762 2 sections 2249.5 x 942 x762" }).values, {});
  const desk = drawingDimensions({ dimensions_text: "2 pieces of 1500 x 1100 x 750" });
  assert.deepEqual(desk.values, { width: 1500, depth: 1100, height: 750 });
  assert.equal(desk.pieceCount, 2);
  assert.equal(desk.scope, "per_piece");
});

test("does not fill missing heights or add an ambiguous top-section number to the height", () => {
  const seat = drawingDimensions({ dimensions_text: "1300 x 650 x" });
  assert.deepEqual(seat.values, { width: 1300, depth: 650 });
  assert.deepEqual(seat.missing, ["height"]);
  assert.ok(dimensionSummary(seat).includes("H TO CONFIRM"));
  const bar = drawingDimensions({ dimensions_text: "1501 x 600 x 900 top section 600" });
  assert.deepEqual(bar.values, { width: 1501, depth: 600 });
  assert.deepEqual(bar.missing, ["height"]);
  assert.match(bar.notes[0], /H 900 mm/);
  assert.match(bar.notes[0], /TOP SECTION 600 mm/);
});

async function fixtureViews(extra = "") {
  const buffer = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><rect width="1200" height="675" fill="white"/><g fill="none" stroke="black" stroke-width="2"><rect x="400" y="40" width="400" height="240"/><rect x="100" y="380" width="300" height="250"/><path d="M800 380H850V480H1050V630H800Z"/>${extra}</g></svg>`
    )
  )
    .png()
    .toBuffer();
  return { mimeType: "image/png", dataBase64: buffer.toString("base64") };
}

test("isolates each view and renders exact source dimension arrows without stretching linework", async () => {
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

test("does not stretch a section sofa to the whole assembly width or shrink the elevations", async () => {
  const text = "4499 x 942 x 762 2 sections 2249.5 x 942 x762";
  const dims = drawingDimensions({ dimensions_text: text });
  // Actual crop proportions from the affected Dorset House drawing.
  const views = Object.fromEntries(
    Object.entries({ top: [693, 274], front: [696, 242], side: [300, 245] }).map(([name, [width, height]]) => [
      name,
      { ...image, width, height }
    ])
  );
  const svg = dimensionedViewsSvg(views, dims);
  assert.match(svg, /SINGLE SECTION SHOWN/);
  assert.match(svg, /OVERALL W 4499 mm/);
  assert.match(svg, /2249.5 mm/);
  assert.doesNotMatch(svg, /preserveAspectRatio="none"/);
  const topImageY = Number(svg.match(/data-drawing-view="top"[^>]+\sy="([\d.]+)"/)[1]);
  assert.ok(topImageY - 42 > 226, "dimension text must clear both source notes");
  const pictures = [...svg.matchAll(/<image data-drawing-view="(\w+)"[^>]+width="([\d.]+)" height="([\d.]+)"/g)];
  assert.equal(pictures.length, 3);
  for (const [, name, width, height] of pictures) {
    assert.ok(Math.abs(Number(width) / Number(height) - views[name].width / views[name].height) < 0.001, name);
    if (name === "front") {
      assert.ok(Number(width) > 650, "wide items should use the available drawing area");
      assert.ok(Number(height) > 220, "the sofa must not collapse to the previous 71 px height");
    }
  }
  const prompt = buildGenerationPrompt({ item: { dimensions_text: text } });
  assert.match(prompt, /Draw ONE section only/);
  assert.match(prompt, /"width":2249.5/);
  assert.deepEqual(dimensionSummary(dims), ["W 4499 x D 942 x H 762 mm"], "the schedule retains overall dimensions");
});

test("rejects overlapping or missing generated views before adding dimension labels", async () => {
  await assert.rejects(
    prepareDrawingViews(await fixtureViews('<line x1="400" y1="270" x2="400" y2="380"/>')),
    /three separate/
  );
  const blank = await sharp({ create: { width: 1200, height: 675, channels: 3, background: "#fff" } })
    .png()
    .toBuffer();
  await assert.rejects(
    prepareDrawingViews({ mimeType: "image/png", dataBase64: blank.toString("base64") }),
    /three separate/
  );
});

test("removes model-added captions and a shared baseline and corrects a reversed seating side view", async () => {
  const input = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><rect width="1200" height="675" fill="white"/><g fill="none" stroke="black" stroke-width="2"><rect x="200" y="30" width="300" height="250"/><rect x="200" y="380" width="300" height="250"/><path d="M800 480H950V380H1050V630H800Z"/><path d="M80 630H1120"/></g><g font-family="Arial" font-size="16" fill="black"><text x="250" y="310">PLAN / TOP</text><text x="250" y="335">x=25-75%, y=6-43%</text><text x="250" y="660">FRONT / ELEVATION</text><text x="850" y="660">RIGHT SIDE</text></g></svg>`
    )
  )
    .png()
    .toBuffer();
  const views = await prepareDrawingViews(
    { mimeType: "image/png", dataBase64: input.toString("base64") },
    drawingDimensions({ dimensions_text: confirmedText })
  );
  assert.equal(views.side.mirrored, true);
  assert.equal(views.front.mirrored, false);
  assert.ok(views.top.sourceBox.top + views.top.height < 300, "caption must not affect object bounds");
  assert.ok(views.front.sourceBox.top + views.front.height < 640, "shared floor and captions must not join the views");
});

test("retains thin screen and mirror projections without discarding them as captions", async () => {
  const bytes = await sharp(
    Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><rect width="1200" height="675" fill="white"/><g fill="none" stroke="black" stroke-width="2"><rect x="400" y="100" width="350" height="20"/><rect x="200" y="300" width="350" height="300"/><rect x="900" y="300" width="20" height="300"/></g></svg>'
    )
  )
    .png()
    .toBuffer();
  const views = await prepareDrawingViews({ mimeType: "image/png", dataBase64: bytes.toString("base64") });
  assert.equal(Object.keys(views).length, 3);
  assert.ok(views.side.width < 30);
  assert.ok(views.top.height < 30);
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
    assert.equal(uploads.length, 2);
    assert.equal(uploads[0].path, result.geometry_storage_path);
    assert.equal(uploads[0].options.upsert, false);
    assert.equal((await sharp(uploads[1].data).metadata()).width, 2000);
    assert.equal(result.review_status, "reference_only");
    item.technical_drawing = {
      ...item.technical_drawing,
      diagnostic_geometry_path: result.geometry_storage_path,
      diagnostic_geometry_key: drawingGeometryInputKey(item)
    };
    globalThis.fetch = async () => {
      throw new Error("Saved geometry must not call the model again.");
    };
    const replay = await generateTechnicalDrawingForItem({
      supabase,
      item,
      job: { id: "job" },
      itemIndex: 0,
      userId: "owner"
    });
    assert.equal(replay.dimension_annotations.values.height, 640);
    assert.notEqual(
      drawingGeometryInputKey({ ...item, dimensions_text: "W 700 D 570 H 640" }),
      result.geometry_input_key
    );
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
