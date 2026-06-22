const fs = require('fs');
const readline = require('readline');
const path = require('path');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\00efd457-699e-4577-800f-e7b993a16f1b\\.system_generated\\logs\\transcript_full.jsonl";
const targetSteps = [86, 158, 188, 226, 230];

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
    if (targetSteps.includes(step)) {
      console.log(`Found target step ${step}`);
      const filename = `scratch/extracted_step_${step}.json`;
      fs.writeFileSync(filename, line);
      console.log(`Saved step ${step} JSON to ${filename} (${line.length} bytes)`);
    }
  } catch (err) {
    console.error(err);
  }
});
