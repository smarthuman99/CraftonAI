const fs = require('fs');
const readline = require('readline');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\bb8cf887-15dc-442b-8106-09161bd4fb60\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  output: process.stdout,
  terminal: false
});

let matches = 0;

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    const step = obj.step_index;
    
    // Check if this step is a tool call to view_file of app.jsx
    let isViewAppJs = false;
    if (obj.tool_calls) {
      obj.tool_calls.forEach((tc) => {
        if (tc.name && tc.name.includes('view_file')) {
          const args = tc.args || tc.arguments;
          if (args) {
            const path = args.AbsolutePath || args.absolutePath;
            if (path && path.toLowerCase().includes('app.jsx')) {
              isViewAppJs = true;
            }
          }
        }
      });
    }
    
    // Or if the content contains a large chunk of app.jsx
    if (isViewAppJs || (line.length > 50000 && (line.includes('const [archiveHashed') || line.includes('clientPortalTab')))) {
      matches++;
      console.log(`Step ${step}: Match! Source: ${obj.source}, Type: ${obj.type}, Length: ${line.length}`);
      if (line.length > 50000) {
        console.log(`  This is a huge line! First 1000 characters:`);
        console.log(line.substring(0, 1000));
        
        // Save the raw line or content to a scratch file so we can analyze it
        fs.writeFileSync(`e:\\CraftonAI\\scratch\\huge_step_${step}.txt`, line);
        console.log(`  Saved raw step to e:\\CraftonAI\\scratch\\huge_step_${step}.txt`);
      }
    }
  } catch (err) {}
});

rl.on('close', () => {
  console.log(`Total matches found: ${matches}`);
});
