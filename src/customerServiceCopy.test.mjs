import assert from "node:assert/strict";
import test from "node:test";
import { customerServiceError, customerServiceText } from "./customerServiceCopy.js";

test("presents legacy intake summaries without changing counts or approval state", () => {
  assert.equal(
    customerServiceText("AI intake check complete. 3 client detail(s) need confirmation before approval."),
    "File check complete. 3 client detail(s) need confirmation before approval."
  );
  assert.equal(customerServiceText("AI 已完成资料检查，客户仍需确认 3 项资料。"), "已完成资料检查，客户仍需确认 3 项资料。");
  assert.equal(customerServiceText("AI is checking your file…"), "We’re checking your files…");
  assert.equal(customerServiceText("AI is checking your files. Please wait."), "We’re checking your files… Please wait.");
});

test("keeps manufacturing limitations and ordinary project information intact", () => {
  assert.equal(customerServiceText("AI concept reference · Not for manufacture"), "Concept reference · Not for manufacture");
  const specification = "Chair, stainless steel, 650 × 600 × 850 mm, Crib 5, 24 pieces";
  assert.equal(customerServiceText(specification), specification);
  assert.equal(customerServiceText("eBay showroom: 24 chairs awaiting approval."), "eBay showroom: 24 chairs awaiting approval.");
});

test("provider diagnostics become localized service messages", () => {
  for (const diagnostic of ["Gemini drawing request failed: 503 body", "Missing DEEPSEEK_API_KEY for AI support chat.", "GEMINI_API_KEY is not configured.", "Supabase worker unavailable"]) {
    assert.equal(customerServiceError(diagnostic, "Cn"), "暂时未能完成此操作，请稍后重试；若问题持续，请联系 Crafton。");
    assert.doesNotMatch(customerServiceError(diagnostic, "En"), /Gemini|DeepSeek|Supabase|\bAI\b/i);
  }
  assert.equal(customerServiceError("Gemini unavailable", "En", "Please retry the download."), "Please retry the download.");
  assert.equal(customerServiceError("Please select a PDF under 250 MB."), "Please select a PDF under 250 MB.");
});
