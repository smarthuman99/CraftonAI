const fs = require('fs');

const raw = fs.readFileSync('scratch/extracted_step_230.json', 'utf8');
const obj = JSON.parse(raw);

console.log("Step index:", obj.step_index);
console.log("Source:", obj.source);
console.log("Type:", obj.type);

if (obj.tool_calls) {
  obj.tool_calls.forEach((tc, idx) => {
    console.log(`\nTool Call ${idx}: ${tc.name}`);
    let args = tc.args || {};
    if (typeof args === 'string') {
      try { args = JSON.parse(args); } catch(e){}
    }
    console.log("Description:", args.Description || args.description);
    console.log("Instruction:", args.Instruction || args.instruction);
    console.log("TargetFile:", args.TargetFile || args.targetFile);
    console.log("StartLine:", args.StartLine);
    console.log("EndLine:", args.EndLine);
    if (args.TargetContent) {
      console.log("\nTargetContent (first 200 chars):\n", args.TargetContent.substring(0, 200));
    }
    if (args.ReplacementContent) {
      console.log("\nReplacementContent (first 200 chars):\n", args.ReplacementContent.substring(0, 200));
    }
  });
}
