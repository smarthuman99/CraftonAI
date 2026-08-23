const CHECKPOINT_SCHEMA_VERSION = "pdf_batch_checkpoint_v2";
const CHECKPOINT_PROCESSING_VERSION = 2;

export function createPageBatches(totalPages, batchSize = 4, completedPages = []) {
  const total = Math.max(0, Math.trunc(Number(totalPages || 0)));
  const size = Math.max(1, Math.trunc(Number(batchSize || 4)));
  const completed = new Set((completedPages || []).map(Number));
  const batches = [];

  for (let page = 1; page <= total; page += size) {
    const pages = Array.from({ length: Math.min(size, total - page + 1) }, (_, index) => page + index);
    if (!pages.every((number) => completed.has(number))) batches.push(pages);
  }
  return batches;
}

export function readPdfCheckpoint(resultJson, { totalPages, fingerprint = "" } = {}) {
  const processing = resultJson?.processing;
  if (resultJson?.schema_version !== CHECKPOINT_SCHEMA_VERSION || processing?.version !== CHECKPOINT_PROCESSING_VERSION)
    return null;
  if (Number(totalPages || 0) && Number(processing.total_pages || 0) !== Number(totalPages)) return null;
  if (fingerprint && processing.fingerprint && processing.fingerprint !== fingerprint) return null;

  return {
    completedPages: uniqueNumbers(processing.completed_pages),
    batches: Array.isArray(processing.batches) ? processing.batches : []
  };
}

export function buildPdfCheckpoint({
  totalPages,
  batchSize,
  fingerprint,
  completedPages,
  batches,
  currentPages = [],
  state = "processing",
  error = ""
}) {
  return {
    schema_version: CHECKPOINT_SCHEMA_VERSION,
    processing: {
      version: CHECKPOINT_PROCESSING_VERSION,
      source_type: "pdf",
      state,
      total_pages: Math.max(0, Number(totalPages || 0)),
      batch_size: Math.max(1, Number(batchSize || 1)),
      fingerprint: String(fingerprint || ""),
      completed_pages: uniqueNumbers(completedPages),
      current_pages: uniqueNumbers(currentPages),
      batches: Array.isArray(batches) ? batches : [],
      error: String(error || ""),
      updated_at: new Date().toISOString()
    }
  };
}

export function bindBatchSourcePages(result, pages = []) {
  const allowedPages = uniqueNumbers(pages);
  if (!allowedPages.length) return result;

  return {
    ...result,
    items: (result.items || []).map((item, index) => {
      const sourcePage = Number(item.source_page || 0);
      return {
        ...item,
        source_page: allowedPages.includes(sourcePage)
          ? sourcePage
          : allowedPages[Math.min(index, allowedPages.length - 1)]
      };
    })
  };
}

export function findMissingVisualCoveragePages({ result = {}, visualFallbackPages = [], images = [] } = {}) {
  const pagesWithProductImages = new Set(uniqueNumbers((images || []).map((image) => image?.page)));
  const coveredPages = new Set(
    uniqueNumbers((result.items || []).filter((item) => !isPlaceholderItem(item)).map((item) => item?.source_page))
  );

  return uniqueNumbers(visualFallbackPages).filter(
    (page) => pagesWithProductImages.has(page) && !coveredPages.has(page)
  );
}

export function mergeIntakeBatchResults({ job = {}, file = {}, batchEntries = [], totalPages = 0 }) {
  const orderedEntries = [...batchEntries].sort(
    (left, right) => Number(left.pages?.[0] || 0) - Number(right.pages?.[0] || 0)
  );
  const results = orderedEntries.map((entry) => entry.result).filter(Boolean);
  const items = dedupeItems(results.flatMap((result) => result.items || []));
  const projectName =
    firstUseful([job.project_name, ...results.map((result) => result.project?.name)], {
      rejectGeneratedProjectName: true
    }) || `CRAFT-${new Date().getFullYear()}-INTAKE`;
  const destination =
    firstUseful([job.destination, ...results.map((result) => result.project?.destination)]) || "To confirm";
  const clientName = firstUseful(results.map((result) => result.project?.client_name)) || "Portal Intake Client";
  let questions = uniqueStrings(results.flatMap((result) => result.questions || []));

  if (items.some((item) => !item.dimensions_text || isToConfirm(item.dimensions_text))) {
    questions.push("Please confirm the missing dimensions for the furniture lines marked To confirm.");
  }
  if (items.some((item) => Number(item.quantity || 0) <= 0)) {
    questions.push("Please confirm the missing quantities for the furniture lines marked To confirm.");
  }

  const total = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || item.original_unit_price || 0),
    0
  );
  const completedPages = uniqueNumbers(orderedEntries.flatMap((entry) => entry.pages || []));
  const failedVisualPages = uniqueNumbers(
    orderedEntries
      .filter((entry) => entry.result?.visual_analysis?.status === "manual_review_required")
      .flatMap((entry) => entry.pages || [])
  );
  const extractionNeedsManualReview = items.length === 0 || failedVisualPages.length > 0;
  if (items.length === 0) {
    questions = [
      "Automated PDF extraction produced no furniture lines. Crafton must review the source PDF or retry the visual worker before requesting client clarification."
    ];
  } else if (failedVisualPages.length) {
    questions = uniqueStrings([
      `Crafton must retry or manually review PDF page(s) ${failedVisualPages.join(", ")} because visual extraction did not complete.`,
      ...questions
    ]);
  }

  return {
    project: { name: projectName, client_name: clientName, destination },
    items,
    payments: buildPaymentSchedule(total),
    questions: uniqueStrings(questions).slice(0, 30),
    summary_cn: extractionNeedsManualReview
      ? `已读取 ${completedPages.length}/${Number(totalPages || completedPages.length)} 页，但视觉提取未完整通过质量检查，需 Crafton 重试或人工核对。`
      : `已分批读取 ${completedPages.length}/${Number(totalPages || completedPages.length)} 页，并整理 ${items.length} 条家具需求，等待 Cho 审核。`,
    summary_en: extractionNeedsManualReview
      ? `Processed ${completedPages.length}/${Number(totalPages || completedPages.length)} PDF pages, but visual extraction did not pass the completeness gate. Crafton must retry or review the source.`
      : `Processed ${completedPages.length}/${Number(totalPages || completedPages.length)} PDF pages in batches and prepared ${items.length} furniture lines for Cho review.`,
    source_notes: [
      file.original_name ? `Uploaded file: ${file.original_name}` : "",
      `PDF batch extraction: ${orderedEntries.length} batches, ${completedPages.length} pages.`,
      ...results.map((result) => result.source_notes).filter(Boolean)
    ]
      .filter(Boolean)
      .join("\n"),
    visual_analysis: extractionNeedsManualReview
      ? {
          status: "manual_review_required",
          reason: items.length === 0 ? "no_furniture_lines_extracted" : "pdf_visual_batch_failed",
          page_numbers: failedVisualPages
        }
      : null,
    processing: {
      version: CHECKPOINT_PROCESSING_VERSION,
      source_type: "pdf",
      state: extractionNeedsManualReview ? "manual_review_required" : "completed",
      total_pages: Number(totalPages || completedPages.length),
      completed_pages: completedPages,
      batch_count: orderedEntries.length,
      item_count: items.length,
      failed_visual_pages: failedVisualPages,
      quality_gate_passed: !extractionNeedsManualReview,
      completed_at: new Date().toISOString()
    }
  };
}

function dedupeItems(items) {
  const seen = new Set();
  return (items || [])
    .filter((item) => !isPlaceholderItem(item))
    .filter((item) => {
      const key = [
        Number(item.source_page || 0),
        normalizeKey(item.item_type_en || item.item_type_cn),
        Number(item.quantity || 0),
        normalizeKey(item.dimensions_text),
        normalizeKey(item.material_en || item.material_cn)
      ].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => Number(left.source_page || 0) - Number(right.source_page || 0));
}

function isPlaceholderItem(item = {}) {
  const type = normalizeKey(item.item_type_en || item.item_type_cn);
  return (
    /^(custom item|custom bespoke item|to confirm|unknown)/.test(type) &&
    Number(item.quantity || 0) <= 1 &&
    isToConfirm(item.dimensions_text) &&
    isToConfirm(item.material_en || item.material_cn)
  );
}

function firstUseful(values, { rejectGeneratedProjectName = false } = {}) {
  for (const value of values || []) {
    const text = String(value || "").trim();
    if (!text || isToConfirm(text)) continue;
    if (rejectGeneratedProjectName && /^craft-(?:\d{4}-(?:intake|\d+)|\d{10,})/i.test(text)) continue;
    return text;
  }
  return "";
}

function isToConfirm(value) {
  return /^(?:to confirm|pending|unknown|n\/a|待确认|待確認)?$/i.test(String(value || "").trim());
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, " ")
    .trim();
}

function uniqueStrings(values) {
  const seen = new Set();
  const output = [];
  for (const value of values || []) {
    const text = String(value || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }
  return output;
}

function uniqueNumbers(values) {
  return [...new Set((values || []).map(Number).filter((value) => Number.isInteger(value) && value > 0))].sort(
    (left, right) => left - right
  );
}

function buildPaymentSchedule(total) {
  const amount = Math.max(0, Number(total || 0));
  return [
    {
      milestone_cn: "50% 首期定金",
      milestone_en: "50% Deposit",
      amount: roundMoney(amount * 0.5),
      status: "Pending",
      payment_date: "Pending"
    },
    {
      milestone_cn: "40% 出货前中款",
      milestone_en: "40% Shipping Release",
      amount: roundMoney(amount * 0.4),
      status: "Pending",
      payment_date: "Pending"
    },
    {
      milestone_cn: "10% 交付尾款",
      milestone_en: "10% Handover Balance",
      amount: roundMoney(amount * 0.1),
      status: "Pending",
      payment_date: "Pending"
    }
  ];
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}
