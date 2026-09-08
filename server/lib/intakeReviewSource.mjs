import { createHash } from "node:crypto";
import { convertOfficeDocumentToPdf, openPdfBatchReader } from "./intakeSourceReader.mjs";
import { createEvidenceUnits } from "./intakeRiskReview.mjs";

export async function createReviewSource({ source, file, job = {}, reader: suppliedReader = null }) {
  let reader = suppliedReader;
  let text = source.sourceText || "";
  let visualUnavailable = false;
  if (
    !reader &&
    ["spreadsheet", "legacy_spreadsheet", "docx", "legacy_doc"].includes(source.sourceKind) &&
    source.sourceBuffer
  ) {
    try {
      reader = await openPdfBatchReader({
        buffer: await convertOfficeDocumentToPdf(source.sourceBuffer, source.sourceKind),
        maxTextChars: 300000
      });
    } catch {
      visualUnavailable = true;
    }
  }
  let context;
  if (reader) {
    const pages = Array.from({ length: reader.totalPages }, (_, i) => i + 1);
    const extracted = await reader.readPages(pages, { visualMode: "none", includeImages: false });
    context = createEvidenceUnits({
      sourceText: extracted.sourceText,
      sourceKind: source.sourceKind,
      sourceMetadata: { ...source.sourceMetadata, ...extracted.sourceMetadata }
    });
    // Render-only PDFs still need a source unit for every page, even with no text.
    context.units = pages.map((id) => context.units.find((u) => u.id === id) || { id, label: `Page ${id}`, text: "" });
    if (source.sourceKind !== "pdf" && pages.length === 1) context.units[0].text += `\n${text}`;
  } else {
    if (source.sourceKind === "image") text = [job.brief_text, job.quantity_text].filter(Boolean).join("\n");
    context = createEvidenceUnits({
      sourceText: text,
      sourceMedia: source.sourceMedia,
      sourceKind: source.sourceKind,
      sourceMetadata: source.sourceMetadata
    });
  }
  Object.assign(context, {
    mediaIssue: source.mediaIssue,
    extractedImages: source.extractedImages || [],
    visualUnavailable,
    fingerprint: createHash("sha256")
      .update(source.sourceBuffer || `${file?.storage_path || ""}:${text}`)
      .digest("hex")
  });
  return {
    context,
    async readReviewUnits(ids) {
      const units = context.units.filter((u) => ids.includes(u.id));
      let sourceMedia = null;
      if (reader) {
        sourceMedia = await reader.renderPages(ids, { desiredWidth: 2400, maxBytes: 20 * 1024 * 1024 });
        if (!sourceMedia || sourceMedia.pages.length !== ids.length || sourceMedia.pages.some((p) => p.width < 1600))
          throw new Error("Source could not be rendered clearly for evidence review.");
      } else if (source.sourceKind === "image" && source.sourceMedia?.dataBase64) {
        sourceMedia = { pages: [{ ...source.sourceMedia, pageNumber: 1 }] };
      }
      return { units, sourceMedia };
    },
    async getRenderedPage(id, desiredWidth = 2400) {
      if (reader)
        return (await reader.renderPages([id], { desiredWidth, maxBytes: 32 * 1024 * 1024 }))?.pages?.[0] || null;
      if (source.sourceKind === "image" && id === 1) return source.sourceMedia;
      return null;
    },
    async destroy() {
      if (reader && !suppliedReader) await reader.destroy();
    }
  };
}
