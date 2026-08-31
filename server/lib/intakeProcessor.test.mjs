import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { parseIntakeBrief } from "./intakeProcessor.mjs";

const originalFetch = globalThis.fetch;
const originalEnv = {
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_BASE_URL: process.env.GEMINI_BASE_URL,
  GEMINI_VISION_MODEL: process.env.GEMINI_VISION_MODEL
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("deterministic parser turns quantity text into itemized requirements", async () => {
  process.env.DEEPSEEK_API_KEY = "";
  process.env.GEMINI_API_KEY = "";

  const result = await parseIntakeBrief({
    job: {
      project_name: "St Albans Boutique Hotel Lobby",
      destination: "London, UK",
      quantity_text: "40 Lobby Armchairs linen W:65cm D:60cm H:85cm, 20 VIP Club Chairs velvet",
      brief_text: "Need UK Crib 5 compliance and matte black metal legs."
    },
    file: { original_name: "brief.txt", mime_type: "text/plain" },
    sourceText: ""
  });

  assert.equal(result.project.name, "St Albans Boutique Hotel Lobby");
  assert.equal(result.project.destination, "London, UK");
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].quantity, 40);
  assert.match(result.items[0].item_type_en, /Lobby Armchairs/i);
  assert.equal(result.items[0].material_en, "Linen (to confirm)");
  assert.match(result.items[0].dimensions_text, /W:65cm, D:60cm, H:85cm/);
  assert.equal(result.items[1].quantity, 20);
  assert.equal(result.items[1].material_en, "Velvet (to confirm)");
  assert.ok(result.questions.every((question) => !/Crib 5/.test(question)));
});

test("deterministic parser uses readable uploaded text when form fields are sparse", async () => {
  process.env.DEEPSEEK_API_KEY = "";
  process.env.GEMINI_API_KEY = "";

  const result = await parseIntakeBrief({
    job: {
      project_name: "",
      destination: "",
      quantity_text: "",
      brief_text: "Project: Riverside serviced apartments\nDestination: Manchester receiving warehouse"
    },
    file: { original_name: "requirements.csv", mime_type: "text/csv" },
    sourceText: [
      "item,quantity,material,notes",
      "Oak coffee tables,12,oak,W:900mm D:600mm H:420mm",
      "Leather dining chairs,48,leather,color cognac"
    ].join("\n")
  });

  assert.equal(result.project.name, "Riverside serviced apartments");
  assert.equal(result.project.destination, "Manchester receiving warehouse");
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].quantity, 12);
  assert.equal(result.items[0].material_en, "Oak (to confirm)");
  assert.match(result.items[0].dimensions_text, /W:900mm, D:600mm, H:420mm/);
  assert.equal(result.items[1].quantity, 48);
  assert.equal(result.items[1].material_en, "Leather (to confirm)");
  assert.ok(result.questions.some((question) => /fire-safety/i.test(question)));
});

test("image intake sends bytes to Gemini and preserves structured visual evidence", async () => {
  process.env.DEEPSEEK_API_KEY = "";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.GEMINI_BASE_URL = "https://gemini.test/v1beta";
  process.env.GEMINI_VISION_MODEL = "gemini-vision-test";

  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    const output = {
      project: {
        name: "Harbour Hotel Lounge",
        client_name: "Portal Intake Client",
        destination: "Singapore"
      },
      items: [
        {
          item_type_cn: "弧形休闲椅",
          item_type_en: "Curved lounge chair",
          quantity: 24,
          material_cn: "米色织物",
          material_en: "Beige woven upholstery",
          original_unit_price: 100,
          unit_price: 120,
          dimensions_text: "To confirm",
          style_cn: "现代有机",
          style_en: "Modern organic",
          color_cn: "暖米色",
          color_en: "Warm beige",
          finish_cn: "哑光黑色椅脚",
          finish_en: "Matte black legs",
          visible_features_cn: ["弧形靠背", "软包座面"],
          visible_features_en: ["Curved back", "Upholstered seat"],
          confidence: 0.88,
          notes_cn: "图片显示单把参考椅。",
          notes_en: "The image shows one reference chair."
        }
      ],
      questions: [],
      summary_cn: "已从图片识别休闲椅参考款。",
      summary_en: "A lounge-chair reference was identified from the image.",
      source_notes: "Visual analysis of lounge-chair.jpg",
      visual_analysis: {
        image_summary_cn: "酒店休闲椅产品参考图。",
        image_summary_en: "Reference image of a hotel lounge chair.",
        detected_text: [],
        limitations: ["Dimensions are not visible."]
      }
    };
    return new Response(
      JSON.stringify({
        id: "int_test",
        steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify(output) }] }]
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const result = await parseIntakeBrief({
    job: {
      project_name: "Harbour Hotel Lounge",
      destination: "Singapore",
      quantity_text: "24 lounge chairs",
      brief_text: "Use the uploaded chair as the visual direction."
    },
    file: { original_name: "lounge-chair.jpg", mime_type: "image/jpeg" },
    sourceMedia: {
      mimeType: "image/jpeg",
      dataBase64: "ZmFrZS1pbWFnZS1ieXRlcw==",
      byteLength: 16
    }
  });

  assert.equal(request.url, "https://gemini.test/v1beta/interactions");
  assert.equal(request.options.headers["x-goog-api-key"], "test-gemini-key");
  assert.equal(request.body.model, "gemini-vision-test");
  assert.equal(request.body.input[1].type, "image");
  assert.equal(request.body.input[1].data, "ZmFrZS1pbWFnZS1ieXRlcw==");
  assert.equal(request.body.response_format.mime_type, "application/json");
  assert.equal(result.visual_analysis.status, "completed");
  assert.equal(result.visual_analysis.model, "gemini-vision-test");
  assert.equal(result.items[0].style_en, "Modern organic");
  assert.match(result.items[0].material_en, /visual estimate; to confirm/i);
  assert.equal(result.items[0].unit_price, 0);
  assert.match(result.items[0].notes_en, /visual confidence: 88%/i);
  assert.ok(result.questions.some((question) => /width, depth, and height/i.test(question)));
  assert.ok(result.questions.some((question) => /physical sample or specification sheet/i.test(question)));
});

test("rendered PDF pages are sent to Gemini vision with page markers and preserve printed schedule facts", async () => {
  process.env.DEEPSEEK_API_KEY = "";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.GEMINI_BASE_URL = "https://gemini.test/v1beta";
  process.env.GEMINI_VISION_MODEL = "gemini-vision-test";

  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, body: JSON.parse(options.body) };
    const output = {
      project: { name: "Portal Amenity", client_name: "The Crafton Ltd", destination: "London" },
      items: [
        {
          item_type_cn: "沙发",
          item_type_en: "Sofa",
          quantity: 2,
          material_cn: "待确认",
          material_en: "To confirm",
          original_unit_price: 0,
          unit_price: 0,
          dimensions_text: "W 2340 x D 980 x H 750 mm",
          usage_location: "Snug",
          source_page: 1,
          confidence: 0.96,
          notes_cn: "",
          notes_en: "Printed schedule row."
        }
      ],
      questions: [],
      summary_cn: "已读取 PDF 家具表。",
      summary_en: "The PDF furniture schedule was read.",
      source_notes: "Rendered pages 1-2",
      visual_analysis: {
        image_summary_cn: "家具表页面。",
        image_summary_en: "Furniture schedule pages.",
        detected_text: ["Sofa", "Qty 2"],
        limitations: []
      }
    };
    return new Response(
      JSON.stringify({
        id: "int_pdf_test",
        steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify(output) }] }]
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const result = await parseIntakeBrief({
    job: { project_name: "Portal Amenity", destination: "London", quantity_text: "", brief_text: "" },
    file: { original_name: "portal-amenity.pdf", mime_type: "application/pdf" },
    sourceText: "SOURCE PAGE 1\n\nSOURCE PAGE 2",
    sourceMedia: {
      sourceKind: "pdf_pages",
      mimeType: "image/png",
      byteLength: 12,
      pages: [
        { pageNumber: 1, mimeType: "image/png", dataBase64: "cGFnZS0x", byteLength: 6 },
        { pageNumber: 2, mimeType: "image/png", dataBase64: "cGFnZS0y", byteLength: 6 }
      ]
    }
  });

  assert.equal(request.url, "https://gemini.test/v1beta/interactions");
  assert.deepEqual(
    request.body.input.slice(1).map((part) => [part.type, part.text || part.data]),
    [
      ["text", "PDF SOURCE PAGE 1"],
      ["image", "cGFnZS0x"],
      ["text", "PDF SOURCE PAGE 2"],
      ["image", "cGFnZS0y"]
    ]
  );
  assert.equal(result.items[0].quantity, 2);
  assert.equal(result.items[0].material_en, "To confirm");
  assert.equal(result.items[0].dimensions_text, "W 2340 x D 980 x H 750 mm");
  assert.equal(result.items[0].source_page, 1);
  assert.ok(result.questions.every((question) => !/reference photo|physical sample/i.test(question)));
});

test("Gemini vision retries rendered PDF batches through generateContent when Interactions is unavailable", async () => {
  process.env.DEEPSEEK_API_KEY = "";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.GEMINI_BASE_URL = "https://gemini.test/v1beta";
  process.env.GEMINI_VISION_MODEL = "gemini-vision-test";

  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    if (String(url).endsWith("/interactions")) {
      return new Response(JSON.stringify({ error: { message: "Interactions not enabled" } }), { status: 404 });
    }

    const output = {
      project: { name: "Portal Amenity", client_name: "The Crafton Ltd", destination: "London" },
      items: [
        {
          item_type_cn: "沙发",
          item_type_en: "Sofa",
          quantity: 2,
          material_cn: "米色布艺",
          material_en: "Beige upholstery",
          original_unit_price: 0,
          unit_price: 0,
          dimensions_text: "W 2340 x D 980 x H 750 mm",
          usage_location: "Snug",
          source_page: 1,
          style_cn: "现代",
          style_en: "Modern",
          color_cn: "米色",
          color_en: "Beige",
          finish_cn: "待确认",
          finish_en: "To confirm",
          visible_features_cn: ["弧形靠背"],
          visible_features_en: ["Curved back"],
          confidence: 0.96,
          notes_cn: "PDF 表格行。",
          notes_en: "Printed PDF schedule row."
        }
      ],
      questions: [],
      summary_cn: "已读取 PDF 家具表。",
      summary_en: "The PDF furniture schedule was read.",
      source_notes: "Rendered page 1",
      visual_analysis: {
        image_summary_cn: "家具表页面。",
        image_summary_en: "Furniture schedule page.",
        detected_text: ["Sofa", "Qty 2"],
        limitations: []
      }
    };
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  const result = await parseIntakeBrief({
    job: { project_name: "Portal Amenity", destination: "London", quantity_text: "", brief_text: "" },
    file: { original_name: "portal-amenity.pdf", mime_type: "application/pdf" },
    sourceText: "SOURCE PAGE 1",
    sourceMedia: {
      sourceKind: "pdf_pages",
      mimeType: "image/png",
      byteLength: 6,
      pages: [{ pageNumber: 1, mimeType: "image/png", dataBase64: "cGFnZS0x", byteLength: 6 }]
    }
  });

  assert.equal(requests.length, 2);
  assert.equal(requests[1].url, "https://gemini.test/v1beta/models/gemini-vision-test:generateContent");
  assert.deepEqual(
    requests[1].body.contents[0].parts.slice(1).map((part) => part.text || part.inlineData?.data),
    ["PDF SOURCE PAGE 1", "cGFnZS0x"]
  );
  assert.equal(requests[1].body.generationConfig.responseMimeType, "application/json");
  assert.equal(result.visual_analysis.status, "completed");
  assert.equal(result.visual_analysis.transport, "generateContent");
  assert.equal(result.items[0].quantity, 2);
});

test("whole PDF is sent directly to Gemini and non-furniture layout headings fail the quality gate", async () => {
  process.env.DEEPSEEK_API_KEY = "";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.GEMINI_BASE_URL = "https://gemini.test/v1beta";
  process.env.GEMINI_VISION_MODEL = "gemini-vision-test";

  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, body: JSON.parse(options.body) };
    const baseItem = {
      item_type_cn: "大堂沙发",
      item_type_en: "Lobby Sofa",
      quantity: 2,
      material_cn: "羊毛混纺",
      material_en: "Wool blend",
      original_unit_price: 0,
      unit_price: 0,
      dimensions_text: "W 2400 x D 950 x H 780 mm",
      usage_location: "Lobby",
      source_page: 3,
      source_pages: [2, 3],
      item_ref: "SO-01",
      page_type: "product_specification",
      evidence_text: "SO-01 Lobby Sofa Qty 2 W2400 D950 H780",
      image_ref: 0,
      photo_page: 3,
      photo_bbox: { x_min: 620, y_min: 120, x_max: 940, y_max: 520 },
      style_cn: "现代",
      style_en: "Modern",
      color_cn: "米色",
      color_en: "Beige",
      finish_cn: "待确认",
      finish_en: "To confirm",
      visible_features_cn: ["软包"],
      visible_features_en: ["Upholstered"],
      confidence: 0.96,
      notes_cn: "规格页资料。",
      notes_en: "Product specification evidence."
    };
    const output = {
      project: { name: "The Bower", client_name: "The Crafton Ltd", destination: "London" },
      items: [
        baseItem,
        {
          ...baseItem,
          item_type_cn: "大堂家具平面图",
          item_type_en: "Lobby Furniture Layout",
          quantity: 1,
          source_page: 2,
          source_pages: [2],
          item_ref: "LAYOUT-02",
          page_type: "floorplan",
          evidence_text: "Lobby Furniture Layout",
          photo_page: 0,
          photo_bbox: { x_min: 0, y_min: 0, x_max: 0, y_max: 0 }
        }
      ],
      questions: [],
      summary_cn: "已完成整份文件分析。",
      summary_en: "Whole-document analysis complete.",
      source_notes: "Pages 1-3 analyzed together.",
      document_analysis: {
        document_summary: "FF&E package with layout and specification pages.",
        pages: [
          { source_page: 1, page_type: "cover", confidence: 0.99, contains_orderable_items: false, notes: "Cover" },
          {
            source_page: 2,
            page_type: "floorplan",
            confidence: 0.97,
            contains_orderable_items: false,
            notes: "Lobby plan"
          },
          {
            source_page: 3,
            page_type: "product_specification",
            confidence: 0.98,
            contains_orderable_items: true,
            notes: "SO-01"
          }
        ]
      },
      layout_references: [
        {
          source_page: 2,
          room: "Lobby",
          furniture_tag: "SO-01",
          stated_count: 2,
          linked_item_ref: "SO-01",
          confidence: 0.9
        }
      ],
      visual_analysis: {
        image_summary_cn: "整份 FF&E 文件。",
        image_summary_en: "Complete FF&E document.",
        detected_text: ["SO-01", "Lobby Sofa"],
        limitations: []
      }
    };
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  const result = await parseIntakeBrief({
    job: { project_name: "The Bower", destination: "London", quantity_text: "", brief_text: "" },
    file: { original_name: "The Bower FF&E.pdf", mime_type: "application/pdf" },
    sourceText: "SOURCE PAGE 1\nCover\nSOURCE PAGE 2\nLobby Furniture Layout\nSOURCE PAGE 3\nSO-01 Lobby Sofa",
    sourceMedia: {
      sourceKind: "pdf_document",
      mimeType: "application/pdf",
      dataBase64: "JVBERi0xLjQ=",
      byteLength: 8,
      pageNumbers: [1, 2, 3]
    }
  });

  assert.equal(request.url, "https://gemini.test/v1beta/models/gemini-vision-test:generateContent");
  assert.equal(request.body.contents[0].parts[1].inlineData.mimeType, "application/pdf");
  assert.equal(request.body.contents[0].parts[1].inlineData.data, "JVBERi0xLjQ=");
  assert.match(request.body.contents[0].parts[0].text, /classify every 1-based source page/i);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].item_ref, "SO-01");
  assert.deepEqual(result.items[0].source_pages, [2, 3]);
  assert.equal(result.items[0].photo_bbox.x_min, 620);
  assert.equal(result.layout_references.length, 1);
  assert.equal(result.quality_gate.rejected_item_count, 1);
  assert.match(result.quality_gate.rejected_candidates[0].reason, /document_heading|non_orderable/);
});

test("Excel and Word-style structured text use Gemini as the primary intake analyzer", async () => {
  process.env.DEEPSEEK_API_KEY = "";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.GEMINI_BASE_URL = "https://gemini.test/v1beta";
  process.env.GEMINI_VISION_MODEL = "gemini-vision-test";

  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, body: JSON.parse(options.body) };
    const output = {
      project: { name: "Harbour Hotel", client_name: "Studio", destination: "London" },
      items: [
        {
          item_type_cn: "大堂椅",
          item_type_en: "Lobby Chair",
          quantity: 12,
          material_cn: "橡木和羊毛",
          material_en: "Oak and wool",
          original_unit_price: 0,
          unit_price: 0,
          dimensions_text: "W 720 x D 760 x H 810 mm",
          usage_location: "Lobby",
          source_page: 1,
          source_pages: [1],
          item_ref: "CH-01",
          page_type: "furniture_schedule",
          evidence_text: "ROW 4: CH-01 | Lobby Chair | 12",
          image_ref: 3,
          photo_page: 0,
          photo_bbox: { x_min: 0, y_min: 0, x_max: 0, y_max: 0 },
          style_cn: "现代",
          style_en: "Modern",
          color_cn: "蓝色",
          color_en: "Blue",
          finish_cn: "天然橡木",
          finish_en: "Natural oak",
          visible_features_cn: [],
          visible_features_en: [],
          confidence: 0.98,
          notes_cn: "Excel 家具表。",
          notes_en: "Excel furniture schedule."
        }
      ],
      questions: [],
      summary_cn: "已读取 Excel。",
      summary_en: "Excel analyzed.",
      source_notes: "Native worksheet rows analyzed.",
      document_analysis: { document_summary: "FF&E schedule", pages: [] },
      layout_references: [],
      visual_analysis: { image_summary_cn: "", image_summary_en: "", detected_text: [], limitations: [] }
    };
    return new Response(
      JSON.stringify({
        id: "office_test",
        steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify(output) }] }]
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const result = await parseIntakeBrief({
    job: { project_name: "Harbour Hotel", destination: "London", quantity_text: "", brief_text: "" },
    file: {
      original_name: "harbour-ffe.xlsx",
      mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    },
    sourceText:
      "WORKSHEET: FF&E Schedule\nROW 4: CH-01 | Lobby Chair | 12 | W 720 x D 760 x H 810 mm\nEMBEDDED IMAGE 3: anchor row=4"
  });

  assert.equal(request.url, "https://gemini.test/v1beta/interactions");
  assert.equal(request.body.input.length, 1);
  assert.match(request.body.input[0].text, /EMBEDDED IMAGE N markers/i);
  assert.equal(result.items[0].quantity, 12);
  assert.equal(result.items[0].image_ref, 3);
});

test("image intake requires manual review when no vision key is configured", async () => {
  process.env.DEEPSEEK_API_KEY = "";
  process.env.GEMINI_API_KEY = "";

  const result = await parseIntakeBrief({
    job: {
      project_name: "Reference Chair",
      destination: "London, UK",
      quantity_text: "",
      brief_text: "Please quote this chair."
    },
    file: { original_name: "chair.webp", mime_type: "image/webp" },
    sourceMedia: {
      mimeType: "image/webp",
      dataBase64: "ZmFrZQ==",
      byteLength: 4
    }
  });

  assert.equal(result.visual_analysis.status, "manual_review_required");
  assert.equal(result.visual_analysis.reason, "vision_not_configured");
  assert.equal(result.items[0].quantity, 0);
  assert.ok(result.questions.some((question) => /must review the uploaded image manually/i.test(question)));
});

test("image intake fails closed to manual review when the vision service errors", async () => {
  process.env.DEEPSEEK_API_KEY = "";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  globalThis.fetch = async () => {
    throw new Error("temporary upstream failure");
  };

  const result = await parseIntakeBrief({
    job: {
      project_name: "Dining Room Reference",
      destination: "Paris, France",
      quantity_text: "18 dining chairs",
      brief_text: "Use this image as reference."
    },
    file: { original_name: "dining-chair.png", mime_type: "image/png" },
    sourceMedia: {
      mimeType: "image/png",
      dataBase64: "ZmFrZQ==",
      byteLength: 4
    }
  });

  assert.equal(result.visual_analysis.status, "manual_review_required");
  assert.equal(result.visual_analysis.reason, "vision_service_error");
  assert.equal(result.items[0].quantity, 18);
});
