const fs = require('fs');
const readline = require('readline');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\bb8cf887-15dc-442b-8106-09161bd4fb60\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  output: process.stdout,
  terminal: false
});

let count = 0;
rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      obj.tool_calls.forEach((tc, idx) => {
        if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
          const args = tc.args || tc.arguments;
          if (args) {
            const targetFile = args.TargetFile || args.targetFile;
            if (targetFile && targetFile.includes('app.jsx')) {
              console.log(`Step ${obj.step_index} (${obj.source}): ${tc.name}`);
              console.log(`  Description: ${args.Description || args.description}`);
              console.log(`  Instruction: ${args.Instruction || args.instruction}`);
              count++;
            }
          }
        }
      });
    }
  } catch (err) {}
});

rl.on('close', () => {
  console.log(`\nTotal edits found on app.jsx: ${count}`);
});
