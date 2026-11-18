import test from "node:test";
import assert from "node:assert/strict";
import { parseEnv } from "node:util";
import { replaceGeminiKey } from "./rotate-gemini-key.mjs";
const key = "AIza_test_new_key_1234567890";
test("replaces only Gemini and retains other credentials, comments and CRLF", () => {
  const before =
    "# keep\r\nDEEPSEEK_API_KEY=do-not-change\r\nGEMINI_API_KEY=old-key # old\r\nSUPABASE_SERVICE_ROLE_KEY=keep-this\r\n";
  const after = replaceGeminiKey(before, key);
  assert.equal(
    after,
    "# keep\r\nDEEPSEEK_API_KEY=do-not-change\r\nGEMINI_API_KEY=" + key + "\r\nSUPABASE_SERVICE_ROLE_KEY=keep-this\r\n"
  );
  assert.equal(parseEnv(after).GEMINI_API_KEY, key);
});
test("adds a missing key and handles export, whitespace and missing final newline", () => {
  for (const before of [
    "OTHER=untouched",
    "# GEMINI_API_KEY=comment\n",
    "export GEMINI_API_KEY = old\nOTHER=untouched\n"
  ]) {
    const after = replaceGeminiKey(before, key);
    assert.equal(parseEnv(after).GEMINI_API_KEY, key);
    assert.equal(parseEnv(after).OTHER, parseEnv(before).OTHER);
  }
});
test("refuses ambiguous duplicates and multiline or shell-like key values", () => {
  assert.throws(() => replaceGeminiKey("GEMINI_API_KEY=a\nGEMINI_API_KEY=b\n", key), /Duplicate/);
  for (const invalid of ["", "short", key + "\nEVIL=1", key + ";whoami", key + '"'])
    assert.throws(() => replaceGeminiKey("GEMINI_API_KEY=old\n", invalid), /Invalid/);
});

test("accepts opaque keys with base64 token punctuation and long key formats", () => {
  const opaque = "AQ." + "aB01_+/~-".repeat(70) + "==";
  assert.equal(parseEnv(replaceGeminiKey("GEMINI_API_KEY=old\n", opaque)).GEMINI_API_KEY, opaque);
});
