const DEFAULT_TIMEOUT_MS = 60000;

export async function requestModelJson({ system, user, model, maxTokens = 3500 }) {
  if (!process.env.DEEPSEEK_API_KEY) return null;

  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.AI_WORKFLOW_MODEL_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)
  );

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: model || process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: maxTokens,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`AI provider returned ${response.status}: ${(await response.text()).slice(0, 400)}`);
    }
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI provider returned an empty response.");
    return parseJsonObject(content);
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonObject(content) {
  const text = String(content || "").trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("AI provider did not return valid JSON.");
    return JSON.parse(text.slice(start, end + 1));
  }
}
