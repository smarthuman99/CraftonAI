const fs = require('fs');
const readline = require('readline');
const path = require('path');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\bb8cf887-15dc-442b-8106-09161bd4fb60\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.step_index === 3461) {
      console.log("FOUND STEP 3461!");
      console.log("Source:", obj.source);
      console.log("Type:", obj.type);
      console.log("Status:", obj.status);
      if (obj.tool_calls) {
        console.log("Num tool calls:", obj.tool_calls.length);
        obj.tool_calls.forEach((tc, idx) => {
          console.log(`Tool call ${idx}: name=${tc.name}`);
          const args = tc.args || tc.arguments;
          if (args) {
            console.log(`  Args keys:`, Object.keys(args));
            const repl = args.ReplacementContent || args.replacementContent;
            if (repl) {
              console.log(`  ReplacementContent length in raw log:`, repl.length);
              console.log(`  ReplacementContent first 200 chars:`, repl.substring(0, 200));
              console.log(`  ReplacementContent last 200 chars:`, repl.substring(repl.length - 200));
            }
          }
        });
      }
    }
  } catch (err) {}
});
