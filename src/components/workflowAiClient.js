export const WORKFLOW_AI_URL = import.meta.env.VITE_AI_SUPPORT_API_URL || "/api/ai-support-chat";

export async function callWorkflowAi(supabaseClient, body) {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error || !data?.session?.access_token) throw new Error("Staff login expired. Please sign in again.");
  const response = await fetch(WORKFLOW_AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `${response.status} ${response.statusText}`);
  return payload;
}

export async function sha256Payload(payload) {
  const digest = await window.crypto.subtle.digest("SHA-256", new window.TextEncoder().encode(JSON.stringify(payload)));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
