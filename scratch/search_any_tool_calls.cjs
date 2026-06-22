const fs = require('fs');
const readline = require('readline');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\bb8cf887-15dc-442b-8106-09161bd4fb60\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  output: process.stdout,
  terminal: false
});

const found = [];

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      obj.tool_calls.forEach((tc) => {
        const name = tc.name || tc.toolName || '';
        if (name.includes('replace') || name.includes('write')) {
          let args = tc.args || tc.arguments || tc;
          if (typeof args === 'string') {
            try {
              args = JSON.parse(args);
            } catch (e) {}
          }
          found.push({
            step: obj.step_index,
            name: name,
            target: args.TargetFile || args.targetFile || args.path || ''
          });
        }
      });
    }
  } catch (err) {}
});

rl.on('close', () => {
  console.log(`Found ${found.length} tool calls containing 'replace' or 'write':`);
  found.slice(0, 50).forEach(f => {
    console.log(`Step ${f.step} | Tool: ${f.name} | Target: "${f.target}"`);
  });
});
