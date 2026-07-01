import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createAiSupportReply } from "./lib/aiSupportAgent.mjs";

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

  if (req.method !== "POST" || req.url !== "/api/ai-support-chat") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const requestId = randomUUID();

  try {
    const body = await readJsonBody(req);
    const result = await createAiSupportReply({
      messages: body.messages,
      context: body.context
    });

    sendJson(res, 200, result);
  } catch (err) {
    logSupportError(requestId, err);
    console.error(`AI support chat failed [${requestId}]:`, err);
    sendJson(res, 500, {
      error: "Crafton AI customer service is temporarily unavailable. Please try again shortly.",
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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
      if (body.length > 120_000) {
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
