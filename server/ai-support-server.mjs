import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createAiSupportReply } from "./lib/aiSupportAgent.mjs";
import { createSupabaseAdmin } from "./lib/supabaseAdmin.mjs";
import { createRfqDraft } from "./lib/rfqGenerator.mjs";
import { dispatchRfqEmails, getRfqDispatchStatus } from "./lib/rfqDispatch.mjs";
import { buildEmailAttachmentsFromSupabase, enrichRfqContextFromSupabase } from "./lib/rfqSourceData.mjs";
import { createQuoteAnalysis } from "./lib/quoteAnalyzer.mjs";
import { createOperationsPlan } from "./lib/operationsAutomation.mjs";
import {
  analyzeProductionProject,
  approveSupplierProductionPlan,
  createSupplierPortalAccount,
  loadSupplierProductionWorkspace,
  monitorActiveProduction,
  submitSupplierProductionEvidence,
  submitSupplierProductionPlan
} from "./lib/supplierProductionPortal.mjs";
import { loadOperationsContext, loadQuoteAnalysisContext } from "./lib/workflowContext.mjs";

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
        const { supabase } = await requireCraftonStaff(req);
        const context = await enrichRfqContextFromSupabase({ supabase, context: body.context });
        result = await createRfqDraft({ context });
      } else if (body.action === "rfq_dispatch_status") {
        await requireCraftonStaff(req);
        result = getRfqDispatchStatus();
      } else if (body.action === "dispatch_rfq") {
        const { supabase } = await requireCraftonStaff(req);
        const sourceAttachments = await buildEmailAttachmentsFromSupabase({
          supabase,
          projectId: body.projectId,
          document: body.document
        });
        result = await dispatchRfqEmails({
          rfqCode: String(body.rfqCode || "RFQ"),
          document: body.document || {},
          suppliers: body.suppliers || [],
          attachments: sourceAttachments.attachments,
          omittedAttachments: sourceAttachments.omitted
        });
      } else if (body.action === "analyze_quotes") {
        const { supabase } = await requireCraftonStaff(req);
        const context = await loadQuoteAnalysisContext({
          supabase,
          projectId: body.projectId,
          rfqBatchId: body.rfqBatchId
        });
        result = await createQuoteAnalysis(context);
      } else if (body.action === "generate_operations_plan") {
        const { supabase } = await requireCraftonStaff(req);
        const context = await loadOperationsContext({ supabase, projectId: body.projectId });
        result = await createOperationsPlan(context, body.scope || "all");
      } else if (body.action === "create_supplier_portal_account") {
        const { supabase } = await requireCraftonStaff(req);
        result = await createSupplierPortalAccount({
          supabase,
          supplierId: body.supplierId,
          projectId: body.projectId
        });
      } else if (body.action === "supplier_production_workspace") {
        const { supabase, user } = await requireAuthenticatedUser(req);
        result = await loadSupplierProductionWorkspace({ supabase, user });
      } else if (body.action === "submit_supplier_production_evidence") {
        const { supabase, user } = await requireAuthenticatedUser(req);
        result = await submitSupplierProductionEvidence({ supabase, user, body });
      } else if (body.action === "submit_supplier_production_plan") {
        const { supabase, user } = await requireAuthenticatedUser(req);
        result = await submitSupplierProductionPlan({ supabase, user, body });
      } else if (body.action === "approve_supplier_production_plan") {
        const { supabase, user } = await requireCraftonStaff(req);
        result = await approveSupplierProductionPlan({ supabase, user, body });
      } else if (body.action === "analyze_production_progress") {
        const { supabase } = await requireCraftonStaff(req);
        result = await analyzeProductionProject({ supabase, projectId: body.projectId });
      } else {
        result = await createAiSupportReply({ messages: body.messages, context: body.context });
      }
    } else if (req.url === "/api/ai-rfq-generate") {
      const { supabase } = await requireCraftonStaff(req);
      const context = await enrichRfqContextFromSupabase({ supabase, context: body.context });
      result = await createRfqDraft({ context });
    } else if (req.url === "/api/rfq-dispatch") {
      const { supabase } = await requireCraftonStaff(req);
      const sourceAttachments = await buildEmailAttachmentsFromSupabase({
        supabase,
        projectId: body.projectId,
        document: body.document
      });
      result = await dispatchRfqEmails({
        rfqCode: String(body.rfqCode || "RFQ"),
        document: body.document || {},
        suppliers: body.suppliers || [],
        attachments: sourceAttachments.attachments,
        omittedAttachments: sourceAttachments.omitted
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
  scheduleProductionMonitor();
});

function scheduleProductionMonitor() {
  const intervalMs = Math.max(60_000, Number(process.env.PRODUCTION_MONITOR_INTERVAL_MS || 15 * 60_000));
  const run = async () => {
    try {
      const result = await monitorActiveProduction({ supabase: createSupabaseAdmin() });
      if (result.riskChanges) console.log("AI production monitor updated risk states:", result);
    } catch (error) {
      logSupportError("production-monitor", error);
      console.error("AI production monitor failed:", error.message || error);
    }
  };
  const initial = setTimeout(run, Math.min(30_000, intervalMs));
  const recurring = setInterval(run, intervalMs);
  initial.unref?.();
  recurring.unref?.();
}

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
  const token = String(req.headers.authorization || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!token) {
    const error = new Error("A Supabase login is required.");
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
  return { user: data.user, supabase };
}

async function requireCraftonStaff(req) {
  const context = await requireAuthenticatedUser(req);
  const role = String(context.user?.app_metadata?.role || "").toLowerCase();
  const email = String(context.user?.email || "").toLowerCase();
  if (!["staff", "admin"].includes(role) && !email.endsWith("@crafton.com")) {
    const error = new Error("A Crafton staff login is required for this action.");
    error.statusCode = 403;
    throw error;
  }
  return context;
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
