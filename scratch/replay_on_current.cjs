const fs = require('fs');
const path = require('path');

const appJsPath = "e:\\CraftonAI\\src\\app.jsx";
const scratchDir = "e:\\CraftonAI\\scratch";

const steps = [
  "step_3447_tc_0_args.json",
  "step_3451_tc_0_args.json",
  "step_3455_tc_0_args.json",
  "step_3461_tc_0_args.json",
  "step_3469_tc_0_args.json",
  "step_3991_tc_0_args.json",
  "step_3995_tc_0_args.json"
];

function cleanValue(val) {
  if (typeof val !== 'string') return val;
  let s = val.trim();
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    try {
      s = JSON.parse(s);
    } catch (e) {
      s = s.slice(1, -1);
    }
  }
  return s;
}

let content = fs.readFileSync(appJsPath, 'utf8').replace(/\r\n/g, '\n');
console.log(`Starting content length: ${content.length} chars, ${content.split('\n').length} lines.`);

let successCount = 0;
let failCount = 0;

for (const stepFile of steps) {
  const filePath = path.join(scratchDir, stepFile);
  console.log(`\n========================================`);
  console.log(`Loading step file: ${stepFile}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  [FAIL] File does not exist: ${filePath}`);
    failCount++;
    continue;
  }
  
  const rawData = fs.readFileSync(filePath, 'utf8');
  let args;
  try {
    args = JSON.parse(rawData);
  } catch (err) {
    console.log(`  [FAIL] Failed to parse JSON: ${err.message}`);
    failCount++;
    continue;
  }
  
  const desc = args.Description || args.description || args.Instruction || args.instruction || '';
  console.log(`Description: "${desc.substring(0, 100)}"`);
  
  const type = (args.ReplacementChunks || args.replacementChunks) ? 'multi' : 'replace';
  
  if (type === 'replace') {
    let target = cleanValue(args.TargetContent || args.targetContent);
    let replacement = cleanValue(args.ReplacementContent || args.replacementContent);
    
    if (typeof target !== 'string' || typeof replacement !== 'string') {
      console.log(`  [FAIL] Target or replacement is not a string.`);
      failCount++;
      continue;
    }
    
    target = target.replace(/\r\n/g, '\n');
    replacement = replacement.replace(/\r\n/g, '\n');
    
    const occurrences = content.split(target).length - 1;
    if (occurrences === 0) {
      console.log(`  [FAIL] TargetContent not found!`);
      console.log(`  Target snippet (first 300 chars):\n${target.substring(0, 300)}`);
      failCount++;
    } else if (occurrences > 1) {
      console.log(`  [FAIL] Multiple occurrences found (${occurrences})!`);
      failCount++;
    } else {
      content = content.split(target).join(replacement);
      console.log(`  [SUCCESS] Replaced successfully.`);
      successCount++;
    }
  } else if (type === 'multi') {
    let chunks = args.ReplacementChunks || args.replacementChunks;
    if (typeof chunks === 'string') {
      try {
        chunks = JSON.parse(cleanValue(chunks));
      } catch (e) {
        console.log(`  [FAIL] Failed to parse chunks string: ${e.message}`);
        failCount++;
        continue;
      }
    }
    
    if (!chunks || !Array.isArray(chunks)) {
      console.log(`  [FAIL] No chunks found or chunks is not an array.`);
      failCount++;
      continue;
    }
    
    console.log(`  Applying ${chunks.length} chunks...`);
    let stepOk = true;
    for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
      const chunk = chunks[cIdx];
      const target = cleanValue(chunk.TargetContent || chunk.targetContent).replace(/\r\n/g, '\n');
      const replacement = cleanValue(chunk.ReplacementContent || chunk.replacementContent).replace(/\r\n/g, '\n');
      
      const occurrences = content.split(target).length - 1;
      if (occurrences === 0) {
        console.log(`    [CHUNK ${cIdx} FAIL] TargetContent not found!`);
        console.log(`    Target snippet (first 150 chars):\n${target.substring(0, 150)}`);
        stepOk = false;
      } else if (occurrences > 1) {
        console.log(`    [CHUNK ${cIdx} FAIL] Multiple occurrences found (${occurrences})!`);
        stepOk = false;
      } else {
        content = content.split(target).join(replacement);
        console.log(`    [CHUNK ${cIdx} SUCCESS] Replaced.`);
      }
    }
    
    if (stepOk) {
      console.log(`  [SUCCESS] All chunks applied successfully.`);
      successCount++;
    } else {
      console.log(`  [FAIL] One or more chunks failed.`);
      failCount++;
    }
  }
}

console.log(`\n========================================`);
console.log(`Replay Summary: Successes: ${successCount}, Failures: ${failCount}`);

const outPath = "e:\\CraftonAI\\src\\app_replayed_on_current.jsx";
fs.writeFileSync(outPath, content.replace(/\n/g, '\r\n'));
console.log(`Saved output file to ${outPath} (${content.split('\n').length} lines)`);
