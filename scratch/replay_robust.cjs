const fs = require('fs');
const readline = require('readline');
const path = require('path');

const transcriptPath = "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\bb8cf887-15dc-442b-8106-09161bd4fb60\\.system_generated\\logs\\transcript.jsonl";
const baselinePath = "e:\\CraftonAI\\src\\app_backup_original.jsx";

if (!fs.existsSync(transcriptPath)) {
  console.log("Transcript not found.");
  process.exit(1);
}
if (!fs.existsSync(baselinePath)) {
  console.log("Baseline not found.");
  process.exit(1);
}

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  output: process.stdout,
  terminal: false
});

const edits = [];

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    const step = obj.step_index;
    
    if (obj.tool_calls) {
      obj.tool_calls.forEach((tc) => {
        const tcName = tc.name || tc.toolName || '';
        const isAppJs = tcName.includes('write_to_file') || tcName.includes('replace_file_content') || tcName.includes('multi_replace_file_content');
        if (isAppJs) {
          let args = tc.args || tc.arguments || tc;
          if (typeof args === 'string') {
            try {
              args = JSON.parse(args);
            } catch (e) {}
          }
          let targetFile = args.TargetFile || args.targetFile || args.path || '';
          if (typeof targetFile === 'string') {
            targetFile = targetFile.replace(/"/g, '').trim();
            if (targetFile.toLowerCase().endsWith('app.jsx') && !targetFile.toLowerCase().includes('loading-ai')) {
              edits.push({
                step: step,
                type: tcName.includes('multi') ? 'multi' : 'replace',
                args: args
              });
            }
          }
        }
      });
    }
  } catch (err) {}
});

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

rl.on('close', () => {
  console.log(`Found ${edits.length} edits targeting app.jsx in transcript.`);
  
  // Sort chronologically
  edits.sort((a, b) => a.step - b.step);
  
  let content = fs.readFileSync(baselinePath, 'utf8').replace(/\r\n/g, '\n');
  console.log(`Initial baseline: ${content.length} chars, ${content.split('\n').length} lines.`);
  
  let successCount = 0;
  let failCount = 0;
  const failedSteps = [];
  
  // Let's replay edits one by one
  for (const edit of edits) {
    const args = edit.args;
    const desc = args.Description || args.description || args.Instruction || args.instruction || '';
    console.log(`\n----------------------------------------`);
    console.log(`REPLAYING STEP ${edit.step} (${edit.type}) - desc: "${desc.substring(0, 100)}"`);
    
    if (edit.type === 'replace') {
      let target = cleanValue(args.TargetContent || args.targetContent);
      let replacement = cleanValue(args.ReplacementContent || args.replacementContent);
      
      if (typeof target !== 'string' || typeof replacement !== 'string') {
        console.log(`  [FAIL] Step ${edit.step}: Target or replacement is not a string.`);
        failCount++;
        failedSteps.push(edit.step);
        continue;
      }
      
      target = target.replace(/\r\n/g, '\n');
      replacement = replacement.replace(/\r\n/g, '\n');
      
      const occurrences = content.split(target).length - 1;
      if (occurrences === 0) {
        console.log(`  [FAIL] Step ${edit.step}: TargetContent not found!`);
        console.log(`  Target snippet (first 150 chars):\n${target.substring(0, 150)}`);
        failCount++;
        failedSteps.push(edit.step);
      } else if (occurrences > 1) {
        console.log(`  [FAIL] Step ${edit.step}: Multiple occurrences found (${occurrences})!`);
        failCount++;
        failedSteps.push(edit.step);
      } else {
        content = content.split(target).join(replacement);
        console.log(`  [SUCCESS] Step ${edit.step}: Replaced successfully.`);
        successCount++;
      }
    } else if (edit.type === 'multi') {
      let chunks = args.ReplacementChunks || args.replacementChunks;
      if (typeof chunks === 'string') {
        try {
          chunks = JSON.parse(cleanValue(chunks));
        } catch (e) {
          console.log(`  [FAIL] Step ${edit.step}: Failed to parse chunks string: ${e.message}`);
          failCount++;
          failedSteps.push(edit.step);
          continue;
        }
      }
      
      if (!chunks || !Array.isArray(chunks)) {
        console.log(`  [FAIL] Step ${edit.step}: No chunks found or chunks is not an array.`);
        failCount++;
        failedSteps.push(edit.step);
        continue;
      }
      
      console.log(`  Applying ${chunks.length} chunks...`);
      let stepOk = true;
      for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
        const chunk = chunks[cIdx];
        let target = cleanValue(chunk.TargetContent || chunk.targetContent);
        let replacement = cleanValue(chunk.ReplacementContent || chunk.replacementContent);
        
        if (typeof target !== 'string' || typeof replacement !== 'string') {
          console.log(`    [CHUNK ${cIdx} FAIL] Target or replacement is not a string.`);
          stepOk = false;
          continue;
        }
        
        target = target.replace(/\r\n/g, '\n');
        replacement = replacement.replace(/\r\n/g, '\n');
        
        const occurrences = content.split(target).length - 1;
        if (occurrences === 0) {
          console.log(`    [CHUNK ${cIdx} FAIL] TargetContent not found!`);
          console.log(`    Target snippet (first 100 chars):\n${target.substring(0, 100)}`);
          stepOk = false;
        } else if (occurrences > 1) {
          console.log(`    [CHUNK ${cIdx} FAIL] Multiple occurrences found (${occurrences})!`);
          stepOk = false;
        } else {
          content = content.split(target).join(replacement);
        }
      }
      
      if (stepOk) {
        console.log(`  [SUCCESS] Step ${edit.step}: Multi-replaced all chunks successfully.`);
        successCount++;
      } else {
        console.log(`  [FAIL] Step ${edit.step}: One or more chunks failed to apply.`);
        failCount++;
        failedSteps.push(edit.step);
      }
    }
  }
  
  console.log(`\n========================================`);
  console.log(`Replay Summary: Successes: ${successCount}, Failures: ${failCount}`);
  if (failedSteps.length > 0) {
    console.log(`Failed steps: ${failedSteps.join(', ')}`);
  }
  
  const outPath = "e:\\CraftonAI\\src\\app_replayed_on_current.jsx";
  fs.writeFileSync(outPath, content.replace(/\n/g, '\r\n'));
  console.log(`Saved output file to ${outPath} (${content.split('\n').length} lines)`);
});
