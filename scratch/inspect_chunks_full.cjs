const fs = require('fs');
const raw = fs.readFileSync('scratch/extracted_step_86.json', 'utf8');
const obj = JSON.parse(raw);
const tc = obj.tool_calls[0];
let args = tc.args || {};
if (typeof args === 'string') {
  args = JSON.parse(args);
}
let chunks = args.ReplacementChunks;
if (typeof chunks === 'string') {
  chunks = JSON.parse(chunks);
}

chunks.forEach((chunk, idx) => {
  console.log(`\n======================================== CHUNK ${idx} ========================================`);
  console.log(`StartLine: ${chunk.StartLine}, EndLine: ${chunk.EndLine}`);
  console.log(`\nTARGET CONTENT:\n${chunk.TargetContent}`);
  console.log(`\nREPLACEMENT CONTENT:\n${chunk.ReplacementContent}`);
});
