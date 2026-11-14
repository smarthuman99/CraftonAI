import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createConciergeService } from "./lib/projectConcierge.mjs";
import { demoConciergeStore, demoClient, demoReviewer } from "./lib/projectConciergeDemo.mjs";

const folder = path.resolve("server/.cache/support-demo");
const file = path.join(folder, "transcripts.json");
fs.mkdirSync(folder, { recursive: true });
const state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : undefined;
const service = createConciergeService({
  store: demoConciergeStore({
    state,
    persist(next) {
      fs.writeFileSync(`${file}.tmp`, JSON.stringify(next, null, 2), { mode: 0o600 });
      fs.renameSync(`${file}.tmp`, file);
    }
  })
});
http
  .createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    // Local fixture server: no production authentication or database connection.
    if (
      !/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || "") ||
      (req.headers.origin && !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(req.headers.origin))
    ) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: "Local demo only." }));
      return;
    }
    if (req.method === "GET" && req.url === "/health") {
      res.end(
        JSON.stringify({ ok: true, mode: "synthetic-demo", modelConfigured: Boolean(process.env.DEEPSEEK_API_KEY) })
      );
      return;
    }
    if (req.method !== "POST" || req.url !== "/api/support-demo") {
      res.writeHead(404);
      res.end("{}");
      return;
    }
    try {
      if (!req.headers["content-type"]?.startsWith("application/json"))
        throw Object.assign(new Error("JSON required."), { statusCode: 415 });
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 16000) throw Object.assign(new Error("Message too large."), { statusCode: 413 });
      }
      const body = JSON.parse(raw);
      const user = req.headers["x-demo-view"] === "review" ? demoReviewer : demoClient;
      res.end(JSON.stringify(await service({ user, body })));
    } catch (error) {
      res.writeHead(error.statusCode || 500);
      res.end(JSON.stringify({ error: error.statusCode ? error.message : "Demo request failed. Please retry." }));
    }
  })
  .listen(8788, "127.0.0.1", () =>
    console.log("Project support demo API: http://127.0.0.1:8788 (synthetic data; disk-backed transcripts)")
  );
