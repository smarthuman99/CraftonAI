const fs = require('fs');

const file = "src/app_reconstructed_v3.jsx";
if (!fs.existsSync(file)) {
  console.log("File not found:", file);
  process.exit(1);
}

const buf = fs.readFileSync(file);
const pattern = "BespokeFurniture";
const patternBuf = Buffer.from(pattern, 'ascii');

let foundCount = 0;
let idx = buf.indexOf(patternBuf);
while (idx !== -1) {
  foundCount++;
  console.log(`Found pattern "${pattern}" at byte offset ${idx}`);
  // Let's print some bytes around it
  const start = Math.max(0, idx - 50);
  const end = Math.min(buf.length, idx + pattern.length + 50);
  const snippet = buf.slice(start, end);
  console.log("Snippet bytes:", snippet.toString('hex'));
  console.log("Snippet text (ascii):", snippet.toString('ascii').replace(/[\x00-\x1F\x7F-\xFF]/g, '.'));
  idx = buf.indexOf(patternBuf, idx + 1);
}

console.log(`Total found: ${foundCount}`);
