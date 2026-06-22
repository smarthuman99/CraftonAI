const fs = require('fs');
const raw = fs.readFileSync('scratch/extracted_step_226.json', 'utf8');
const obj = JSON.parse(raw);
const tc = obj.tool_calls[0];
let args = tc.args || {};
if (typeof args === 'string') {
  args = JSON.parse(args);
}
console.log("Step 226 Tool:", tc.name);
console.log("Description:", args.Description);
console.log("Instruction:", args.Instruction);
if (tc.name === 'replace_file_content') {
  console.log("Target:\n", args.TargetContent);
  console.log("Replacement:\n", args.ReplacementContent);
} else {
  console.log("Chunks:", args.ReplacementChunks.length);
}
