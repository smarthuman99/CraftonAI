// Read-only schema checks and calls using non-existent record IDs only.
const origin = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!origin || !key) throw new Error("Missing database configuration");
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const zero = "00000000-0000-0000-0000-000000000000";
async function probe(path, body, expected) {
  const response = await fetch(`${origin}/rest/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json().catch(() => null);
  if (expected ? data?.message !== expected : !response.ok)
    throw new Error(`Support schema gate failed: ${path.split("?")[0]} (HTTP ${response.status})`);
}
await Promise.all([
  probe("project_support_sessions?select=id,user_id,project_id,status,updated_at&limit=0"),
  probe("project_support_turns?select=id,request_id,flags,context_snapshot,status&limit=0"),
  probe("project_support_reviews?select=id,reviewer_id,note,status&limit=0"),
  probe("project_support_limits?select=user_id,lease_id,active_until&limit=0"),
  probe(
    "rpc/review_project_support",
    {
      p_session_id: zero,
      p_reviewer_id: zero,
      p_expected_updated_at: "2000-01-01T00:00:00Z",
      p_note: "Schema probe",
      p_status: "reviewed"
    },
    "Conversation changed"
  ),
  probe(
    "rpc/finish_project_support_turn",
    { p_turn_id: zero, p_answer: "Schema probe", p_sources: [], p_engine: "probe", p_needs_review: false },
    "Turn is no longer pending"
  ),
  probe("rpc/release_project_support", { p_user_id: zero, p_lease_id: zero }),
  probe("rpc/recover_project_support", { p_user_id: zero })
]);
console.log("Project support database schema is ready.");
