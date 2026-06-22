const fs = require('fs');
const readline = require('readline');
const path = require('path');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\bb8cf887-15dc-442b-8106-09161bd4fb60\\.system_generated\\logs\\transcript.jsonl";
const scratchDir = "e:\\CraftonAI\\scratch";

const stepsToExtract = [3447, 3451, 3455, 3461, 3469, 3991, 3995];

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (stepsToExtract.includes(obj.step_index)) {
      console.log(`FOUND STEP ${obj.step_index}!`);
      console.log(`  Source: ${obj.source}`);
      console.log(`  Type: ${obj.type}`);
      console.log(`  Status: ${obj.status}`);
      
      if (obj.tool_calls && obj.tool_calls.length > 0) {
        obj.tool_calls.forEach((tc, idx) => {
          console.log(`  Tool call ${idx}: name=${tc.name}`);
          const args = tc.args || tc.arguments;
          if (args) {
            const outName = `step_${obj.step_index}_tc_${idx}_args_full.json`;
            const outPath = path.join(scratchDir, outName);
            fs.writeFileSync(outPath, JSON.stringify(args, null, 2));
            console.log(`    Wrote full args to: ${outPath} (${fs.statSync(outPath).size} bytes)`);
          }
        });
      }
    }
  } catch (err) {
    console.error("Error parsing line:", err.message);
  }
});

rl.on('close', () => {
  console.log("Done searching transcript.");
});
