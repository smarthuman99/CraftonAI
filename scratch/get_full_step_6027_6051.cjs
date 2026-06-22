const fs = require('fs');
const readline = require('readline');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\bb8cf887-15dc-442b-8106-09161bd4fb60\\.system_generated\\logs\\transcript_full.jsonl";
const targetSteps = [6027, 6051];

if (!fs.existsSync(transcriptPath)) {
  console.log("Transcript not found at", transcriptPath);
  process.exit(1);
}

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    const step = obj.step_index;
    if (targetSteps.includes(step)) {
      console.log(`\n==================================================`);
      console.log(`STEP ${step} - Type: ${obj.type}`);
      if (obj.tool_calls) {
        obj.tool_calls.forEach((tc, tcIdx) => {
          console.log(`  Tool call ${tcIdx}: ${tc.name}`);
          let args = tc.args || tc.arguments;
          if (args) {
            if (typeof args === 'string') {
              try { args = JSON.parse(args); } catch(e) {}
            }
            const outPath = `e:\\CraftonAI\\scratch\\step_${step}_tc_${tcIdx}_args_full.json`;
            fs.writeFileSync(outPath, JSON.stringify(args, null, 2));
            console.log(`  Wrote UNTRUNCATED args to ${outPath}`);
          }
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
});
