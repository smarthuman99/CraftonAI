import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createAiSupportReply } from "./lib/aiSupportAgent.mjs";
import { createSupabaseAdmin } from "./lib/supabaseAdmin.mjs";
import { createRfqDraft } from "./lib/rfqGenerator.mjs";
import { dispatchRfqEmails } from "./lib/rfqDispatch.mjs";

const port = Number(process.env.AI_SUPPORT_PORT || 8787);
const logDir = path.resolve("server", "logs");
const logFile = path.join(logDir, "ai-support.log");
const allowedOrigins = (process.env.AI_SUPPORT_ALLOWED_ORIGINS || "http://127.0.0.1:8000,http://localhost:8000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  setCorsHeaders(res, origin);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const requestId = randomUUID();

  try {
    const body = await readJsonBody(req);
    let result;

    if (req.url === "/api/ai-support-chat") {
      if (body.action === "generate_rfq") {
        await requireAuthenticatedUser(req);
        result = await createRfqDraft({ context: body.context });
      } else if (body.action === "dispatch_rfq") {
        await requireAuthenticatedUser(req);
        result = await dispatchRfqEmails({
          rfqCode: String(body.rfqCode || "RFQ"),
          document: body.document || {},
          suppliers: body.suppliers || []
        });
      } else {
        result = await createAiSupportReply({ messages: body.messages, context: body.context });
      }
    } else if (req.url === "/api/ai-rfq-generate") {
      await requireAuthenticatedUser(req);
      result = await createRfqDraft({ context: body.context });
    } else if (req.url === "/api/rfq-dispatch") {
      await requireAuthenticatedUser(req);
      result = await dispatchRfqEmails({
        rfqCode: String(body.rfqCode || "RFQ"),
        document: body.document || {},
        suppliers: body.suppliers || []
      });
    } else {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    sendJson(res, 200, result);
  } catch (err) {
    logSupportError(requestId, err);
    console.error(`AI support chat failed [${requestId}]:`, err);
    sendJson(res, Number(err?.statusCode || 500), {
      error: err?.statusCode ? err.message : "Crafton AI service is temporarily unavailable. Please try again shortly.",
      requestId
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Crafton AI Support server listening on http://127.0.0.1:${port}`);
});

function setCorsHeaders(res, origin) {
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "http://127.0.0.1:8000";
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 500_000) {
        req.destroy();
        reject(new Error("Request body too large."));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

async function requireAuthenticatedUser(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    const error = new Error("A Supabase staff login is required.");
    error.statusCode = 401;
    throw error;
  }

  const supabase = createSupabaseAdmin();
  const { data, error: authError } = await supabase.auth.getUser(token);
  if (authError || !data?.user) {
    const error = new Error("The Supabase login session is invalid or expired.");
    error.statusCode = 401;
    throw error;
  }
  return data.user;
}

function logSupportError(requestId, err) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(
      logFile,
      JSON.stringify({
        at: new Date().toISOString(),
        requestId,
        name: err?.name,
        message: err?.message,
        stack: err?.stack?.split("\n").slice(0, 5).join("\n")
      }) + "\n",
      "utf8"
    );
  } catch (logErr) {
    console.error("Failed to write AI support log:", logErr);
  }
}
