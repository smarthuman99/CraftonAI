import { createHash } from "node:crypto";
import sharp from "sharp";

import { createSupabaseAdmin } from "./lib/supabaseAdmin.mjs";
import { parseIntakeBrief } from "./lib/intakeProcessor.mjs";
import { prepareInitialClientCompletion } from "./lib/intakeClientCompletion.mjs";
import { bindIntakeResultToOwner } from "./lib/intakeOwnership.mjs";
import { extractIntakeSource, getIntakeSourceKind, openPdfBatchReader } from "./lib/intakeSourceReader.mjs";
import {
  bindBatchSourcePages,
  buildPdfCheckpoint,
  createPageBatches,
  findMissingVisualCoveragePages,
  mergeIntakeBatchResults,
  readPdfCheckpoint
} from "./lib/intakeBatchProcessor.mjs";
import { isJobAutomationActive } from "./lib/projectLifecycle.mjs";

const supabase = createSupabaseAdmin();
const intervalMs = Number(process.env.INTAKE_WORKER_INTERVAL_MS || 8000);
const batchSize = Number(process.env.INTAKE_WORKER_BATCH_SIZE || 1);
const maxAttempts = Number(process.env.INTAKE_WORKER_MAX_ATTEMPTS || 3);
const maxReadableFileChars = Number(process.env.INTAKE_WORKER_MAX_FILE_TEXT_CHARS || 60000);
const maxVisionFileBytes = Number(process.env.INTAKE_VISION_MAX_FILE_BYTES || 12 * 1024 * 1024);
const maxGeminiPdfInlineBytes = Number(process.env.INTAKE_GEMINI_PDF_INLINE_MAX_BYTES || 48 * 1024 * 1024);
const maxDocumentFileBytes = Number(process.env.INTAKE_DOCUMENT_MAX_FILE_BYTES || 250 * 1024 * 1024);
const pdfBatchSize = Number(process.env.INTAKE_PDF_BATCH_PAGES || 4);
const pdfBatchRetries = Number(process.env.INTAKE_PDF_BATCH_RETRIES || 2);
const pdfVisualFallbackMinTextCharsPerPage = Number(
  process.env.INTAKE_PDF_VISUAL_FALLBACK_MIN_TEXT_CHARS_PER_PAGE || 80
);
const pdfVisualFallbackRenderWidth = Number(process.env.INTAKE_PDF_VISUAL_FALLBACK_RENDER_WIDTH || 1400);
const staleJobMinutes = Number(process.env.INTAKE_WORKER_STALE_MINUTES || 30);
const runOnce = process.argv.includes("--once");

async function claimQueuedJobs() {
  const { data: queuedJobs, error } = await supabase
    .from("intake_jobs")
    .select("*, intake_files(*), projects(*)")
    .eq("status", "queued")
    .lt("attempts", maxAttempts)
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (error) throw error;
  let jobs = queuedJobs || [];
  if (jobs.length < batchSize) {
    const staleBefore = new Date(Date.now() - staleJobMinutes * 60 * 1000).toISOString();
    const { data: staleJobs, error: staleError } = await supabase
      .from("intake_jobs")
      .select("*, intake_files(*), projects(*)")
      .eq("status", "processing")
      .lt("attempts", maxAttempts)
      .lt("updated_at", staleBefore)
      .order("updated_at", { ascending: true })
      .limit(batchSize - jobs.length);
    if (staleError) throw staleError;
    jobs = [...jobs, ...(staleJobs || [])];
  }
  jobs = jobs.filter(isJobAutomationActive);
  if (!jobs.length) return [];

  const claimed = [];
  for (const job of jobs) {
    const { data, error: updateError } = await supabase
      .from("intake_jobs")
      .update({
        status: "processing",
        attempts: Number(job.attempts || 0) + 1,
        locked_at: new Date().toISOString(),
        started_at: job.started_at || new Date().toISOString(),
        error_message: null
      })
      .eq("id", job.id)
      .eq("status", job.status)
      .select("*, intake_files(*), projects(*)")
      .single();

    if (!updateError && data) claimed.push(data);
  }

  return claimed;
}

async function processJob(job) {
  const file = Array.isArray(job.intake_files) ? job.intake_files[0] : job.intake_files;
  const userId = getJobUserId(job);
  await addWorkflowEvent({
    projectId: job.project_id,
    jobId: job.id,
    userId,
    eventType: "intake_started",
    messageCn: "Intake Worker 已领取客户资料解析任务。",
    messageEn: "Intake Worker claimed the client material parsing job."
  });

  let result;
  if (getIntakeSourceKind(file) === "pdf") {
    result = await parsePdfWithGeminiDocument({ job, file, userId });
  } else {
    const { sourceText, sourceMedia, extractedImages, mediaIssue } = await readUploadedSource(file);
    result = await parseIntakeBrief({ job, file, sourceText, sourceMedia, mediaIssue });
    result = await attachExtractedProductImages({ job, result, images: extractedImages, userId });
    if (sourceMedia?.pages) {
      result = await attachRenderedItemCrops({
        job,
        result,
        userId,
        getRenderedPage: async (pageNumber) =>
          sourceMedia.pages.find((page) => Number(page.pageNumber) === Number(pageNumber)) || null
      });
    }
  }
  result = await bindResultToOwnerProfile(result, userId);
  const completedAt = new Date().toISOString();
  const clientCompletion = prepareInitialClientCompletion({
    result,
    jobId: job.id,
    createdAt: completedAt
  });
  result = clientCompletion.result;
  const project = await upsertProject(job, result);
  const ownerUserId = project.user_id || userId;

  await replaceDraftSpecs(project.id, ownerUserId, result.items);
  await replaceDraftPayments(project.id, ownerUserId, result.payments);

  await supabase.from("agent_logs").insert({
    project_id: project.id,
    user_id: ownerUserId,
    operator: "Intake Worker",
    action_desc_cn: result.summary_cn,
    action_desc_en: result.summary_en
  });

  await supabase.from("workflow_events").insert({
    project_id: project.id,
    user_id: ownerUserId,
    job_id: job.id,
    stage_id: "S01",
    event_type: "intake_completed",
    actor: "intake-worker",
    message_cn: result.summary_cn,
    message_en: result.summary_en,
    payload: result
  });

  if (file?.id) {
    await supabase.from("intake_files").update({ project_id: project.id, user_id: ownerUserId }).eq("id", file.id);
  }

  await supabase
    .from("intake_jobs")
    .update({
      status: "needs_review",
      step: clientCompletion.jobState.step,
      review_status: clientCompletion.jobState.reviewStatus,
      review_notes: clientCompletion.jobState.reviewNotes,
      project_id: project.id,
      user_id: ownerUserId,
      result_json: result,
      completed_at: completedAt
    })
    .eq("id", job.id);

  console.log(`Processed intake job ${job.id} -> project ${project.name}`);
}

async function parsePdfWithGeminiDocument({ job, file, userId }) {
  const fileSize = Number(file?.file_size || 0);
  if (fileSize > maxDocumentFileBytes) {
    throw new Error(`PDF exceeds the configured ${Math.round(maxDocumentFileBytes / 1024 / 1024)}MB processing limit.`);
  }
  if (!file?.storage_bucket || !file?.storage_path) throw new Error("PDF storage location is missing.");

  const { data, error } = await supabase.storage.from(file.storage_bucket).download(file.storage_path);
  if (error) throw error;
  const buffer = Buffer.from(await data.arrayBuffer());
  const reader = await openPdfBatchReader({
    buffer,
    maxTextChars: maxReadableFileChars,
    maxVisionBytes: maxVisionFileBytes,
    visualFallbackRenderWidth: pdfVisualFallbackRenderWidth
  });

  try {
    const pages = Array.from({ length: reader.totalPages }, (_, index) => index + 1);
    const source = await reader.readPages(pages, { visualMode: "none", includeImages: false });
    let sourceMedia = null;
    let mediaIssue = "";

    if (buffer.byteLength <= maxGeminiPdfInlineBytes) {
      sourceMedia = {
        sourceKind: "pdf_document",
        mimeType: "application/pdf",
        dataBase64: buffer.toString("base64"),
        byteLength: buffer.byteLength,
        pageNumbers: pages
      };
    } else {
      sourceMedia = await reader.renderPages(pages, {
        desiredWidth: pdfVisualFallbackRenderWidth,
        maxBytes: maxVisionFileBytes,
        sourceKind: "pdf_pages"
      });
      if (!sourceMedia) mediaIssue = "pdf_whole_document_exceeds_gemini_inline_limit";
    }

    let result = await parseIntakeBrief({
      job: {
        ...job,
        brief_text: [
          job.brief_text,
          `Analyze this complete ${reader.totalPages}-page FF&E document as one package. Classify every page before extracting furniture.`
        ]
          .filter(Boolean)
          .join("\n")
      },
      file,
      sourceText: source.sourceText,
      sourceMedia,
      mediaIssue
    });

    const classifiedPages = new Set(
      (result.document_analysis?.pages || []).map((page) => Number(page.source_page)).filter(Boolean)
    );
    const unclassifiedPages = pages.filter((page) => !classifiedPages.has(page));
    if (unclassifiedPages.length || !result.items?.length) {
      const reason = unclassifiedPages.length
        ? `Gemini did not classify PDF page(s) ${unclassifiedPages.join(", ")}.`
        : "Gemini produced no verified furniture lines.";
      result = {
        ...result,
        questions: uniqueText([
          ...(result.questions || []),
          `Crafton must review the source document because ${reason}`
        ]),
        visual_analysis: result.visual_analysis
          ? {
              ...result.visual_analysis,
              limitations: uniqueText([...(result.visual_analysis.limitations || []), reason])
            }
          : result.visual_analysis,
        quality_gate: {
          ...(result.quality_gate || {}),
          status: "manual_review_required",
          unclassified_pages: unclassifiedPages
        }
      };
    }

    result = await attachRenderedItemCrops({
      job,
      result,
      userId,
      getRenderedPage: async (pageNumber) => {
        const rendered = await reader.renderPages([pageNumber], {
          desiredWidth: pdfVisualFallbackRenderWidth,
          maxBytes: maxVisionFileBytes,
          sourceKind: "pdf_pages"
        });
        return rendered?.pages?.[0] || null;
      }
    });

    const qualityPassed =
      Boolean(sourceMedia) &&
      !mediaIssue &&
      Boolean(result.items?.length) &&
      result.quality_gate?.status !== "manual_review_required";
    return {
      ...result,
      processing: {
        version: 3,
        source_type: "pdf",
        mode: "gemini_whole_document",
        state: qualityPassed ? "completed" : "manual_review_required",
        total_pages: reader.totalPages,
        completed_pages: pages,
        batch_count: 1,
        item_count: result.items?.length || 0,
        quality_gate_passed: qualityPassed,
        completed_at: new Date().toISOString()
      }
    };
  } finally {
    await reader.destroy();
  }
}

function uniqueText(values) {
  return [
    ...new Map(
      (values || [])
        .map((value) =>
          String(value || "")
            .replace(/\s+/g, " ")
            .trim()
        )
        .filter(Boolean)
        .map((value) => [value.toLowerCase(), value])
    ).values()
  ];
}

async function parsePdfInBatches({ job, file, userId }) {
  const fileSize = Number(file?.file_size || 0);
  if (fileSize > maxDocumentFileBytes) {
    throw new Error(`PDF exceeds the configured ${Math.round(maxDocumentFileBytes / 1024 / 1024)}MB processing limit.`);
  }
  if (!file?.storage_bucket || !file?.storage_path) throw new Error("PDF storage location is missing.");

  const { data: signed, error: signedError } = await supabase.storage
    .from(file.storage_bucket)
    .createSignedUrl(file.storage_path, 4 * 60 * 60);
  if (signedError || !signed?.signedUrl) throw signedError || new Error("Could not create a signed PDF URL.");

  const reader = await openPdfBatchReader({
    url: signed.signedUrl,
    maxTextChars: maxReadableFileChars,
    maxVisionBytes: maxVisionFileBytes,
    visualFallbackMinTextCharsPerPage: pdfVisualFallbackMinTextCharsPerPage,
    visualFallbackRenderWidth: pdfVisualFallbackRenderWidth
  });
  const fingerprint = reader.fingerprints[0] || `${file.storage_path}:${file.file_size || 0}`;
  const previous = readPdfCheckpoint(job.result_json, { totalPages: reader.totalPages, fingerprint });
  const completedPages = new Set(previous?.completedPages || []);
  const batchEntries = [...(previous?.batches || [])];

  try {
    const pendingBatches = createPageBatches(reader.totalPages, pdfBatchSize, [...completedPages]);
    for (const pages of pendingBatches) {
      const result = await retryPdfBatch(async () => {
        const source = await reader.readPages(pages);
        const batchJob = {
          ...job,
          brief_text: [
            job.brief_text,
            `PDF batch pages: ${pages.join(", ")}. Extract only furniture rows whose SOURCE PAGE is in this batch.`
          ]
            .filter(Boolean)
            .join("\n")
        };
        let parsed = await parseIntakeBrief({
          job: batchJob,
          file,
          sourceText: source.sourceText,
          sourceMedia: source.sourceMedia,
          mediaIssue: source.mediaIssue
        });
        parsed = bindBatchSourcePages(parsed, pages);
        parsed = await retryMissingPdfVisualCoverage({
          reader,
          job: batchJob,
          file,
          pages,
          source,
          parsed
        });
        return attachExtractedProductImages({ job, result: parsed, images: source.images, userId });
      }, pdfBatchRetries);

      for (const page of pages) completedPages.add(page);
      const existingIndex = batchEntries.findIndex((entry) => Number(entry.pages?.[0]) === Number(pages[0]));
      const entry = { pages, result, completed_at: new Date().toISOString() };
      if (existingIndex >= 0) batchEntries[existingIndex] = entry;
      else batchEntries.push(entry);

      await savePdfCheckpoint(job.id, {
        totalPages: reader.totalPages,
        batchSize: pdfBatchSize,
        fingerprint,
        completedPages: [...completedPages],
        batches: batchEntries,
        currentPages: pages
      });
      console.log(
        `Intake job ${job.id}: parsed PDF pages ${pages.join(", ")} (${completedPages.size}/${reader.totalPages})`
      );
    }

    return mergeIntakeBatchResults({ job, file, batchEntries, totalPages: reader.totalPages });
  } finally {
    await reader.destroy();
  }
}

async function retryMissingPdfVisualCoverage({ reader, job, file, pages, source, parsed }) {
  const missingPages = findMissingVisualCoveragePages({
    result: parsed,
    visualFallbackPages: source.visualFallbackPages,
    images: source.images
  });
  if (!missingPages.length) return parsed;

  const recovered = [];
  const questions = [...(parsed.questions || [])];
  const notes = [parsed.source_notes];
  const failedPages = [];

  for (const page of missingPages) {
    const pageSource = await reader.readPages([page]);
    const pageJob = {
      ...job,
      brief_text: [
        job.brief_text,
        `PDF completeness retry for SOURCE PAGE ${page}. Read the page at its actual text orientation and extract every printed furniture field. Return only the furniture line on this page.`
      ]
        .filter(Boolean)
        .join("\n")
    };
    let pageResult = await parseIntakeBrief({
      job: pageJob,
      file,
      sourceText: pageSource.sourceText,
      sourceMedia: pageSource.sourceMedia,
      mediaIssue: pageSource.mediaIssue
    });
    pageResult = bindBatchSourcePages(pageResult, [page]);

    const stillMissing = findMissingVisualCoveragePages({
      result: pageResult,
      visualFallbackPages: [page],
      images: pageSource.images
    });
    if (stillMissing.length || pageResult.visual_analysis?.status === "manual_review_required") {
      failedPages.push(page);
      continue;
    }

    recovered.push(...(pageResult.items || []));
    questions.push(...(pageResult.questions || []));
    notes.push(`Recovered missing PDF SOURCE PAGE ${page} through single-page visual retry.`, pageResult.source_notes);
  }

  const uniqueQuestions = [
    ...new Map(questions.filter(Boolean).map((question) => [String(question).trim().toLowerCase(), question])).values()
  ];
  return {
    ...parsed,
    items: [...(parsed.items || []), ...recovered],
    questions: uniqueQuestions,
    source_notes: notes.filter(Boolean).join("\n"),
    visual_analysis: failedPages.length
      ? {
          ...(parsed.visual_analysis || {}),
          status: "manual_review_required",
          reason: "pdf_visual_page_coverage_missing",
          page_numbers: failedPages
        }
      : parsed.visual_analysis
  };
}

async function retryPdfBatch(task, retryCount) {
  let lastError;
  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < retryCount) await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function savePdfCheckpoint(jobId, checkpoint) {
  const { error } = await supabase
    .from("intake_jobs")
    .update({
      status: "processing",
      result_json: buildPdfCheckpoint(checkpoint),
      locked_at: new Date().toISOString()
    })
    .eq("id", jobId);
  if (error) throw error;
}

async function upsertProject(job, result) {
  const projectName = result.project.name || job.project_name || `CRAFT-${Date.now()}`;
  const userId = getJobUserId(job);

  if (job.project_id) {
    let projectQuery = supabase.from("projects").select("*").eq("id", job.project_id).limit(1);
    projectQuery = userId ? projectQuery.eq("user_id", userId) : projectQuery.is("user_id", null);
    const { data: projectById, error: projectByIdError } = await projectQuery;
    if (projectByIdError) throw projectByIdError;
    if (projectById?.[0]) {
      const { data: updated, error: updateError } = await supabase
        .from("projects")
        .update({
          name: isGeneratedIntakeProjectName(projectName) ? projectById[0].name : projectName,
          client_name: result.project.client_name || projectById[0].client_name,
          client_contact: result.project.destination || projectById[0].client_contact
        })
        .eq("id", projectById[0].id)
        .select()
        .single();
      if (updateError) throw updateError;
      return updated;
    }
  }

  let existingQuery = supabase.from("projects").select("*").eq("name", projectName).limit(1);

  existingQuery = userId ? existingQuery.eq("user_id", userId) : existingQuery.is("user_id", null);

  const { data: existing, error: existingError } = await existingQuery;

  if (existingError) throw existingError;
  if (existing && existing[0]) return existing[0];

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: projectName,
      client_name: result.project.client_name,
      client_contact: result.project.destination,
      current_stage: 1,
      selected_fabric: "FAB-02",
      selected_leg: "matte-black",
      fabric_compatibility_test: null,
      is_crib5_blocked: false,
      selected_supplier: null,
      split_delivery_active: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

function isGeneratedIntakeProjectName(value) {
  return /^craft-(?:\d{4}-(?:intake|\d+)|\d{10,})/i.test(String(value || "").trim());
}

async function replaceDraftSpecs(projectId, userId, items) {
  await supabase.from("specifications").delete().eq("project_id", projectId);

  const rows = items.map((item) => ({
    project_id: projectId,
    user_id: userId,
    item_type_cn: item.item_type_cn,
    item_type_en: item.item_type_en,
    quantity: Number(item.quantity || 0),
    material_cn: item.material_cn,
    material_en: item.material_en,
    original_unit_price: Number(item.original_unit_price || item.unit_price || 0),
    unit_price: Number(item.unit_price || item.original_unit_price || 0),
    notes_cn: item.notes_cn || "",
    notes_en: item.notes_en || ""
  }));

  const { error } = await supabase.from("specifications").insert(rows);
  if (error) throw error;
}

async function replaceDraftPayments(projectId, userId, payments) {
  await supabase.from("payments").delete().eq("project_id", projectId);

  const rows = payments.map((payment) => ({
    project_id: projectId,
    user_id: userId,
    milestone_cn: payment.milestone_cn,
    milestone_en: payment.milestone_en,
    amount: Number(payment.amount || 0),
    status: payment.status || "Pending",
    payment_date: payment.payment_date || "Pending"
  }));

  const { error } = await supabase.from("payments").insert(rows);
  if (error) throw error;
}

async function addWorkflowEvent({ projectId, jobId, userId, eventType, messageCn, messageEn }) {
  await supabase.from("workflow_events").insert({
    project_id: projectId,
    job_id: jobId,
    user_id: userId,
    stage_id: "S01",
    event_type: eventType,
    actor: "intake-worker",
    message_cn: messageCn,
    message_en: messageEn
  });
}

async function readUploadedSource(file) {
  const sourceKind = getIntakeSourceKind(file);
  const empty = { sourceText: "", sourceMedia: null, mediaIssue: "", sourceKind };
  if (!file?.storage_bucket || !file?.storage_path) return empty;
  if (sourceKind === "unsupported") return { ...empty, mediaIssue: "unsupported_source_format" };
  if (sourceKind === "image" && Number(file.file_size || 0) > maxVisionFileBytes) {
    return { ...empty, mediaIssue: "image_exceeds_inline_limit" };
  }
  if (sourceKind !== "image" && Number(file.file_size || 0) > maxDocumentFileBytes) {
    return { ...empty, mediaIssue: "document_exceeds_parse_limit" };
  }

  const { data, error } = await supabase.storage.from(file.storage_bucket).download(file.storage_path);
  if (error) {
    console.warn(`Could not download intake file ${file.id || file.storage_path}:`, error.message || error);
    return { ...empty, mediaIssue: sourceKind === "image" ? "image_download_failed" : "document_download_failed" };
  }

  try {
    const buffer = Buffer.from(await data.arrayBuffer());
    return await extractIntakeSource({
      file,
      buffer,
      maxTextChars: maxReadableFileChars,
      maxVisionBytes: maxVisionFileBytes,
      maxDocumentBytes: maxDocumentFileBytes,
      includeOfficeVisual: Boolean(process.env.GEMINI_API_KEY)
    });
  } catch (err) {
    console.warn(`Could not read intake file ${file.id || file.storage_path}:`, err.message || err);
    return { ...empty, mediaIssue: sourceKind === "image" ? "image_read_failed" : "document_parse_failed" };
  }
}

async function attachExtractedProductImages({ job, result, images = [], userId }) {
  if (!images.length || !Array.isArray(result.items) || !result.items.length) return result;

  const imagesByPage = images.reduce((map, image) => {
    const page = Number(image.page || 0);
    const existing = map.get(page) || [];
    existing.push(image);
    map.set(page, existing);
    return map;
  }, new Map());
  const uploadedItems = [];
  let uploadedImageCount = 0;

  for (const [index, item] of result.items.entries()) {
    if (item.image_storage_path) {
      uploadedItems.push(item);
      continue;
    }
    const imageRef = Math.max(0, Number(item.image_ref || 0));
    if (!imageRef) {
      uploadedItems.push(item);
      continue;
    }
    const sourcePage = Math.max(1, Number(item.source_page || index + 1));
    const primaryImage = imagesByPage.get(imageRef)?.[0];
    const relatedImages = primaryImage?.sourceRow
      ? images.filter(
          (image) =>
            image.sourceRow === primaryImage.sourceRow &&
            (!primaryImage.worksheet || image.worksheet === primaryImage.worksheet)
        )
      : imagesByPage.get(imageRef) || [primaryImage];
    const candidates = relatedImages.filter((image) => image?.data).slice(0, 4);
    if (!candidates.length) {
      uploadedItems.push(item);
      continue;
    }

    const savedReferences = [];
    for (const [imageIndex, image] of candidates.entries()) {
      const extension = imageFileExtension(image.mimeType);
      const storagePath = `${userId || "unowned"}/derived/${job.id}/source-image-${String(imageRef).padStart(4, "0")}-${String(imageIndex + 1).padStart(2, "0")}.${extension}`;
      const { error } = await supabase.storage.from("intake-files").upload(storagePath, image.data, {
        contentType: image.mimeType || "image/png",
        cacheControl: "3600",
        upsert: true
      });

      if (error) {
        console.warn(`Could not save extracted product image for intake job ${job.id}:`, error.message || error);
        continue;
      }
      uploadedImageCount += 1;
      savedReferences.push({
        storage_bucket: "intake-files",
        storage_path: storagePath,
        mime_type: image.mimeType || "image/png",
        width: Number(image.width || 0),
        height: Number(image.height || 0)
      });
    }

    const primaryReference = savedReferences[0];
    if (!primaryReference) {
      uploadedItems.push(item);
      continue;
    }
    uploadedItems.push({
      ...item,
      source_page: sourcePage,
      image_storage_bucket: primaryReference.storage_bucket,
      image_storage_path: primaryReference.storage_path,
      image_mime_type: primaryReference.mime_type,
      image_width: primaryReference.width,
      image_height: primaryReference.height,
      image_storage_paths: savedReferences
    });
  }

  return {
    ...result,
    items: uploadedItems,
    source_notes: [
      result.source_notes,
      `Saved ${uploadedImageCount} product reference image(s) across ${uploadedItems.filter((item) => item.image_storage_path).length} furniture line(s).`
    ]
      .filter(Boolean)
      .join("\n")
  };
}

async function attachRenderedItemCrops({ job, result, userId, getRenderedPage }) {
  if (!Array.isArray(result.items) || !result.items.length || typeof getRenderedPage !== "function") return result;

  const pageCache = new Map();
  const cropOwners = new Map();
  const items = [];
  let savedCropCount = 0;

  for (const item of result.items) {
    if (item.image_storage_path || !item.photo_bbox || Number(item.photo_page || 0) <= 0) {
      items.push(item);
      continue;
    }

    const pageNumber = Number(item.photo_page);
    if (!pageCache.has(pageNumber)) pageCache.set(pageNumber, await getRenderedPage(pageNumber));
    const renderedPage = pageCache.get(pageNumber);
    if (!renderedPage?.dataBase64) {
      items.push(item);
      continue;
    }

    try {
      const pageBuffer = Buffer.from(renderedPage.dataBase64, "base64");
      const metadata = await sharp(pageBuffer).metadata();
      const crop = resolvePixelCrop(item.photo_bbox, metadata.width, metadata.height);
      if (!crop) {
        items.push(item);
        continue;
      }

      const cropped = await sharp(pageBuffer).extract(crop).png({ compressionLevel: 9 }).toBuffer();
      const hash = createHash("sha256").update(cropped).digest("hex");
      const owner = cropOwners.get(hash);
      const itemRef = String(item.item_ref || item.item_type_en || item.item_type_cn || "item");
      if (owner && owner !== itemRef) {
        items.push({
          ...item,
          image_mapping_status: "duplicate_crop_rejected"
        });
        continue;
      }
      cropOwners.set(hash, itemRef);

      const safeItemRef =
        itemRef
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 48) || "item";
      const storagePath = `${userId || "unowned"}/derived/${job.id}/item-${safeItemRef}-page-${String(pageNumber).padStart(4, "0")}-${hash.slice(0, 10)}.png`;
      const { error } = await supabase.storage.from("intake-files").upload(storagePath, cropped, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true
      });
      if (error) throw error;

      savedCropCount += 1;
      items.push({
        ...item,
        image_storage_bucket: "intake-files",
        image_storage_path: storagePath,
        image_mime_type: "image/png",
        image_width: crop.width,
        image_height: crop.height,
        image_sha256: hash,
        image_mapping_status: "gemini_bbox_verified",
        image_storage_paths: [
          {
            storage_bucket: "intake-files",
            storage_path: storagePath,
            mime_type: "image/png",
            width: crop.width,
            height: crop.height,
            sha256: hash
          }
        ]
      });
    } catch (error) {
      console.warn(`Could not crop Gemini-mapped product photo for intake job ${job.id}:`, error.message || error);
      items.push({ ...item, image_mapping_status: "crop_failed" });
    }
  }

  return {
    ...result,
    items,
    source_notes: [
      result.source_notes,
      `Saved ${savedCropCount} Gemini-mapped product photo crop(s); items without a verified unique crop remain image-free.`
    ]
      .filter(Boolean)
      .join("\n")
  };
}

function resolvePixelCrop(bbox, pageWidth, pageHeight) {
  const width = Math.max(0, Number(pageWidth || 0));
  const height = Math.max(0, Number(pageHeight || 0));
  if (!width || !height) return null;
  const xMin = Math.max(0, Math.min(1000, Number(bbox.x_min || 0)));
  const yMin = Math.max(0, Math.min(1000, Number(bbox.y_min || 0)));
  const xMax = Math.max(0, Math.min(1000, Number(bbox.x_max || 0)));
  const yMax = Math.max(0, Math.min(1000, Number(bbox.y_max || 0)));
  if (xMax <= xMin || yMax <= yMin) return null;

  const left = Math.max(0, Math.floor((xMin / 1000) * width));
  const top = Math.max(0, Math.floor((yMin / 1000) * height));
  const right = Math.min(width, Math.ceil((xMax / 1000) * width));
  const bottom = Math.min(height, Math.ceil((yMax / 1000) * height));
  const cropWidth = right - left;
  const cropHeight = bottom - top;
  if (cropWidth < 48 || cropHeight < 48) return null;
  return { left, top, width: cropWidth, height: cropHeight };
}

function imageFileExtension(mimeType) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

function getJobUserId(job) {
  const intakeFile = Array.isArray(job.intake_files) ? job.intake_files[0] : job.intake_files;
  return job.user_id || job.requested_by || intakeFile?.user_id || intakeFile?.uploaded_by || null;
}

async function bindResultToOwnerProfile(result, userId) {
  if (!userId) return result;
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("full_name,company")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return bindIntakeResultToOwner(result, { profile: profile || {} });
}

async function markJobFailed(job, err) {
  const nextStatus = Number(job.attempts || 0) >= maxAttempts ? "failed" : "queued";
  await supabase
    .from("intake_jobs")
    .update({
      status: nextStatus,
      error_message: err.message || String(err),
      locked_at: null
    })
    .eq("id", job.id);

  console.error(`Intake job ${job.id} failed:`, err);
}

async function tick() {
  const jobs = await claimQueuedJobs();
  for (const job of jobs) {
    try {
      await processJob(job);
    } catch (err) {
      await markJobFailed(job, err);
    }
  }
}

if (runOnce) {
  await tick();
} else {
  console.log(`Crafton Intake Worker running every ${intervalMs}ms`);
  await tick();
  setInterval(() => {
    tick().catch((err) => console.error("Worker tick failed:", err));
  }, intervalMs);
}
