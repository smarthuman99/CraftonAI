const DEFAULT_UNIT_PRICE = 0;

const MATERIAL_KEYWORDS = [
  { pattern: /linen|flax|亚麻|亞麻/i, cn: "亚麻（待确认）", en: "Linen (to confirm)" },
  { pattern: /velvet|绒|絨/i, cn: "绒布（待确认）", en: "Velvet (to confirm)" },
  { pattern: /leather|皮革|真皮|仿皮/i, cn: "皮革（待确认）", en: "Leather (to confirm)" },
  { pattern: /silk|丝|絲/i, cn: "丝绸（待确认）", en: "Silk (to confirm)" },
  { pattern: /oak|橡木/i, cn: "橡木（待确认）", en: "Oak (to confirm)" },
  { pattern: /walnut|胡桃/i, cn: "胡桃木（待确认）", en: "Walnut (to confirm)" },
  { pattern: /metal|steel|iron|金属|金屬|钢|鋼/i, cn: "金属件（待确认）", en: "Metal finish (to confirm)" }
];

const FIRE_KEYWORDS = /crib\s*5|bs\s*5852|fire|flame|fr\b|阻燃|防火|防焰/i;
const DIMENSION_PATTERN =
  /\b(?:w|width|宽|寬|d|depth|深|h|height|高|l|length|长|長)\s*[:：]?\s*\d+(?:\.\d+)?\s*(?:mm|cm|m|毫米|厘米|米)?\b/gi;

export async function parseIntakeBrief({ job, file, sourceText = "" }) {
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      return await parseWithDeepSeek({ job, file, sourceText });
    } catch (err) {
      console.warn("AI parse failed, falling back to deterministic parser:", err.message);
    }
  }

  return parseDeterministically({ job, file, sourceText });
}

async function parseWithDeepSeek({ job, file, sourceText }) {
  const schema = intakeResultSchema();
  const systemPrompt = [
    "You are Crafton AI Intake Agent for bespoke contract-furniture manufacturing.",
    "Return strict JSON only. Extract a customer requirements table for Cho to review.",
    "Use conservative assumptions. Do not invent production-critical dimensions, materials, prices, standards, or delivery dates.",
    "If information is missing, leave the field as 'To confirm' and add a focused missing question.",
    "The response must be a JSON object that matches this JSON schema:",
    JSON.stringify(schema)
  ].join("\n");

  const userPrompt = [
    "Parse this intake brief into JSON.",
    "",
    `Project name: ${job.project_name || ""}`,
    `Destination: ${job.destination || ""}`,
    `Quantity text: ${job.quantity_text || ""}`,
    `Brief text: ${job.brief_text || ""}`,
    `Uploaded file name: ${file?.original_name || "none"}`,
    `Uploaded file mime: ${file?.mime_type || "unknown"}`,
    "",
    "Uploaded file text, if available:",
    sourceText || "(no readable file text)"
  ].join("\n");

  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      stream: false
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepSeek parse request failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("DeepSeek response did not include output text.");

  return normalizeResult(JSON.parse(stripJsonFence(text)), { job, file, sourceText });
}

function parseDeterministically({ job, file, sourceText }) {
  const combinedText = joinNonEmpty([job.project_name, job.destination, job.quantity_text, job.brief_text, sourceText]);
  const projectName =
    cleanField(job.project_name) ||
    extractLabelValue(combinedText, ["project", "project name", "项目", "项目名称", "項目", "項目名稱"]) ||
    `CRAFT-${new Date().getFullYear()}-INTAKE`;
  const destination =
    cleanField(job.destination) ||
    extractLabelValue(combinedText, ["destination", "delivery", "ship to", "location", "交付地", "目的地", "地址"]) ||
    "To confirm";

  const segments = extractRequirementSegments({ quantityText: job.quantity_text, briefText: job.brief_text, sourceText });
  const items = segments.length > 0 ? segments.map((segment, idx) => segmentToItem(segment, idx)) : [fallbackItem(job)];
  const questions = buildMissingQuestions({ items, destination, combinedText });
  const summary_en = `Parsed ${items.length} requirement line${items.length === 1 ? "" : "s"} for ${projectName}; pending Cho review.`;
  const summary_cn = `已整理 ${items.length} 条客户需求，项目 ${projectName}，等待 Cho 审核。`;

  return normalizeResult(
    {
      project: {
        name: projectName,
        client_name: "Portal Intake Client",
        destination
      },
      items,
      questions,
      summary_cn,
      summary_en,
      source_notes: buildSourceNotes({ job, file, sourceText })
    },
    { job, file, sourceText }
  );
}

function extractRequirementSegments({ quantityText = "", briefText = "", sourceText = "" }) {
  const candidateTexts = [quantityText, extractLikelyItemLines(sourceText), briefText].filter(Boolean);
  const segments = [];

  for (const text of candidateTexts) {
    for (const rawSegment of splitRequirementText(text)) {
      const quantity = extractQuantity(rawSegment);
      if (!quantity) continue;
      const type = extractItemType(rawSegment, quantity);
      if (!type || isMostlyLabel(type)) continue;
      segments.push({ raw: rawSegment, quantity, type });
    }
  }

  return dedupeSegments(segments);
}

function extractLikelyItemLines(text = "") {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /\d/.test(line) && !/^(project|destination|delivery|client|company)\b/i.test(line))
    .join("\n");
}

function splitRequirementText(text = "") {
  const normalized = String(text).replace(/\t/g, " ");
  const lines = normalized
    .split(/\r?\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  return normalized
    .replace(/\t/g, " ")
    .split(/[,;；，、]+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function dedupeSegments(segments) {
  const seen = new Set();
  const deduped = [];
  for (const segment of segments) {
    const key = `${segment.quantity}|${segment.type.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(segment);
  }
  return deduped.slice(0, 30);
}

function segmentToItem(segment, idx) {
  const material = inferMaterial(segment.raw);
  const dimensions = extractDimensions(segment.raw);
  const fireRequirement = FIRE_KEYWORDS.test(segment.raw);
  const notes = [
    dimensions ? `Dimensions mentioned: ${dimensions}` : "",
    fireRequirement ? "Fire-safety requirement mentioned; standard to verify." : "",
    `Source: ${segment.raw}`
  ].filter(Boolean);

  return {
    item_type_cn: segment.type,
    item_type_en: titleCase(segment.type) || `Custom Item ${idx + 1}`,
    quantity: segment.quantity,
    material_cn: material.cn,
    material_en: material.en,
    original_unit_price: DEFAULT_UNIT_PRICE,
    unit_price: DEFAULT_UNIT_PRICE,
    notes_cn: notes.join(" "),
    notes_en: notes.join(" ")
  };
}

function fallbackItem(job) {
  const quantity = extractQuantity(job.quantity_text) || 1;
  const type = cleanField(job.quantity_text)?.replace(/\d+/g, "").trim() || "Custom bespoke item";
  return {
    item_type_cn: type,
    item_type_en: titleCase(type),
    quantity,
    material_cn: "待确认",
    material_en: "To confirm",
    original_unit_price: DEFAULT_UNIT_PRICE,
    unit_price: DEFAULT_UNIT_PRICE,
    notes_cn: "客户已提交需求，缺少可自动拆分的产品行。",
    notes_en: "Client submitted a brief, but no itemized product lines were detected."
  };
}

function buildMissingQuestions({ items, destination, combinedText }) {
  const questions = [];

  if (!destination || destination === "To confirm") {
    questions.push("Please confirm the delivery destination and receiving address.");
  }

  if (!items.some((item) => /dimension|W:|width|宽|寬|高|深/i.test(`${item.notes_en} ${item.notes_cn}`))) {
    questions.push("Please confirm dimensions for each furniture type, including width, depth, and height.");
  }

  if (items.some((item) => item.material_en === "To confirm")) {
    questions.push("Please confirm final material, fabric code, color, and finish for each item.");
  }

  if (!FIRE_KEYWORDS.test(combinedText)) {
    questions.push("Please confirm whether fire-safety standards such as UK Crib 5 / BS 5852 are required.");
  }

  if (!/delivery date|deadline|lead time|交期|交货|交貨|日期/i.test(combinedText)) {
    questions.push("Please confirm target delivery date or required production lead time.");
  }

  return questions.slice(0, 6);
}

function normalizeResult(result, { job, file, sourceText = "" }) {
  const rawItems = Array.isArray(result.items) && result.items.length > 0 ? result.items : [fallbackItem(job)];
  const items = rawItems.map((item, idx) => normalizeItem(item, idx));
  const total = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
  const projectName = cleanField(result.project?.name) || cleanField(job.project_name) || `CRAFT-${Date.now()}`;
  const destination = cleanField(result.project?.destination) || cleanField(job.destination) || "To confirm";

  return {
    project: {
      name: projectName,
      client_name: cleanField(result.project?.client_name) || "Portal Intake Client",
      destination
    },
    items,
    payments: buildPaymentSchedule(total),
    questions: Array.isArray(result.questions) ? result.questions.filter(Boolean).slice(0, 10) : [],
    summary_cn: cleanField(result.summary_cn) || `已整理客户需求表：${items.length} 条产品行，等待 Cho 审核。`,
    summary_en: cleanField(result.summary_en) || `Customer requirements table prepared with ${items.length} item rows; pending Cho review.`,
    source_notes: cleanField(result.source_notes) || buildSourceNotes({ job, file, sourceText })
  };
}

function normalizeItem(item, idx) {
  const typeEn = cleanField(item.item_type_en) || cleanField(item.typeEn) || `Custom Item ${idx + 1}`;
  const typeCn = cleanField(item.item_type_cn) || cleanField(item.typeCn) || typeEn;
  const material = inferMaterial(`${item.material_en || ""} ${item.material_cn || ""} ${item.notes_en || ""}`);

  return {
    item_type_cn: typeCn,
    item_type_en: typeEn,
    quantity: Math.max(0, Math.round(Number(item.quantity || item.qty || 0))),
    material_cn: cleanField(item.material_cn) || cleanField(item.materialCn) || material.cn,
    material_en: cleanField(item.material_en) || cleanField(item.materialEn) || material.en,
    original_unit_price: nonNegativeMoney(item.original_unit_price ?? item.originalUnitPrice ?? item.unit_price),
    unit_price: nonNegativeMoney(item.unit_price ?? item.unitPrice ?? item.original_unit_price),
    notes_cn: cleanField(item.notes_cn) || cleanField(item.notesCn) || cleanField(item.notes_en) || "",
    notes_en: cleanField(item.notes_en) || cleanField(item.notesEn) || cleanField(item.notes_cn) || ""
  };
}

function buildPaymentSchedule(total) {
  return [
    {
      milestone_cn: "50% 首期定金",
      milestone_en: "50% Deposit",
      amount: roundMoney(total * 0.5),
      status: "Pending",
      payment_date: "Pending"
    },
    {
      milestone_cn: "40% 出货前中款",
      milestone_en: "40% Shipping Release",
      amount: roundMoney(total * 0.4),
      status: "Pending",
      payment_date: "Pending"
    },
    {
      milestone_cn: "10% 交付尾款",
      milestone_en: "10% Handover Balance",
      amount: roundMoney(total * 0.1),
      status: "Pending",
      payment_date: "Pending"
    }
  ];
}

function extractQuantity(text = "") {
  const source = String(text);
  const explicit = source.match(/(?:qty|quantity|数量|數量)\s*[:：]?\s*(\d{1,6})/i);
  if (explicit) return Number(explicit[1]);

  const matches = [...source.matchAll(/\b(\d{1,6})\b/g)];
  for (const match of matches) {
    const number = Number(match[1]);
    const around = source.slice(Math.max(0, match.index - 12), match.index + match[0].length + 12);
    const before = source.slice(Math.max(0, match.index - 12), match.index);
    if (/crib\s*5|bs\s*5852/i.test(around)) continue;
    if (/(?:\bw|\bwidth|宽|寬|\bd|\bdepth|深|\bh|\bheight|高|\bl|\blength|长|長)\s*[:：]?\s*$/i.test(before)) {
      continue;
    }
    return number;
  }
  return null;
}

function extractItemType(segment, quantity) {
  let text = String(segment)
    .replace(new RegExp(`\\b${quantity}\\b\\s*(?:pcs?|pieces?|sets?|units?|把|张|張|件|套|个|個|只|條|条)?`, "i"), "")
    .replace(/(?:qty|quantity|数量|數量)\s*[:：]?\s*/i, "")
    .replace(/(?:item|product|type|品名|产品|產品)\s*[:：]?\s*/i, "")
    .replace(DIMENSION_PATTERN, "")
    .replace(/\b(?:material|fabric|finish|color|colour)\s*[:：][^,;；，、]+/gi, "")
    .trim();

  text = text.replace(/^[-:：|]+|[-:：|]+$/g, "").trim();
  text = text.replace(/,+/g, " ").replace(/\s+/g, " ").trim();
  return text.slice(0, 120);
}

function inferMaterial(text = "") {
  const source = String(text);
  for (const material of MATERIAL_KEYWORDS) {
    if (material.pattern.test(source)) return { cn: material.cn, en: material.en };
  }
  return { cn: "待确认", en: "To confirm" };
}

function extractDimensions(text = "") {
  const matches = String(text).match(DIMENSION_PATTERN);
  return matches ? matches.join(", ") : "";
}

function extractLabelValue(text = "", labels = []) {
  for (const label of labels) {
    const escaped = escapeRegExp(label);
    const match = String(text).match(new RegExp(`${escaped}\\s*[:：-]\\s*([^\\n;,；，]+)`, "i"));
    if (match?.[1]) return cleanField(match[1]);
  }
  return "";
}

function buildSourceNotes({ job, file, sourceText }) {
  return joinNonEmpty([
    job.brief_text,
    job.quantity_text ? `Quantity text: ${job.quantity_text}` : "",
    file?.original_name ? `Uploaded file: ${file.original_name}` : "",
    sourceText ? `Readable upload excerpt: ${sourceText.slice(0, 800)}` : ""
  ]);
}

function cleanField(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function joinNonEmpty(values) {
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join("\n");
}

function isMostlyLabel(value) {
  return /^(qty|quantity|item|product|数量|數量|品名)$/i.test(cleanField(value));
}

function titleCase(value = "") {
  const text = cleanField(value);
  if (!text) return "Custom Item";
  if (/[\u3400-\u9fff]/.test(text)) return text;
  return text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function nonNegativeMoney(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? roundMoney(number) : 0;
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripJsonFence(text) {
  return String(text)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function intakeResultSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["project", "items", "questions", "summary_cn", "summary_en", "source_notes"],
    properties: {
      project: {
        type: "object",
        additionalProperties: false,
        required: ["name", "client_name", "destination"],
        properties: {
          name: { type: "string" },
          client_name: { type: "string" },
          destination: { type: "string" }
        }
      },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "item_type_cn",
            "item_type_en",
            "quantity",
            "material_cn",
            "material_en",
            "original_unit_price",
            "unit_price",
            "notes_cn",
            "notes_en"
          ],
          properties: {
            item_type_cn: { type: "string" },
            item_type_en: { type: "string" },
            quantity: { type: "integer" },
            material_cn: { type: "string" },
            material_en: { type: "string" },
            original_unit_price: { type: "number" },
            unit_price: { type: "number" },
            notes_cn: { type: "string" },
            notes_en: { type: "string" }
          }
        }
      },
      questions: { type: "array", items: { type: "string" } },
      summary_cn: { type: "string" },
      summary_en: { type: "string" },
      source_notes: { type: "string" }
    }
  };
}
