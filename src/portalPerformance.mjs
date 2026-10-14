// These caches live only in memory. Never persist private URLs or session tokens.
const verifiedUsers = new WeakMap();

export async function getVerifiedBrowserUser(client) {
  const { data: sessionData, error } = await client.auth.getSession().catch((error) => ({ error }));
  const token = sessionData?.session?.access_token;
  if (error || !token) {
    verifiedUsers.delete(client);
    return null;
  }
  const cached = verifiedUsers.get(client);
  if (cached?.token === token && cached.until > Date.now()) return cached.promise;
  const entry = { token, until: Date.now() + 15000 };
  entry.promise = client.auth
    .getUser(token)
    .then(({ data, error: userError }) => {
      if (userError) throw userError;
      return data?.user || null;
    })
    .catch(() => {
      if (verifiedUsers.get(client) === entry) verifiedUsers.delete(client);
      return null;
    });
  verifiedUsers.set(client, entry);
  return entry.promise;
}

export function clearVerifiedBrowserUser(client) {
  if (client) verifiedUsers.delete(client);
}

// Preview hydration may arrive after an administrator starts editing. Only
// replace URLs which still match the original draft; never reset their inputs.
export function mergeReviewPreviewUrls(draft, refreshed, base) {
  if (!draft || draft.projectKey !== refreshed?.projectKey) return draft;
  const identity = (item) => JSON.stringify([item.id, item.sourceJobIds || []]);
  const refreshedItems = new Map((refreshed.items || []).map((item) => [identity(item), item]));
  const baseItems = new Map((base?.items || []).map((item) => [identity(item), item]));
  const nextUrl = (current, original, incoming) => (current === original ? incoming || current : current);
  return {
    ...draft,
    previewUrl: nextUrl(draft.previewUrl, base?.previewUrl, refreshed.previewUrl),
    items: draft.items.map((item) => {
      const next = refreshedItems.get(identity(item)),
        original = baseItems.get(identity(item));
      if (!next || !original) return item;
      const drawing = { ...item.technicalDrawing };
      for (const key of ["url", "draftUrl", "formalUrl"]) {
        drawing[key] = nextUrl(
          item.technicalDrawing?.[key],
          original.technicalDrawing?.[key],
          next.technicalDrawing?.[key]
        );
      }
      return { ...item, imageUrl: nextUrl(item.imageUrl, original.imageUrl, next.imageUrl), technicalDrawing: drawing };
    })
  };
}

// Calls in one burst share a request. An invalidation during that request causes
// one trailing read, so a completed save/realtime event cannot be swallowed.
export function createRefreshQueue() {
  const requests = new Map();
  return {
    run(key, read, { invalidate = false } = {}) {
      const current = requests.get(key);
      if (current) {
        if (invalidate) current.next = read;
        return current.promise;
      }
      const entry = { next: read };
      entry.promise = (async () => {
        let result;
        while (entry.next) {
          const next = entry.next;
          entry.next = null;
          try {
            result = await next();
          } catch (error) {
            if (!entry.next) throw error;
          }
        }
        return result;
      })().finally(() => {
        if (requests.get(key) === entry) requests.delete(key);
      });
      requests.set(key, entry);
      return entry.promise;
    }
  };
}

export function createSignedPreviewCache({ now = Date.now, maxEntries = 2000 } = {}) {
  const cache = new Map();
  let scheduled = false;
  const waiting = new Map();
  function sign(client, bucket, path) {
    if (!bucket || !path) return Promise.resolve("");
    const key = JSON.stringify([bucket, path]);
    const current = cache.get(key);
    if (current && current.until > now()) return current.promise;
    const entry = { until: now() + 55 * 60 * 1000 };
    entry.promise = new Promise((resolve) => {
      entry.resolve = resolve;
    });
    cache.set(key, entry);
    waiting.set(key, { client, bucket, path, entry });
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(flush);
    }
    return entry.promise;
  }
  async function flush() {
    scheduled = false;
    const entries = [...waiting.entries()];
    waiting.clear();
    const groups = new Map();
    for (const pair of entries) {
      const bucket = pair[1].bucket;
      if (!groups.has(bucket)) groups.set(bucket, []);
      groups.get(bucket).push(pair);
    }
    await Promise.all(
      [...groups.values()].map(async (group) => {
        // Bound individual Storage requests for projects with many furniture lines.
        for (let start = 0; start < group.length; start += 100) {
          const batch = group.slice(start, start + 100);
          const { client, bucket } = batch[0][1];
          let data = [];
          try {
            const result = await client.storage.from(bucket).createSignedUrls(
              batch.map(([, value]) => value.path),
              3600
            );
            if (!result.error) data = result.data || [];
          } catch {
            /* Keep the list usable; the next read will retry failed URLs. */
          }
          const byPath = new Map(data.map((value) => [value.path, value.signedUrl]));
          for (const [key, { path, entry }] of batch) {
            const url = byPath.get(path) || "";
            if (!url && cache.get(key) === entry) cache.delete(key);
            entry.resolve(url);
            entry.done = true;
          }
        }
      })
    );
    for (const [key, entry] of cache) {
      if (entry.done && (entry.until <= now() || cache.size > maxEntries)) cache.delete(key);
    }
  }
  return { sign };
}

export const WORKFLOW_TABLES = {
  sourcing: ["rfq_batches", "supplier_quotes", "project_files", "workflow_events", "intake_files", "intake_jobs"],
  production: [
    "rfq_batches",
    "supplier_quotes",
    "project_files",
    "production_updates",
    "shipment_documents",
    "inspection_reports"
  ],
  shipping: [
    "specifications",
    "production_updates",
    "packing_plans",
    "shipment_documents",
    "shipments",
    "quantity_adjustments",
    "handover_reports",
    "project_files"
  ]
};
