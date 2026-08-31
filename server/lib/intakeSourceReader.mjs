const DEFAULT_MAX_TEXT_CHARS = 60000;
const DEFAULT_MAX_VISION_BYTES = 12 * 1024 * 1024;
const DEFAULT_MAX_DOCUMENT_BYTES = 250 * 1024 * 1024;
const DEFAULT_PDF_VISION_MIN_TEXT_CHARS_PER_PAGE = 80;
const DEFAULT_PDF_VISION_RENDER_WIDTH = 1400;
const MIN_PDF_VISION_RENDER_WIDTH = 800;

export function getIntakeSourceKind(file = {}) {
  const mime = String(file.mime_type || "").toLowerCase();
  const name = String(file.original_name || file.storage_path || "").toLowerCase();

  if (["image/jpeg", "image/png", "image/webp"].includes(mime) || /\.(?:png|jpe?g|webp)$/.test(name)) {
    return "image";
  }
  if (mime.includes("spreadsheetml") || mime.includes("ms-excel.sheet.macroenabled") || /\.(?:xlsx|xlsm)$/.test(name)) {
    return "spreadsheet";
  }
  if (mime === "application/vnd.ms-excel" || /\.xls$/.test(name)) return "legacy_spreadsheet";
  if (mime === "application/pdf" || /\.pdf$/.test(name)) return "pdf";
  if (mime.includes("wordprocessingml") || /\.docx$/.test(name)) return "docx";
  if (mime === "application/msword" || /\.doc$/.test(name)) return "legacy_doc";
  if (
    mime.startsWith("text/") ||
    ["application/json", "application/xml"].includes(mime) ||
    /\.(?:txt|csv|tsv|md|json|xml)$/.test(name)
  ) {
    return "text";
  }
  return "unsupported";
}

export async function extractIntakeSource({
  file,
  buffer,
  maxTextChars = DEFAULT_MAX_TEXT_CHARS,
  maxVisionBytes = DEFAULT_MAX_VISION_BYTES,
  maxDocumentBytes = DEFAULT_MAX_DOCUMENT_BYTES,
  includeOfficeVisual = false
}) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  const kind = getIntakeSourceKind(file);
  const empty = { sourceText: "", sourceMedia: null, extractedImages: [], mediaIssue: "", sourceKind: kind };

  if (kind === "unsupported") return { ...empty, mediaIssue: "unsupported_source_format" };
  if (kind === "image") {
    if (bytes.byteLength > maxVisionBytes) return { ...empty, mediaIssue: "image_exceeds_inline_limit" };
    return {
      ...empty,
      sourceMedia: {
        mimeType: resolveImageMimeType(file),
        dataBase64: bytes.toString("base64"),
        byteLength: bytes.byteLength
      }
    };
  }

  if (bytes.byteLength > maxDocumentBytes) return { ...empty, mediaIssue: "document_exceeds_parse_limit" };

  try {
    let sourceText = "";
    let sourceMedia = null;
    let extractedImages = [];
    if (kind === "text") sourceText = bytes.toString("utf8").replace(/\0/g, "");
    if (kind === "spreadsheet") {
      const spreadsheetSource = await extractSpreadsheetSource(bytes);
      sourceText = spreadsheetSource.text;
      extractedImages = spreadsheetSource.images;
    }
    if (kind === "legacy_spreadsheet") {
      const spreadsheetSource = await extractLegacySpreadsheetSource(bytes);
      sourceText = spreadsheetSource.text;
      extractedImages = spreadsheetSource.images;
    }
    if (kind === "pdf") {
      const pdfSource = await extractPdfSource(bytes);
      sourceText = pdfSource.text;
      extractedImages = pdfSource.images;
    }
    if (kind === "docx") sourceText = await extractDocxText(bytes);
    if (kind === "legacy_doc") sourceText = await extractLegacyDocText(bytes);

    if (includeOfficeVisual && ["spreadsheet", "legacy_spreadsheet", "docx", "legacy_doc"].includes(kind)) {
      try {
        sourceMedia = await renderOfficeDocumentForVision({
          buffer: bytes,
          kind,
          maxVisionBytes
        });
      } catch (error) {
        console.warn(`Could not render ${kind} intake source for Gemini visual analysis:`, error.message || error);
      }
    }

    const normalized = normalizeExtractedText(sourceText).slice(0, maxTextChars);
    return normalized || extractedImages.length || sourceMedia
      ? {
          ...empty,
          sourceText: normalized,
          sourceMedia,
          extractedImages,
          mediaIssue: normalized ? "" : `${kind}_contained_no_readable_text`
        }
      : { ...empty, mediaIssue: `${kind}_contained_no_readable_text` };
  } catch (error) {
    console.warn(`Could not extract ${kind} intake source:`, error.message || error);
    return { ...empty, mediaIssue: `${kind}_parse_failed` };
  }
}

async function extractSpreadsheetSource(buffer) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const output = [];
  const extractedImages = [];
  for (const worksheet of workbook.worksheets) {
    output.push(`WORKSHEET: ${worksheet.name}`);
    const worksheetImages = collectWorksheetImages({ workbook, worksheet, startIndex: extractedImages.length });
    extractedImages.push(...worksheetImages);
    const imagesByRow = new Map();
    for (const image of worksheetImages) {
      const rowImages = imagesByRow.get(image.sourceRow) || [];
      rowImages.push(image);
      imagesByRow.set(image.sourceRow, rowImages);
    }

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const values = row.values
        .slice(1)
        .map(normalizeSpreadsheetCell)
        .map((value) => value.trim());
      if (values.some(Boolean)) output.push(`ROW ${rowNumber}: ${values.join(" | ")}`);
      for (const image of imagesByRow.get(rowNumber) || []) output.push(formatSpreadsheetImageMarker(image));
    });

    for (const image of worksheetImages) {
      if (!imagesByRow.has(image.sourceRow) || worksheet.getRow(image.sourceRow)?.hasValues) continue;
      output.push(formatSpreadsheetImageMarker(image));
    }
  }
  return { text: output.join("\n"), images: extractedImages };
}

async function extractLegacySpreadsheetSource(buffer) {
  try {
    const converted = await convertLegacySpreadsheetToXlsx(buffer);
    return await extractSpreadsheetSource(converted);
  } catch (error) {
    console.warn(`Legacy XLS conversion unavailable; using cell-only fallback: ${error.message || error}`);
  }

  const { Workbook } = await import("@eredzik/calaminejs");
  const workbook = Workbook.from_bytes(new Uint8Array(buffer));
  const output = [];
  try {
    for (const sheetName of workbook.sheet_names()) {
      const worksheet = workbook.get_sheet(sheetName);
      if (!worksheet) continue;
      output.push(`WORKSHEET: ${sheetName}`);
      for (const [index, row] of (worksheet.rows || []).entries()) {
        const values = trimTrailingEmptyCells((row || []).map(normalizeSpreadsheetCell).map((value) => value.trim()));
        if (values.some(Boolean)) output.push(`ROW ${index + 1}: ${values.join(" | ")}`);
      }
    }
  } finally {
    if (typeof workbook.free === "function") workbook.free();
  }
  return { text: output.join("\n"), images: [] };
}

async function convertLegacySpreadsheetToXlsx(buffer) {
  const [{ mkdtemp, readFile, rm, writeFile }, { tmpdir }, { join }, { execFile }] = await Promise.all([
    import("node:fs/promises"),
    import("node:os"),
    import("node:path"),
    import("node:child_process")
  ]);
  const workdir = await mkdtemp(join(tmpdir(), "crafton-xls-"));
  const inputPath = join(workdir, "source.xls");
  const outputPath = join(workdir, "source.xlsx");
  const executable = process.env.LIBREOFFICE_BIN || "soffice";

  try {
    await writeFile(inputPath, buffer);
    await new Promise((resolve, reject) => {
      execFile(
        executable,
        [
          "--headless",
          "--nologo",
          "--nodefault",
          "--nolockcheck",
          "--nofirststartwizard",
          `-env:UserInstallation=file:///${workdir.replaceAll("\\", "/")}/profile`,
          "--convert-to",
          "xlsx",
          "--outdir",
          workdir,
          inputPath
        ],
        { timeout: Number(process.env.INTAKE_XLS_CONVERSION_TIMEOUT_MS || 60000) },
        (error) => (error ? reject(error) : resolve())
      );
    });
    return await readFile(outputPath);
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

function collectWorksheetImages({ workbook, worksheet, startIndex }) {
  if (typeof worksheet.getImages !== "function") return [];
  const collected = [];

  for (const image of worksheet.getImages()) {
    const media = workbook.getImage(image.imageId);
    const data = media?.buffer ? Buffer.from(media.buffer) : media?.base64 ? Buffer.from(media.base64, "base64") : null;
    const mimeType = spreadsheetImageMimeType(media?.extension);
    if (!data?.length || !mimeType) continue;

    const dimensions = readRasterDimensions(data, media.extension);
    if (dimensions.width && dimensions.height && (dimensions.width < 80 || dimensions.height < 80)) continue;
    const sourceRow = Math.max(1, Number(image.range?.tl?.nativeRow ?? 0) + 1);
    const sourceColumn = Math.max(1, Number(image.range?.tl?.nativeCol ?? 0) + 1);
    const imageNumber = startIndex + collected.length + 1;
    collected.push({
      page: imageNumber,
      name: `${worksheet.name}-row-${sourceRow}-image-${imageNumber}`,
      mimeType,
      width: dimensions.width,
      height: dimensions.height,
      data,
      worksheet: worksheet.name,
      sourceRow,
      sourceColumn
    });
  }
  return collected;
}

function formatSpreadsheetImageMarker(image) {
  const dimensions = image.width && image.height ? ` | pixels=${image.width}x${image.height}` : "";
  return `EMBEDDED IMAGE ${image.page}: sheet=${image.worksheet} | anchor row=${image.sourceRow} | column=${image.sourceColumn}${dimensions}`;
}

function spreadsheetImageMimeType(extension) {
  const normalized = String(extension || "")
    .toLowerCase()
    .replace(/^\./, "");
  if (normalized === "png") return "image/png";
  if (["jpg", "jpeg"].includes(normalized)) return "image/jpeg";
  if (normalized === "webp") return "image/webp";
  return "";
}

function readRasterDimensions(data, extension) {
  const normalized = String(extension || "")
    .toLowerCase()
    .replace(/^\./, "");
  if (normalized === "png" && data.length >= 24 && data.subarray(1, 4).toString("ascii") === "PNG") {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  if (["jpg", "jpeg"].includes(normalized)) return readJpegDimensions(data);
  if (normalized === "webp") return readWebpDimensions(data);
  return { width: 0, height: 0 };
}

function readJpegDimensions(data) {
  let offset = 2;
  while (offset + 9 < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = data[offset + 1];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { width: data.readUInt16BE(offset + 7), height: data.readUInt16BE(offset + 5) };
    }
    const length = data.readUInt16BE(offset + 2);
    if (!length) break;
    offset += length + 2;
  }
  return { width: 0, height: 0 };
}

function readWebpDimensions(data) {
  if (
    data.length < 30 ||
    data.subarray(0, 4).toString("ascii") !== "RIFF" ||
    data.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    return { width: 0, height: 0 };
  }
  const kind = data.subarray(12, 16).toString("ascii");
  if (kind === "VP8X") {
    return {
      width: 1 + data.readUIntLE(24, 3),
      height: 1 + data.readUIntLE(27, 3)
    };
  }
  return { width: 0, height: 0 };
}

async function extractPdfSource(buffer) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const textResult = await parser.getText();
    const imageResult = await parser.getImage({ imageThreshold: 120, imageDataUrl: false, imageBuffer: true });
    return {
      text: textResult.text || "",
      images: (imageResult.pages || []).flatMap((page, index) =>
        selectPdfProductImages(page.images || []).map((image, imageIndex) => ({
          page: Number(page.pageNumber || index + 1),
          imageIndex,
          name: image.name || `page-${index + 1}-product-${imageIndex + 1}`,
          mimeType: "image/png",
          width: Number(image.width || 0),
          height: Number(image.height || 0),
          data: Buffer.from(image.data)
        }))
      )
    };
  } finally {
    await parser.destroy();
  }
}

export async function openPdfBatchReader({
  url,
  buffer,
  maxTextChars = DEFAULT_MAX_TEXT_CHARS,
  maxVisionBytes = DEFAULT_MAX_VISION_BYTES,
  visualFallbackMinTextCharsPerPage = DEFAULT_PDF_VISION_MIN_TEXT_CHARS_PER_PAGE,
  visualFallbackRenderWidth = DEFAULT_PDF_VISION_RENDER_WIDTH
}) {
  const { PDFParse } = await import("pdf-parse");
  const loadSource = url
    ? { url }
    : { data: new Uint8Array(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || [])) };
  const parser = new PDFParse(loadSource);
  const info = await parser.getInfo();
  const renderPages = async (
    pages,
    { desiredWidth = visualFallbackRenderWidth, maxBytes = maxVisionBytes, sourceKind = "pdf_pages" } = {}
  ) => {
    const selectedPages = uniquePageNumbers(pages);
    if (!selectedPages.length) return null;
    const rendered = await renderPdfPagesForVision({
      parser,
      pages: selectedPages,
      desiredWidth,
      maxVisionBytes: maxBytes
    });
    return rendered ? { ...rendered, sourceKind } : null;
  };

  return {
    totalPages: Math.max(0, Number(info.total || 0)),
    fingerprints: Array.isArray(info.fingerprints) ? info.fingerprints.filter(Boolean) : [],
    async readPages(pages, { visualMode = "fallback", includeImages = true } = {}) {
      const selectedPages = uniquePageNumbers(pages);
      if (!selectedPages.length) return { sourceText: "", sourceMedia: null, images: [], mediaIssue: "" };

      const textResult = await parser.getText({ partial: selectedPages });
      const imageResult = includeImages
        ? await parser.getImage({
            partial: selectedPages,
            imageThreshold: 120,
            imageDataUrl: false,
            imageBuffer: true
          })
        : { pages: [] };
      const textPages = new Map(
        (textResult.pages || []).map((page, index) => [
          Number(page.num || selectedPages[index] || index + 1),
          String(page.text || "")
        ])
      );
      const sourceText = normalizeExtractedText(
        selectedPages.map((page) => `SOURCE PAGE ${page}\n${textPages.get(page) || ""}`).join("\n\n")
      ).slice(0, maxTextChars);
      const images = (imageResult.pages || []).flatMap((page, index) =>
        selectPdfProductImages(page.images || []).map((image, imageIndex) => ({
          page: Number(page.pageNumber || selectedPages[index] || index + 1),
          imageIndex,
          name: image.name || `page-${selectedPages[index] || index + 1}-product-${imageIndex + 1}`,
          mimeType: "image/png",
          width: Number(image.width || 0),
          height: Number(image.height || 0),
          data: Buffer.from(image.data)
        }))
      );

      const visualFallbackPages =
        visualMode === "always"
          ? selectedPages
          : visualMode === "none"
            ? []
            : selectPdfVisualFallbackPages({
                pages: selectedPages,
                textByPage: textPages,
                minTextCharsPerPage: visualFallbackMinTextCharsPerPage
              });
      let sourceMedia = null;
      let mediaIssue = "";
      if (visualFallbackPages.length) {
        try {
          sourceMedia = await renderPages(visualFallbackPages);
          if (!sourceMedia) mediaIssue = "pdf_visual_fallback_exceeds_inline_limit";
        } catch (error) {
          console.warn(
            `Could not render PDF pages ${visualFallbackPages.join(", ")} for visual analysis:`,
            error.message || error
          );
          mediaIssue = "pdf_visual_fallback_render_failed";
        }
      }

      return { sourceText, sourceMedia, images, mediaIssue, visualFallbackPages };
    },
    renderPages,
    async destroy() {
      await parser.destroy();
    }
  };
}

async function renderOfficeDocumentForVision({ buffer, kind, maxVisionBytes }) {
  const pdfBuffer = await convertOfficeDocumentToPdf(buffer, kind);
  const reader = await openPdfBatchReader({ buffer: pdfBuffer, maxVisionBytes });
  try {
    const pages = Array.from({ length: reader.totalPages }, (_, index) => index + 1);
    return await reader.renderPages(pages, { sourceKind: "office_pages" });
  } finally {
    await reader.destroy();
  }
}

async function convertOfficeDocumentToPdf(buffer, kind) {
  const [{ mkdtemp, readFile, rm, writeFile }, { tmpdir }, { join }, { execFile }] = await Promise.all([
    import("node:fs/promises"),
    import("node:os"),
    import("node:path"),
    import("node:child_process")
  ]);
  const extension =
    kind === "docx" ? "docx" : kind === "legacy_doc" ? "doc" : kind === "legacy_spreadsheet" ? "xls" : "xlsx";
  const workdir = await mkdtemp(join(tmpdir(), "crafton-office-vision-"));
  const inputPath = join(workdir, `source.${extension}`);
  const outputPath = join(workdir, "source.pdf");
  const executable = process.env.LIBREOFFICE_BIN || "soffice";

  try {
    await writeFile(inputPath, buffer);
    await new Promise((resolve, reject) => {
      execFile(
        executable,
        [
          "--headless",
          "--nologo",
          "--nodefault",
          "--nolockcheck",
          "--nofirststartwizard",
          `-env:UserInstallation=file:///${workdir.replaceAll("\\", "/")}/profile`,
          "--convert-to",
          "pdf",
          "--outdir",
          workdir,
          inputPath
        ],
        { timeout: Number(process.env.INTAKE_OFFICE_CONVERSION_TIMEOUT_MS || 90000) },
        (error) => (error ? reject(error) : resolve())
      );
    });
    return await readFile(outputPath);
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

function uniquePageNumbers(values) {
  return [...new Set((values || []).map(Number).filter((page) => Number.isInteger(page) && page > 0))].sort(
    (left, right) => left - right
  );
}

export function countPdfReadableCharacters(value) {
  return String(value || "")
    .replace(/SOURCE PAGE\s+\d+/gi, "")
    .replace(/[^\p{L}\p{N}]/gu, "").length;
}

export function selectPdfVisualFallbackPages({ pages = [], textByPage = new Map(), minTextCharsPerPage } = {}) {
  const threshold = Math.max(0, Number(minTextCharsPerPage ?? DEFAULT_PDF_VISION_MIN_TEXT_CHARS_PER_PAGE));
  return [...new Set((pages || []).map(Number).filter((page) => Number.isInteger(page) && page > 0))]
    .sort((left, right) => left - right)
    .filter((page) => countPdfReadableCharacters(readPageText(textByPage, page)) < threshold);
}

async function renderPdfPagesForVision({ parser, pages, desiredWidth, maxVisionBytes }) {
  const byteLimit = Math.max(1, Number(maxVisionBytes || DEFAULT_MAX_VISION_BYTES));
  let width = Math.max(
    MIN_PDF_VISION_RENDER_WIDTH,
    Math.round(Number(desiredWidth || DEFAULT_PDF_VISION_RENDER_WIDTH))
  );
  let rendered = await renderAtWidth(parser, pages, width);
  let totalBytes = rendered.reduce((sum, page) => sum + page.byteLength, 0);

  if (totalBytes > byteLimit && width > MIN_PDF_VISION_RENDER_WIDTH) {
    const ratio = Math.sqrt(byteLimit / totalBytes) * 0.92;
    const reducedWidth = Math.max(MIN_PDF_VISION_RENDER_WIDTH, Math.floor(width * ratio));
    if (reducedWidth < width) {
      width = reducedWidth;
      rendered = await renderAtWidth(parser, pages, width);
      totalBytes = rendered.reduce((sum, page) => sum + page.byteLength, 0);
    }
  }

  if (!rendered.length || totalBytes > byteLimit) return null;
  return {
    sourceKind: "pdf_pages",
    mimeType: "image/png",
    byteLength: totalBytes,
    pageNumbers: rendered.map((page) => page.pageNumber),
    pages: rendered
  };
}

async function renderAtWidth(parser, pages, desiredWidth) {
  const result = await parser.getScreenshot({
    partial: pages,
    desiredWidth,
    imageDataUrl: false,
    imageBuffer: true
  });
  return (result.pages || [])
    .map((page, index) => {
      const data = Buffer.from(page.data || []);
      if (!data.length) return null;
      return {
        pageNumber: Number(page.pageNumber || pages[index] || index + 1),
        mimeType: "image/png",
        dataBase64: data.toString("base64"),
        byteLength: data.byteLength,
        width: Math.round(Number(page.width || 0)),
        height: Math.round(Number(page.height || 0))
      };
    })
    .filter(Boolean);
}

function readPageText(textByPage, page) {
  if (textByPage instanceof Map) return textByPage.get(page) || "";
  return textByPage?.[page] || textByPage?.[String(page)] || "";
}

export function selectPrimaryPdfImage(images = []) {
  return selectPdfProductImages(images, 1)[0] || null;
}

export function selectPdfProductImages(images = [], limit = 4) {
  const candidates = images.filter(
    (image) => image?.data && Number(image.width || 0) >= 120 && Number(image.height || 0) >= 120
  );
  if (!candidates.length) return [];

  return [...candidates]
    .sort((left, right) => {
      const transparentDifference = Number(Number(right.kind) === 3) - Number(Number(left.kind) === 3);
      if (transparentDifference) return transparentDifference;
      return Number(right.width || 0) * Number(right.height || 0) - Number(left.width || 0) * Number(left.height || 0);
    })
    .slice(0, Math.max(1, Number(limit || 1)));
}

async function extractDocxText(buffer) {
  const mammothModule = await import("mammoth");
  const mammoth = mammothModule.default || mammothModule;
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

async function extractLegacyDocText(buffer) {
  const [{ mkdtemp, readFile, rm, writeFile }, { tmpdir }, { join }, { execFile }] = await Promise.all([
    import("node:fs/promises"),
    import("node:os"),
    import("node:path"),
    import("node:child_process")
  ]);
  const workdir = await mkdtemp(join(tmpdir(), "crafton-doc-"));
  const inputPath = join(workdir, "source.doc");
  const outputPath = join(workdir, "source.docx");
  const executable = process.env.LIBREOFFICE_BIN || "soffice";
  try {
    await writeFile(inputPath, buffer);
    await new Promise((resolve, reject) => {
      execFile(
        executable,
        [
          "--headless",
          "--nologo",
          "--nodefault",
          "--nolockcheck",
          "--nofirststartwizard",
          `-env:UserInstallation=file:///${workdir.replaceAll("\\", "/")}/profile`,
          "--convert-to",
          "docx",
          "--outdir",
          workdir,
          inputPath
        ],
        { timeout: Number(process.env.INTAKE_OFFICE_CONVERSION_TIMEOUT_MS || 90000) },
        (error) => (error ? reject(error) : resolve())
      );
    });
    return await extractDocxText(await readFile(outputPath));
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

function normalizeSpreadsheetCell(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || "").join("");
  if (value.result != null) return normalizeSpreadsheetCell(value.result);
  if (value.text != null) return String(value.text);
  if (value.hyperlink) return [value.text, value.hyperlink].filter(Boolean).join(" ");
  return String(value);
}

function trimTrailingEmptyCells(values) {
  const trimmed = [...values];
  while (trimmed.length && !trimmed[trimmed.length - 1]) trimmed.pop();
  return trimmed;
}

function normalizeExtractedText(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\u00a0]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function resolveImageMimeType(file) {
  const mime = String(file?.mime_type || "").toLowerCase();
  const name = String(file?.original_name || file?.storage_path || "").toLowerCase();
  if (["image/jpeg", "image/png", "image/webp"].includes(mime)) return mime;
  if (/\.png$/.test(name)) return "image/png";
  if (/\.webp$/.test(name)) return "image/webp";
  return "image/jpeg";
}
