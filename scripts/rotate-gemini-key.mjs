import { readFile, writeFile, rename, stat, chmod, chown, realpath, unlink } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { parseEnv } from "node:util";
import { pathToFileURL } from "node:url";

const root = "/opt/crafton-ai";
const envPath = `${root}/server/.env`;
const units = ["crafton-intake-worker.service", "crafton-technical-drawing-worker.service"];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = (event, details = {}) => console.log(JSON.stringify({ event, ...details }));

export function replaceGeminiKey(original, key) {
  if (!/^[A-Za-z0-9._~+/=-]{20,4096}$/.test(key)) throw new Error("Invalid Gemini key format; expected a single token.");
  const pattern = /^([ \t]*(?:export[ \t]+)?GEMINI_API_KEY[ \t]*=)[^\r\n]*/gm;
  const matches = [...original.matchAll(pattern)];
  if (matches.length > 1) throw new Error("Duplicate GEMINI_API_KEY entries; manual review required.");
  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  return matches.length
    ? original.replace(pattern, (_, prefix) => `${prefix}${key}`)
    : `${original}${original.endsWith("\n") ? "" : newline}GEMINI_API_KEY=${key}${newline}`;
}

function serviceInfo(unit) {
  let raw;
  try {
    raw = execFileSync(
      "systemctl",
      [
        "show",
        unit,
        "--property=LoadState,ActiveState,SubState,MainPID,NRestarts,WorkingDirectory,ExecStart,Environment,EnvironmentFiles"
      ],
      { encoding: "utf8", timeout: 15000, stdio: ["ignore", "pipe", "pipe"] }
    );
  } catch {
    throw new Error(`Cannot inspect ${unit}`);
  }
  const fields = Object.fromEntries(
    raw
      .trim()
      .split("\n")
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at), line.slice(at + 1)];
      })
  );
  if (
    fields.LoadState !== "loaded" ||
    fields.WorkingDirectory !== root ||
    !fields.ExecStart?.includes("--env-file-if-exists=server/.env")
  )
    throw new Error(`Unexpected runtime configuration for ${unit}; no changes made.`);
  if (/\bGEMINI_API_KEY=/.test(fields.Environment || "") || fields.EnvironmentFiles)
    throw new Error(`Environment override detected for ${unit}; manual review required.`);
  return {
    unit,
    state: fields.ActiveState,
    substate: fields.SubState,
    pid: Number(fields.MainPID),
    restarts: Number(fields.NRestarts)
  };
}

async function apiJson(url, key, body) {
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json", "Api-Revision": body.apiRevision },
      body: JSON.stringify(body.payload),
      signal: AbortSignal.timeout(body.timeout || 90000)
    });
  } catch {
    throw new Error(`${body.label}: network failure or timeout.`);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const status = /^[A-Z_]{1,50}$/.test(data?.error?.status || "") ? data.error.status : "PROVIDER_ERROR";
    throw new Error(`${body.label}: HTTP ${response.status} ${status}.`);
  }
  if (!data) throw new Error(`${body.label}: invalid response.`);
  return data;
}

async function verifyModels(env, key) {
  const base = (env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
  const url = new URL(base);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash)
    throw new Error("Unexpected Gemini endpoint configuration.");
  const vision = env.GEMINI_VISION_MODEL || "gemini-3.6-flash";
  const drawing = env.THREE_VIEW_MODEL || "gemini-3.1-flash-image";
  const apiRevision = env.GEMINI_API_REVISION || "2026-05-20";
  // Synthetic input only. No project/customer records are sent by these probes.
  const image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=";
  const textResult = await apiJson(`${base}/models/${encodeURIComponent(vision)}:generateContent`, key, {
    label: "Gemini vision probe",
    apiRevision,
    timeout: 60000,
    payload: {
      contents: [
        {
          role: "user",
          parts: [
            { text: "Health check: acknowledge this tiny test image with just OK." },
            { inlineData: { mimeType: "image/png", data: image } }
          ]
        }
      ],
      generationConfig: { maxOutputTokens: 1024 }
    }
  });
  if (!textResult.candidates?.some((c) => c.content?.parts?.some((p) => typeof p.text === "string" && p.text.trim())))
    throw new Error("Gemini vision probe: no generated text.");
  report("vision_probe_passed", { model: vision, transport: "generateContent" });
  const drawingResult = await apiJson(`${base}/interactions`, key, {
    label: "Gemini drawing probe",
    apiRevision,
    timeout: 180000,
    payload: {
      model: drawing,
      input: [
        {
          type: "text",
          text: "Health-check image only: draw one simple black outline of a chair on a plain white background, no text."
        }
      ],
      response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: "1:1", image_size: "1K" }
    }
  });
  const { extractGeminiImage } = await import(pathToFileURL(`${root}/server/lib/technicalDrawing.mjs`).href);
  const generated = extractGeminiImage(drawingResult);
  if (!generated) throw new Error("Gemini drawing probe: no generated image.");
  report("drawing_probe_passed", { model: drawing, transport: "interactions", mime: generated.mimeType });
}

async function waitForIdle(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Cannot check worker activity.");
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/intake_jobs?select=status,items:result_json->items&status=in.(processing,needs_review,completed)&limit=1000`,
      {
        headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
        signal: AbortSignal.timeout(15000)
      }
    );
    if (!response.ok) throw new Error("Cannot verify worker activity; configuration unchanged.");
    const jobs = await response.json();
    if (!Array.isArray(jobs) || jobs.length >= 1000) throw new Error("Worker activity check is incomplete.");
    const busy = jobs.filter(
      (j) =>
        j.status === "processing" ||
        (j.items || []).some(
          (i) =>
            i.technical_drawing?.status === "generating" &&
            Date.now() - Date.parse(i.technical_drawing.started_at) < 30 * 60000
        )
    ).length;
    if (!busy) return;
    report("waiting_for_in_flight_work", { count: busy });
    await pause(10000);
  }
  throw new Error("Workers are still processing; configuration unchanged. Retry when idle.");
}

async function atomicEnvWrite(text, metadata) {
  const temporary = `${envPath}.gemini-next-${process.pid}`;
  try {
    await writeFile(temporary, text, { mode: 0o600, flag: "wx" });
    await chown(temporary, metadata.uid, metadata.gid);
    await chmod(temporary, 0o600);
    await rename(temporary, envPath);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

function restartWorkers() {
  try {
    execFileSync("systemctl", ["restart", ...units], { timeout: 120000, stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    throw new Error("Worker restart failed.");
  }
}

async function main() {
  const [mode, keyFile] = process.argv.slice(2);
  if (!["inspect", "rotate"].includes(mode)) throw new Error("Expected inspect or rotate.");
  if ((await realpath(envPath)) !== envPath) throw new Error("Unexpected environment file target.");
  const original = await readFile(envPath, "utf8");
  const metadata = await stat(envPath);
  const env = parseEnv(original);
  const before = units.map(serviceInfo);
  report("configuration", {
    path: envPath,
    geminiConfigured: Boolean(env.GEMINI_API_KEY),
    endpointHost: new URL(env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com").hostname,
    visionModel: env.GEMINI_VISION_MODEL || "gemini-3.6-flash",
    drawingModel: env.THREE_VIEW_MODEL || "gemini-3.1-flash-image",
    services: before
  });
  if (mode === "inspect") return;
  if (!keyFile || !keyFile.startsWith("/tmp/crafton-gemini-"))
    throw new Error("Expected a private temporary key file.");
  const key = (await readFile(keyFile, "utf8")).trim();
  const updated = replaceGeminiKey(original, key);
  await verifyModels(env, key);
  await waitForIdle(env);
  if ((await readFile(envPath, "utf8")) !== original)
    throw new Error("Configuration changed during verification; retry.");
  const backup = `${envPath}.before-gemini-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  await writeFile(backup, original, { mode: 0o600, flag: "wx" });
  await chown(backup, metadata.uid, metadata.gid);
  await atomicEnvWrite(updated, metadata);
  try {
    restartWorkers();
    await pause(12000);
    const after = units.map(serviceInfo);
    if (
      after.some(
        (s, i) =>
          s.state !== "active" || s.substate !== "running" || !s.pid || s.pid === before[i].pid || s.restarts > 0
      )
    )
      throw new Error("A worker did not restart cleanly.");
    const health = await fetch("http://127.0.0.1:8787/health", { signal: AbortSignal.timeout(10000) });
    if (!health.ok || !(await health.json()).ok) throw new Error("Crafton API health check failed.");
    if (parseEnv(await readFile(envPath, "utf8")).GEMINI_API_KEY !== key)
      throw new Error("Saved configuration verification failed.");
    report("rotation_verified", { backup, services: after, apiHealthy: true });
  } catch (error) {
    await atomicEnvWrite(original, metadata);
    restartWorkers();
    report("original_configuration_restored");
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    // Provider response bodies and keys must never be included in logs.
    report("maintenance_failed", {
      reason:
        error?.message?.includes("Gemini") ||
        /worker|configuration|runtime|environment|activity|target/i.test(error?.message || "")
          ? error.message
          : "Maintenance did not complete; inspect service/configuration state."
    });
    process.exitCode = 1;
  });
}
