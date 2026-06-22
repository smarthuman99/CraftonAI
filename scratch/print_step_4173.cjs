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
    if (obj.step_index === 4173) {
      console.log(`Step 4173 keys:`, Object.keys(obj));
      if (obj.tool_calls) {
        console.log(`Tool calls:`, JSON.stringify(obj.tool_calls, null, 2));
      }
      if (obj.content) {
        console.log(`Content length:`, obj.content.length);
        console.log(`Content prefix:`, obj.content.substring(0, 1000));
      }
    }
  } catch (err) {}
});
