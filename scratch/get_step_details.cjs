const fs = require('fs');
const readline = require('readline');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\bb8cf887-15dc-442b-8106-09161bd4fb60\\.system_generated\\logs\\transcript.jsonl";

const targetSteps = [3447, 3451, 3455, 3461, 3469, 3991, 3995];

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
          const args = tc.args || tc.arguments;
          if (args) {
            fs.writeFileSync(`e:\\CraftonAI\\scratch\\step_${step}_tc_${tcIdx}_args.json`, JSON.stringify(args, null, 2));
            console.log(`  Wrote args to e:\\CraftonAI\\scratch\\step_${step}_tc_${tcIdx}_args.json`);
          }
        });
      }
    }
  } catch (err) {}
});
