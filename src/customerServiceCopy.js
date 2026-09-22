// Apply only to Crafton-generated status text and summaries, never customer input,
// product names, filenames, specifications or records saved for audit.
export function customerServiceText(value) {
  const text = String(value || "");
  const updated = text
    .replace(/\bAI is checking your files?[….]*/gi, "We’re checking your files…")
    .replace(/\bAI intake check complete\b/gi, "File check complete")
    .replace(/\bAI[- ](?:assisted|driven|powered|generated|structured|detected|normalized)\s+/gi, "")
    .replace(/\bCrafton AI\b/gi, "Crafton")
    .replace(/\bLoading AI\b/gi, "Loading Planner")
    .replace(/\bAI (?=concept\b)/gi, "")
    .replace(/\bAI is\b/g, "We are")
    .replace(/\bAI has\b/g, "We have")
    .replace(/\bAI will\b/g, "We will")
    .replace(/\bAI (found|updated|extracted|checked|re-checked|completed)\b/g, "We $1")
    .replace(/\bAI (?=(?:check|review|re-analysis|analysis|update|draft)\b)/gi, "")
    .replace(/AI\s*(?=[\u3400-\u9fff])/g, "")
    .replace(/([\u3400-\u9fff，；。]) +(?=[\u3400-\u9fff])/g, "$1");
  return updated === text ? text : updated.replace(/^([a-z])/, (letter) => letter.toUpperCase());
}

export function customerServiceError(value, lang = "En", fallback) {
  const text = String(value || "");
  // Provider errors can contain model names, URLs or request bodies. Keep those
  // in diagnostics and show a useful retry message at the customer boundary.
  if (!text || /\bAI\b|\b(?:OpenAI|DeepSeek|Gemini|ChatGPT|Claude|LLM|API|Supabase|worker)(?:_[A-Z0-9_]+)?\b|人工智[能慧]/i.test(text)) {
    return fallback || (lang === "Cn"
      ? "暂时未能完成此操作，请稍后重试；若问题持续，请联系 Crafton。"
      : "We couldn’t complete this request. Please try again shortly, or contact Crafton if it continues.");
  }
  return text;
}
