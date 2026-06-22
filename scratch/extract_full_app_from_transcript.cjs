const fs = require('fs');
const readline = require('readline');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\00efd457-699e-4577-800f-e7b993a16f1b\\.system_generated\\logs\\transcript_full.jsonl";

if (!fs.existsSync(transcriptPath)) {
  console.log("transcript_full.jsonl not found.");
  process.exit(1);
}

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  terminal: false
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    const step = obj.step_index;
    
    // Check if it is a view_file tool call
    if (obj.tool_calls) {
      obj.tool_calls.forEach((tc) => {
        const tcName = tc.name || '';
        if (tcName.includes('view_file')) {
          let args = tc.args || {};
          if (typeof args === 'string') {
            try { args = JSON.parse(args); } catch(e){}
          }
          const targetFile = args.AbsolutePath || args.absolutePath || '';
          if (targetFile.toLowerCase().endsWith('app.jsx')) {
            console.log(`Step ${step} has view_file for app.jsx. StartLine: ${args.StartLine}, EndLine: ${args.EndLine}`);
          }
        }
      });
    }
    
    // Check if it is a tool response
    if (obj.type === 'RUN_COMMAND' || obj.type === 'CODE_ACTION' || obj.type === 'SYSTEM' || obj.type === 'TOOL_RESPONSE' || obj.type === 'PLANNER_RESPONSE') {
      // Let's see if the content contains a large chunk of app.jsx
      if (obj.content && obj.content.includes("Crafton AI") && obj.content.includes("import React")) {
        console.log(`Step ${step} (${obj.type}) contains 'Crafton AI' and 'import React'. Length: ${obj.content.length} chars.`);
      }
    }
  } catch (err) {}
});
