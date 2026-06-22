const fs = require('fs');
const readline = require('readline');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\bb8cf887-15dc-442b-8106-09161bd4fb60\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  output: process.stdout,
  terminal: false
});

let linesMatched = 0;

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    const step = obj.step_index;
    
    // Look for keywords in the entire stringified step
    if (line.includes("clientPortalTab") || line.includes("marketingTab") || line.includes("blueprintIntake")) {
      linesMatched++;
      console.log(`Step ${step} matches! Length of JSON line: ${line.length}`);
      
      // Let's analyze where the match is
      if (obj.tool_calls) {
        obj.tool_calls.forEach((tc, idx) => {
          console.log(`  Tool call ${idx}: ${tc.name}`);
          const args = tc.args || tc.arguments;
          if (args) {
            console.log(`    Keys in args: ${Object.keys(args)}`);
            // Check if ReplacementContent contains it
            if (args.ReplacementContent) {
              console.log(`    ReplacementContent length: ${args.ReplacementContent.length}`);
            }
            if (args.ReplacementChunks) {
              console.log(`    ReplacementChunks type: ${typeof args.ReplacementChunks}`);
              if (typeof args.ReplacementChunks === 'string') {
                console.log(`      ReplacementChunks length: ${args.ReplacementChunks.length}`);
              } else if (Array.isArray(args.ReplacementChunks)) {
                console.log(`      ReplacementChunks count: ${args.ReplacementChunks.length}`);
              }
            }
          }
        });
      }
    }
  } catch (err) {}
});

rl.on('close', () => {
  console.log(`Total matched lines: ${linesMatched}`);
});
