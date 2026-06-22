const fs = require('fs');
const path = require('path');
const readline = require('readline');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\bb8cf887-15dc-442b-8106-09161bd4fb60\\.system_generated\\logs\\transcript.jsonl";

if (!fs.existsSync(transcriptPath)) {
  console.log("Transcript file does not exist at path: " + transcriptPath);
  process.exit(1);
}

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  output: process.stdout,
  terminal: false
});

const found = [];

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    const step = obj.step_index;
    
    if (obj.tool_calls) {
      obj.tool_calls.forEach((tc) => {
        const tcName = tc.name || '';
        const isAppJs = tcName.includes('write_to_file') || tcName.includes('replace_file_content') || tcName.includes('multi_replace_file_content');
        if (isAppJs) {
          let args = tc.args || tc.arguments || tc;
          if (typeof args === 'string') {
            try {
              args = JSON.parse(args);
            } catch (e) {}
          }
          const targetFile = args.TargetFile || args.targetFile;
          if (targetFile && typeof targetFile === 'string' && targetFile.toLowerCase().endsWith('app.jsx')) {
            const desc = args.Description || args.description || args.Instruction || args.instruction || '';
            found.push({
              step: step,
              tool: tcName,
              description: desc.substring(0, 120)
            });
          }
        }
      });
    }
  } catch (err) {}
});

rl.on('close', () => {
  console.log(`Found ${found.length} edits targeting app.jsx:`);
  found.forEach(f => {
    console.log(`Step ${f.step} | Tool: ${f.tool} | Desc: "${f.description}"`);
  });
});
