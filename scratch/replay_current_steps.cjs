const fs = require('fs');
const path = require('path');

const appJsPath = "e:\\CraftonAI\\src\\app.jsx";
const steps = [86, 158, 188, 226, 230];

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

for (const step of steps) {
  const stepFile = `scratch/extracted_step_${step}.json`;
  console.log(`\n========================================`);
  console.log(`Loading step file: ${stepFile}`);
  
  if (!fs.existsSync(stepFile)) {
    console.log(`  [FAIL] File does not exist: ${stepFile}`);
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(stepFile, 'utf8');
  let obj;
  try {
    obj = JSON.parse(rawData);
  } catch (err) {
    console.log(`  [FAIL] Failed to parse JSON: ${err.message}`);
    process.exit(1);
  }
  
  if (!obj.tool_calls || obj.tool_calls.length === 0) {
    console.log(`  [FAIL] No tool calls in step.`);
    process.exit(1);
  }
  
  const tc = obj.tool_calls[0];
  let args = tc.args || {};
  if (typeof args === 'string') {
    try { args = JSON.parse(args); } catch(e){}
  }
  
  const desc = args.Description || args.description || args.Instruction || args.instruction || '';
  console.log(`Description: "${desc.substring(0, 100)}"`);
  
  const type = tc.name;
  
  if (type === 'replace_file_content') {
    let target = cleanValue(args.TargetContent || args.targetContent);
    let replacement = cleanValue(args.ReplacementContent || args.replacementContent);
    
    if (typeof target !== 'string' || typeof replacement !== 'string') {
      console.log(`  [FAIL] Target or replacement is not a string.`);
      process.exit(1);
    }
    
    target = target.replace(/\r\n/g, '\n');
    replacement = replacement.replace(/\r\n/g, '\n');
    
    const occurrences = content.split(target).length - 1;
    if (occurrences === 0) {
      console.log(`  [FAIL] TargetContent not found!`);
      console.log(`  Target snippet (first 300 chars):\n${target.substring(0, 300)}`);
      process.exit(1);
    } else if (occurrences > 1) {
      console.log(`  [FAIL] Multiple occurrences found (${occurrences})!`);
      process.exit(1);
    } else {
      content = content.split(target).join(replacement);
      console.log(`  [SUCCESS] Replaced successfully.`);
    }
  } else if (type === 'multi_replace_file_content') {
    let chunks = args.ReplacementChunks || args.replacementChunks;
    if (typeof chunks === 'string') {
      try {
        chunks = JSON.parse(cleanValue(chunks));
      } catch (e) {
        console.log(`  [FAIL] Failed to parse chunks string: ${e.message}`);
        process.exit(1);
      }
    }
    
    if (!chunks || !Array.isArray(chunks)) {
      console.log(`  [FAIL] No chunks found or chunks is not an array.`);
      process.exit(1);
    }
    
    console.log(`  Applying ${chunks.length} chunks...`);
    for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
      const chunk = chunks[cIdx];
      const target = cleanValue(chunk.TargetContent || chunk.targetContent).replace(/\r\n/g, '\n');
      const replacement = cleanValue(chunk.ReplacementContent || chunk.replacementContent).replace(/\r\n/g, '\n');
      
      const occurrences = content.split(target).length - 1;
      if (occurrences === 0) {
        console.log(`    [CHUNK ${cIdx} FAIL] TargetContent not found!`);
        console.log(`    Target snippet (first 150 chars):\n${target.substring(0, 150)}`);
        process.exit(1);
      } else if (occurrences > 1) {
        console.log(`    [CHUNK ${cIdx} FAIL] Multiple occurrences found (${occurrences})!`);
        process.exit(1);
      } else {
        content = content.split(target).join(replacement);
        console.log(`    [CHUNK ${cIdx} SUCCESS] Replaced.`);
      }
    }
    console.log(`  [SUCCESS] All chunks applied successfully.`);
  }
}

console.log(`\n========================================`);
console.log(`Replay completed successfully!`);

fs.writeFileSync(appJsPath, content.replace(/\n/g, '\r\n'));
console.log(`Saved restored file to ${appJsPath} (${content.split('\n').length} lines)`);
