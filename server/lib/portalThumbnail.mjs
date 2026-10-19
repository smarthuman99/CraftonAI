import sharp from "sharp";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
const error = (message, statusCode) => Object.assign(new Error(message), { statusCode });
export const isPortalStaff = (user) =>
  ["staff", "admin"].includes(user?.app_metadata?.role) || /@crafton\.com$/i.test(user?.email || "");

export async function resizePortalThumbnail(bytes) {
  if (bytes.length > 20 * 1024 * 1024) throw error("Image exceeds preview limit.", 413);
  return sharp(bytes, { limitInputPixels: 25_000_000, animated: false })
    .rotate()
    .resize({ width: 320, height: 240, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 68 })
    .toBuffer();
}

// The browser supplies record identity only, never a source URL or filesystem path.
// Authorization is checked before every cache hit. Outputs contain no EXIF metadata.
export function createThumbnailService({
  cacheDir = path.resolve("server/.cache/portal-thumbnails"),
  resize = resizePortalThumbnail
} = {}) {
  const pending = new Map();
  let running = 0;
  const waiting = [];
  async function bounded(task) {
    if (running >= 2) {
      if (waiting.length >= 48) throw error("Preview queue is busy. Please retry.", 429);
      await new Promise((resolve) => waiting.push(resolve));
    } else running++;
    try {
      return await task();
    } finally {
      const next = waiting.shift();
      if (next) next();
      else running--;
    }
  }
  async function prune() {
    const names = (await fs.readdir(cacheDir)).filter((n) => /^[a-f0-9]{64}\.webp$/.test(n));
    if (names.length <= 512) return;
    const files = (
      await Promise.all(
        names.map(async (name) =>
          fs
            .stat(path.join(cacheDir, name))
            .then((stat) => ({ name, at: stat.mtimeMs }))
            .catch(() => null)
        )
      )
    ).filter(Boolean);
    files.sort((a, b) => a.at - b.at);
    await Promise.all(
      files.slice(0, files.length - 480).map((f) => fs.unlink(path.join(cacheDir, f.name)).catch(() => {}))
    );
  }
  return async ({ supabase, user, body }) => {
    if (!user?.id) throw error("Login required.", 401);
    const { jobId, index, kind = "image" } = body;
    if (
      !/^[0-9a-f-]{36}$/i.test(jobId || "") ||
      !Number.isInteger(index) ||
      index < -1 ||
      !["image", "drawing"].includes(kind)
    )
      throw error("Invalid preview reference.", 400);
    const { data: row, error: readError } = await supabase
      .from("portal_job_summaries")
      .select("job_id,owner_id,items,source,updated_at")
      .eq("job_id", jobId)
      .maybeSingle();
    if (readError) throw readError;
    if (!row || (!isPortalStaff(user) && row.owner_id !== user.id)) throw error("Preview not found.", 404);
    const item = index === -1 ? row.source : row.items[index];
    const source = kind === "drawing" ? item?.drawing : item;
    if (!source?.bucket || !source?.path || (index === -1 && !source.mime?.startsWith("image/")))
      return { image: null };
    const key = createHash("sha256")
      .update(JSON.stringify(["v1", source.bucket, source.path, row.updated_at, kind]))
      .digest("hex");
    const file = path.join(cacheDir, `${key}.webp`);
    let data = await fs.readFile(file).catch(() => null);
    if (!data) {
      if (!pending.has(key))
        pending.set(
          key,
          bounded(async () => {
            const { data: blob, error: downloadError } = await supabase.storage
              .from(source.bucket)
              .download(source.path);
            if (downloadError) throw downloadError;
            if (!blob || blob.size > 20 * 1024 * 1024) throw error("Image exceeds preview limit.", 413);
            const image = await resize(Buffer.from(await blob.arrayBuffer()));
            await fs.mkdir(cacheDir, { recursive: true, mode: 0o700 });
            const temporary = `${file}.${process.pid}.tmp`;
            await fs.writeFile(temporary, image, { mode: 0o600 });
            await fs.rename(temporary, file);
            await prune();
            return image;
          }).finally(() => pending.delete(key))
        );
      data = await pending.get(key);
    }
    return { image: `data:image/webp;base64,${data.toString("base64")}`, bytes: data.length, version: row.updated_at };
  };
}
export const portalThumbnail = createThumbnailService();
