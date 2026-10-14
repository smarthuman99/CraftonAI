import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "vite";

// Build in memory so measurements cannot overwrite a release or its assets.
const result = await build({ publicDir: false, logLevel: "error", build: { write: false } });
const output = [result].flat().flatMap((entry) => entry.output || []);
const chunks = output.filter((entry) => entry.type === "chunk");
const initial = new Set();
function visit(name) {
  if (initial.has(name)) return;
  initial.add(name);
  const chunk = chunks.find((entry) => entry.fileName === name);
  chunk?.imports.forEach(visit);
}
chunks.filter((entry) => entry.isEntry).forEach((entry) => visit(entry.fileName));
const assets = output.map((entry) => {
  const bytes = Buffer.from(entry.type === "chunk" ? entry.code : entry.source);
  return {
    file: entry.fileName,
    bytes: bytes.length,
    gzip: gzipSync(bytes).length,
    initial: initial.has(entry.fileName)
  };
});
const report = {
  measuredAt: new Date().toISOString(),
  initialJavaScriptBytes: assets.filter((entry) => entry.initial).reduce((sum, entry) => sum + entry.bytes, 0),
  initialJavaScriptGzip: assets.filter((entry) => entry.initial).reduce((sum, entry) => sum + entry.gzip, 0),
  assets
};
if (process.argv[2]) {
  await fs.mkdir(path.dirname(process.argv[2]), { recursive: true });
  await fs.writeFile(process.argv[2], JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
