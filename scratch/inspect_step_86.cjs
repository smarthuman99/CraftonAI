const fs = require('fs');

const raw = fs.readFileSync('scratch/extracted_step_86.json', 'utf8');
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
    
    if (args.ReplacementChunks) {
      let chunks = args.ReplacementChunks;
      if (typeof chunks === 'string') {
        try { chunks = JSON.parse(chunks); } catch(e){}
      }
      console.log(`Number of chunks: ${chunks.length}`);
      chunks.forEach((chunk, cIdx) => {
        console.log(`\n  --- Chunk ${cIdx} ---`);
        console.log(`  StartLine: ${chunk.StartLine}, EndLine: ${chunk.EndLine}`);
        console.log(`  TargetContent (first 100 chars):\n  `, (chunk.TargetContent || "").substring(0, 100));
        console.log(`  ReplacementContent (first 100 chars):\n  `, (chunk.ReplacementContent || "").substring(0, 100));
      });
    }
  });
}
