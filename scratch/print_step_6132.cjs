const fs = require('fs');
const path = require('path');

const filePath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\00efd457-699e-4577-800f-e7b993a16f1b\\scratch\\step_6132_details.json";
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const chunk0 = data.tool_calls[0].args.ReplacementChunks[0].ReplacementContent;
const lines = chunk0.split('\n');
console.log("=== FIRST 60 LINES ===");
for (let i = 0; i < 60 && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
