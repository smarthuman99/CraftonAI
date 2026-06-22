const fs = require('fs');
const readline = require('readline');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\bb8cf887-15dc-442b-8106-09161bd4fb60\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  output: process.stdout,
  terminal: false
});

let found = false;

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    
    // Check if this step is a tool call to view_file or has tool outputs
    if (obj.tool_calls) {
      obj.tool_calls.forEach((tc) => {
        if (tc.name === 'view_file' || tc.name === 'default_api:view_file') {
          const args = tc.args || tc.arguments;
          if (args && args.AbsolutePath && args.AbsolutePath.endsWith('app.jsx')) {
            console.log(`Step ${obj.step_index}: view_file on app.jsx. Start: ${args.StartLine}, End: ${args.EndLine}`);
          }
        }
      });
    }

    if (obj.content && obj.content.includes("Crafton")) {
      // Let's print out the step if it's large and contains app.jsx contents
      if (obj.content.length > 50000) {
        console.log(`Step ${obj.step_index}: large content (${obj.content.length} chars) containing 'Crafton'.`);
        if (obj.content.includes("clientPortalTab") || obj.content.includes("Our Story") || obj.content.includes("OurStory")) {
          console.log(`  --> Matches premium keywords!`);
          fs.writeFileSync(`e:\\CraftonAI\\scratch\\recovered_app_step_${obj.step_index}.txt`, obj.content);
          found = true;
        }
      }
    }
  } catch (err) {
    // Ignore JSON parse errors
  }
});

rl.on('close', () => {
  if (found) {
    console.log("Successfully processed and saved potential app.jsx file(s).");
  } else {
    console.log("No full view_file output found in transcript.");
  }
});
