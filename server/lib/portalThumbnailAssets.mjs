import fs from "node:fs/promises";
import path from "node:path";
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { isPortalStaff, resizePortalThumbnail } from "./portalThumbnail.mjs";
import { THUMBNAIL_SPEC, thumbnailReferenceKey } from "../../shared/portalThumbnailIdentity.mjs";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const fail = (message, statusCode) => Object.assign(new Error(message), { statusCode });
const hashPattern = /^[a-f0-9]{64}$/;
export const thumbnailSourceKey = (source) => digest(JSON.stringify([THUMBNAIL_SPEC, source.bucket, source.path]));
export const thumbnailRoot = () => path.resolve(process.env.PORTAL_THUMBNAIL_DIR || "server/.cache/portal-assets");
export function sourcesForSummary(row) {
  const refs = [];
  if (row.source?.mime?.startsWith("image/")) refs.push(row.source);
  for (const item of row.items || []) refs.push(item, item.drawing);
  return [...new Map(refs.filter((s) => s?.bucket && s?.path).map((s) => [thumbnailSourceKey(s), s])).values()];
}

export function createThumbnailAssets({ root = thumbnailRoot(), resize = resizePortalThumbnail, now = Date.now } = {}) {
  const records = path.join(root, "records"),
    files = path.join(root, "files");
  const inProgress = new Map();
  let secret;
  async function initialize() {
    await Promise.all([
      fs.mkdir(records, { recursive: true, mode: 0o700 }),
      fs.mkdir(files, { recursive: true, mode: 0o700 })
    ]);
  }
  async function signingSecret() {
    if (!secret)
      secret = (async () => {
        await initialize();
        const filename = path.join(root, "signing-key");
        // Atomic create. Never rotate on API/worker restart, nor print this key.
        try {
          await fs.writeFile(filename, randomBytes(32), { flag: "wx", mode: 0o600 });
        } catch (error) {
          if (error.code !== "EEXIST") throw error;
        }
        const value = await fs.readFile(filename);
        if (value.length !== 32) throw new Error("Invalid thumbnail signing key");
        return value;
      })();
    return secret;
  }
  async function read(source) {
    if (!source?.bucket || !source?.path) return null;
    try {
      const record = JSON.parse(await fs.readFile(path.join(records, `${thumbnailSourceKey(source)}.json`), "utf8"));
      if (record.spec !== THUMBNAIL_SPEC || !hashPattern.test(record.hash)) return null;
      await fs.access(path.join(files, `${record.hash}.webp`));
      return record;
    } catch {
      return null;
    }
  }
  async function prepare(supabase, source) {
    const key = thumbnailSourceKey(source);
    if (inProgress.has(key)) return inProgress.get(key);
    const pending = (async () => {
      await initialize();
      const bucket = supabase.storage.from(source.bucket);
      const { data: info, error: infoError } = await bucket.info(source.path);
      if (infoError || !info) throw infoError || new Error("Missing source metadata");
      const fingerprint = JSON.stringify([
        info.version || "",
        info.eTag || info.etag || "",
        info.lastModified || info.updatedAt || "",
        info.size
      ]);
      const existing = await read(source);
      if (existing?.fingerprint === fingerprint && existing.sourceRevision === (source.revision || ""))
        return { ...existing, generated: false };
      const { data: blob, error: downloadError } = await bucket.download(source.path);
      if (downloadError || !blob) throw downloadError || new Error("Source unavailable");
      if (blob.size > 20 * 1024 * 1024) throw fail("Image exceeds preview limit.", 413);
      const original = Buffer.from(await blob.arrayBuffer());
      const hash = digest(Buffer.concat([Buffer.from(THUMBNAIL_SPEC), original]));
      const filename = path.join(files, `${hash}.webp`);
      let bytes;
      try {
        bytes = (await fs.stat(filename)).size;
      } catch {
        const image = await resize(original);
        bytes = image.length;
        const temp = `${filename}.${randomUUID()}.tmp`;
        await fs.writeFile(temp, image, { mode: 0o600 });
        await fs.rename(temp, filename);
      }
      const record = {
        spec: THUMBNAIL_SPEC,
        fingerprint,
        sourceRevision: source.revision || "",
        hash,
        bytes,
        checkedAt: new Date(now()).toISOString()
      };
      const recordFile = path.join(records, `${key}.json`),
        temp = `${recordFile}.${randomUUID()}.tmp`;
      await fs.writeFile(temp, JSON.stringify(record), { mode: 0o600 });
      await fs.rename(temp, recordFile);
      return { ...record, generated: true };
    })().finally(() => inProgress.delete(key));
    inProgress.set(key, pending);
    return pending;
  }
  const sign = async (hash, expires, owner) =>
    createHmac("sha256", await signingSecret())
      .update(`${hash}:${expires}:${owner}`)
      .digest("hex");
  async function authorizeBatch({ supabase, user, body }) {
    if (!user?.id) throw fail("Login required.", 401);
    const refs = body.references;
    if (!Array.isArray(refs) || refs.length < 1 || refs.length > 24) throw fail("Request 1–24 previews.", 400);
    for (const ref of refs) {
      if (
        !/^[0-9a-f-]{36}$/i.test(ref?.jobId || "") ||
        !Number.isInteger(ref.index) ||
        ref.index < -1 ||
        !["image", "drawing"].includes(ref.kind || "image")
      )
        throw fail("Invalid preview reference.", 400);
    }
    const ids = [...new Set(refs.map((r) => r.jobId))];
    const { data, error } = await supabase
      .from("portal_job_summaries")
      .select("job_id,project_id,owner_id,items,source")
      .in("job_id", ids);
    if (error) throw error;
    const rows = new Map((data || []).map((row) => [row.job_id, row]));
    // Validate the entire batch before issuing any capability. Client paths are never trusted.
    for (const ref of refs) {
      const row = rows.get(ref.jobId);
      if (!row || (!isPortalStaff(user) && row.owner_id !== user.id)) throw fail("Preview not found.", 404);
      if (body.projectId && row.project_id !== body.projectId) throw fail("Project mismatch.", 404);
    }
    // Stable 10-minute windows, links valid 5–15 minutes; private browser cache only.
    const expires = Math.floor(now() / 600000) * 600 + 900;
    const images = await Promise.all(
      refs.map(async (ref) => {
        const row = rows.get(ref.jobId),
          item = ref.index === -1 ? row.source : row.items[ref.index];
        const source = ref.kind === "drawing" ? item?.drawing : item;
        const key = thumbnailReferenceKey(ref);
        if (!source?.bucket || !source?.path || (ref.index === -1 && !source.mime?.startsWith("image/")))
          return { key, status: "missing" };
        const record = await read(source);
        if (!record || record.sourceRevision !== (source.revision || "")) return { key, status: "pending" };
        const signature = await sign(record.hash, expires, user.id);
        const query = new URLSearchParams({
          thumbnail: record.hash,
          expires: String(expires),
          owner: user.id,
          signature
        });
        return {
          key,
          status: "ready",
          url: `/api/ai-support-chat?${query}`,
          expiresAt: expires * 1000,
          version: record.hash,
          bytes: record.bytes
        };
      })
    );
    return { images };
  }
  async function imageResponse(url, ifNoneMatch = "") {
    const hash = url.searchParams.get("thumbnail"),
      expiresText = url.searchParams.get("expires") || "";
    const expires = Number(expiresText),
      owner = url.searchParams.get("owner") || "",
      supplied = url.searchParams.get("signature") || "";
    if (
      !hashPattern.test(hash || "") ||
      !hashPattern.test(supplied) ||
      !/^\d+$/.test(expiresText) ||
      !owner ||
      expires <= now() / 1000 ||
      expires > now() / 1000 + 900
    )
      throw fail("Preview link expired or invalid.", 403);
    const expected = await sign(hash, expires, owner);
    if (!timingSafeEqual(Buffer.from(supplied, "hex"), Buffer.from(expected, "hex")))
      throw fail("Invalid preview link.", 403);
    const etag = `"${hash}"`;
    const headers = {
      "Content-Type": "image/webp",
      "Cache-Control": `private, max-age=${Math.max(0, Math.floor(expires - now() / 1000))}`,
      ETag: etag,
      "X-Content-Type-Options": "nosniff"
    };
    // Authorization/expiry is checked even on conditional requests.
    if (ifNoneMatch === etag) return { status: 304, headers, bytes: null };
    try {
      return { status: 200, headers, bytes: await fs.readFile(path.join(files, `${hash}.webp`)) };
    } catch {
      throw fail("Preview unavailable.", 404);
    }
  }
  return { read, prepare, authorizeBatch, imageResponse };
}
export const portalThumbnailAssets = createThumbnailAssets();
