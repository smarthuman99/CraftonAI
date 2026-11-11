import { setTimeout as delay } from "node:timers/promises";
import { parseIntakeBrief } from "./intakeProcessor.mjs";

// Keep the base64 JSON request small. Larger PDFs go to the same model via a temporary file.
const inlineLimit = 12 * 1024 * 1024;
export const maxOriginalPdfBytes = 50 * 1024 * 1024;

export async function analyzeOriginalPdf({
  buffer,
  pages,
  job,
  file,
  parse = parseIntakeBrief,
  inlineBytes = process.env.INTAKE_GEMINI_PDF_INLINE_MAX_BYTES
}) {
  const sourceMedia = {
    sourceKind: "pdf_document",
    mimeType: "application/pdf",
    byteLength: buffer.length,
    pageNumbers: pages
  };
  const submit = (mediaIssue = "") => parse({ job, file, sourceMedia, mediaIssue });
  if (buffer.length > maxOriginalPdfBytes || pages.length > 1000) return submit("pdf_exceeds_gemini_document_limit");
  if (!process.env.GEMINI_API_KEY) return submit("vision_not_configured");
  const threshold = Math.min(Number(inlineBytes) || inlineLimit, inlineLimit);
  if (buffer.length <= threshold) {
    sourceMedia.dataBase64 = buffer.toString("base64");
    return submit();
  }

  const base = (process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
  const endpoint = new URL(base);
  endpoint.pathname = "/upload" + endpoint.pathname + "/files";
  const headers = { "x-goog-api-key": process.env.GEMINI_API_KEY };
  let name;
  try {
    const start = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(buffer.length),
        "X-Goog-Upload-Header-Content-Type": "application/pdf"
      },
      body: JSON.stringify({ file: { display_name: "FF&E intake.pdf" } }),
      signal: AbortSignal.timeout(30000)
    });
    const upload = start.headers.get("x-goog-upload-url");
    if (!start.ok || !upload) throw Object.assign(new Error("upload_start_failed"), { status: start.status });
    const response = await fetch(upload, {
      method: "POST",
      headers: { "X-Goog-Upload-Command": "upload, finalize", "X-Goog-Upload-Offset": "0" },
      body: buffer,
      signal: AbortSignal.timeout(120000)
    });
    if (!response.ok) throw Object.assign(new Error("upload_failed"), { status: response.status });
    let resource = (await response.json()).file;
    if (!/^files\/[\w-]+$/.test(resource?.name)) throw new Error("invalid_upload_response");
    name = resource.name;
    const deadline = Date.now() + 120000;
    while (resource.state === "PROCESSING" && Date.now() < deadline) {
      await delay(1500);
      const state = await fetch(base + "/" + name, { headers, signal: AbortSignal.timeout(15000) });
      if (!state.ok) throw Object.assign(new Error("file_state_unavailable"), { status: state.status });
      resource = await state.json();
    }
    if (!resource.uri || resource.state !== "ACTIVE") throw new Error("file_not_ready");
    sourceMedia.fileUri = resource.uri;
    return await submit();
  } catch (error) {
    const reason = error.status === 402 ? "gemini_payment_required" : "pdf_original_submission_failed";
    console.warn("Gemini original PDF submission failed:", reason, error.status);
    return await submit(reason);
  } finally {
    if (name) {
      try {
        const removed = await fetch(base + "/" + name, {
          method: "DELETE",
          headers,
          signal: AbortSignal.timeout(15000)
        });
        if (!removed.ok && removed.status !== 404)
          console.warn("Temporary Gemini file cleanup returned", removed.status);
      } catch {
        console.warn("Temporary Gemini file cleanup did not complete.");
      }
    }
  }
}
