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
  if (count < 5) {
    try {
      const obj = JSON.parse(line);
      console.log(`Line ${count}: step_index=${obj.step_index}, source=${obj.source}, type=${obj.type}`);
      if (obj.tool_calls) {
        console.log(`  tool_calls names:`, obj.tool_calls.map(tc => tc.name || tc.toolName));
      }
    } catch (e) {
      console.log(`Line ${count} parse error: ${e.message}`);
    }
    count++;
  } else {
    rl.close();
  }
});
