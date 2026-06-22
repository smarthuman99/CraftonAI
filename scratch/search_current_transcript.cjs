const fs = require('fs');
const readline = require('readline');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\00efd457-699e-4577-800f-e7b993a16f1b\\.system_generated\\logs\\transcript.jsonl";

if (!fs.existsSync(transcriptPath)) {
  console.log("Current transcript not found.");
  process.exit(1);
}

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  terminal: false
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      obj.tool_calls.forEach((tc) => {
        let args = tc.args || {};
        if (typeof args === 'string') {
          try { args = JSON.parse(args); } catch(e){}
        }
        const desc = args.Description || args.description || args.Instruction || args.instruction || "";
        console.log(`Step ${obj.step_index} | ${tc.name} | ${desc.substring(0, 100)}`);
      });
    }
  } catch (err) {}
});
