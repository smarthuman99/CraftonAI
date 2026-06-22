const fs = require('fs');
const path = require('path');

const scratchDir = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\00efd457-699e-4577-800f-e7b993a16f1b\\scratch";
const keywords = ["handleIntakeFlowSubmit", "modalTextBrief", "modalFilePreloaded"];

if (fs.existsSync(scratchDir)) {
  const files = fs.readdirSync(scratchDir);
  files.forEach(file => {
    if (file.endsWith('.json') || file.endsWith('.jsx') || file.endsWith('.txt')) {
      const filePath = path.join(scratchDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      keywords.forEach(kw => {
        if (content.includes(kw)) {
          console.log(`[Scratch] File ${file} contains keyword: ${kw}`);
        }
      });
    }
  });
} else {
  console.log("scratchDir doesn't exist at path:", scratchDir);
}
