const fs = require('fs');
const path = require('path');

const filePath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\00efd457-699e-4577-800f-e7b993a16f1b\\scratch\\step_6132_details.json";
const content = fs.readFileSync(filePath, 'utf8');

const target = "activeIntakeModal";
let idx = 0;
while ((idx = content.indexOf(target, idx)) !== -1) {
  console.log(`\n=== Found activeIntakeModal at index ${idx} ===`);
  const start = Math.max(0, idx - 100);
  const end = Math.min(content.length, idx + target.length + 100);
  console.log(content.slice(start, end).replace(/\n/g, ' '));
  idx += target.length;
}
