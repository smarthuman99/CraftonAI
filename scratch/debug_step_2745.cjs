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
    const step = obj.step_index;
    if (step === 2745) {
      console.log(`Step 2745 found!`);
      const tc = obj.tool_calls[0];
      const args = tc.args || tc.arguments;
      console.log(`args.ReplacementChunks type:`, typeof args.ReplacementChunks);
      if (typeof args.ReplacementChunks === 'string') {
        console.log(`Length:`, args.ReplacementChunks.length);
        console.log(`Start of chunks:`, args.ReplacementChunks.substring(0, 500));
        console.log(`End of chunks:`, args.ReplacementChunks.substring(args.ReplacementChunks.length - 500));
        
        // Let's see what happens if we parse it
        try {
          const parsed = JSON.parse(args.ReplacementChunks);
          console.log(`Successfully parsed with simple JSON.parse! Number of chunks:`, parsed.length);
        } catch (e) {
          console.log(`Simple JSON.parse failed:`, e.message);
          
          // Let's write the string to a file so we can view it
          fs.writeFileSync('e:\\CraftonAI\\scratch\\chunks_2745_raw.txt', args.ReplacementChunks);
          console.log(`Wrote raw chunks string to scratch/chunks_2745_raw.txt`);
        }
      } else {
        console.log(`Is Array?`, Array.isArray(args.ReplacementChunks));
        console.log(`Length:`, args.ReplacementChunks.length);
      }
    }
  } catch (err) {}
});
