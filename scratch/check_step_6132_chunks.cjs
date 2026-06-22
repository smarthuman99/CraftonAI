const fs = require('fs');

const filePath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\00efd457-699e-4577-800f-e7b993a16f1b\\scratch\\step_6132_details.json";
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log("Number of tool calls in step_6132:", data.tool_calls.length);
data.tool_calls.forEach((tc, idx) => {
  console.log(`Tool Call ${idx}: name=${tc.name}`);
  if (tc.args && tc.args.ReplacementChunks) {
    console.log("Replacement chunks count:", tc.args.ReplacementChunks.length);
    tc.args.ReplacementChunks.forEach((chunk, cidx) => {
      console.log(`  Chunk ${cidx}: StartLine=${chunk.StartLine}, EndLine=${chunk.EndLine}`);
    });
  }
});
