export function createThumbnailCache(request, { maxEntries = 240, now = Date.now } = {}) {
  const cache = new Map();
  let active = 0;
  const queue = [];
  const pump = () => {
    while (active < 3 && queue.length) {
      const task = queue.shift();
      active++;
      task().finally(() => {
        active--;
        pump();
      });
    }
  };
  return (reference) => {
    const key = JSON.stringify(reference);
    const cached = cache.get(key);
    if (cached && cached.until > now()) return cached.promise;
    const entry = { until: now() + 8 * 60 * 1000 };
    entry.promise = new Promise((resolve, reject) => {
      queue.push(async () => {
        try {
          const data = await request({ action: "portal_thumbnail", ...reference });
          if (!data.image) cache.delete(key);
          entry.done = true;
          resolve(data.image || "");
        } catch (error) {
          cache.delete(key);
          reject(error);
        }
        for (const [k, v] of cache) if (cache.size > maxEntries && v.done) cache.delete(k);
      });
    });
    cache.set(key, entry);
    pump();
    return entry.promise;
  };
}
