const fs = require('fs');
const readline = require('readline');

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
      console.log("STEP 3461 FOUND!");
      console.log("Source:", obj.source);
      console.log("Type:", obj.type);
      if (obj.tool_calls) {
        console.log("Tool calls count:", obj.tool_calls.length);
        obj.tool_calls.forEach((tc, idx) => {
          console.log(`Tool call ${idx}: name=${tc.name}`);
          let args = tc.args || tc.arguments;
          if (typeof args === 'object') {
            args = JSON.stringify(args, null, 2);
          }
          console.log(`Args length: ${args.length}`);
          fs.writeFileSync(`e:\\CraftonAI\\scratch\\step_3461_full_extracted.txt`, args);
          console.log("Wrote full step 3461 args to e:\\CraftonAI\\scratch\\step_3461_full_extracted.txt");
        });
      }
    }
  } catch (err) {}
});

rl.on('close', () => {
  console.log("Done searching.");
});
