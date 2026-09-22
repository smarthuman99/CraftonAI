// Deployment gate: probes only schema and deliberately non-existent UUIDs.
// No customer records are created, read, changed or returned.
const origin = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!origin || !key) throw new Error('Missing database configuration');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const zero = '00000000-0000-0000-0000-000000000000';
async function probe(path, body) {
  const response = await fetch(`${origin}/rest/v1/${path}`, {
    method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json();
  if (body) return data?.message === 'Project access denied';
  return response.ok;
}
const timeout = process.argv.includes('--wait') ? 15 * 60 * 1000 : 0;
const start = Date.now();
do {
  const ready = await Promise.all([
    probe('projects?select=client_edit_revision,client_details,lifecycle_status&limit=0'),
    probe('intake_jobs?select=client_import_state&limit=0'),
    probe('rpc/queue_client_project_file', { p_project_id:zero, p_owner_id:zero, p_file_id:zero }),
    probe('rpc/commit_client_project_edit', {
      p_project_id:zero, p_owner_id:zero, p_revision:0, p_expected_jobs:[],
      p_project_patch:{}, p_patches:[], p_guard_draft:true, p_sync_specs:false,
      p_actor_id:zero, p_operation:'schema_probe'
    })
  ]).catch(() => [false]);
  if (ready.every(Boolean)) {
    console.log('Project editing database schema is ready.');
    process.exit(0);
  }
  if (Date.now() - start >= timeout) break;
  console.log('Waiting for the project editing migration; workers remain paused.');
  await new Promise(resolve => setTimeout(resolve, 10000));
} while (true);
throw new Error('Project editing database migration is not ready; frontend must remain unchanged.');
