const fs = require('fs');

const step86Raw = fs.readFileSync("scratch/extracted_step_86.json", "utf8");
const step86Obj = JSON.parse(step86Raw);
let step86Args = step86Obj.tool_calls[0].args || step86Obj.tool_calls[0].arguments;
if (typeof step86Args === 'string') step86Args = JSON.parse(step86Args);
let step86Chunks = step86Args.ReplacementChunks || step86Args.replacementChunks;
if (typeof step86Chunks === 'string') step86Chunks = JSON.parse(step86Chunks);

console.log("=== CHUNK 1 TARGET ===");
console.log(step86Chunks[1].TargetContent);
console.log("\n=== CHUNK 1 REPLACEMENT ===");
console.log(step86Chunks[1].ReplacementContent);
