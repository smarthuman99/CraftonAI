const fs = require('fs');
const steps = [158, 188, 226, 230];

steps.forEach(step => {
  console.log(`\n\n================================================================================`);
  console.log(`================================== STEP ${step} ==================================`);
  console.log(`================================================================================`);
  
  const raw = fs.readFileSync(`scratch/extracted_step_${step}.json`, 'utf8');
  const obj = JSON.parse(raw);
  const tc = obj.tool_calls[0];
  let args = tc.args || {};
  if (typeof args === 'string') {
    args = JSON.parse(args);
  }
  
  console.log("Tool:", tc.name);
  console.log("Description:", args.Description || args.description);
  console.log("Instruction:", args.Instruction || args.instruction);
  
  if (tc.name === 'replace_file_content') {
    console.log(`\nTARGET CONTENT:\n${args.TargetContent || args.targetContent}`);
    console.log(`\nREPLACEMENT CONTENT:\n${args.ReplacementContent || args.replacementContent}`);
  } else if (tc.name === 'multi_replace_file_content') {
    let chunks = args.ReplacementChunks || args.replacementChunks;
    if (typeof chunks === 'string') {
      chunks = JSON.parse(chunks);
    }
    console.log(`Number of chunks: ${chunks.length}`);
    chunks.forEach((chunk, cIdx) => {
      console.log(`\n  --- Chunk ${cIdx} ---`);
      console.log(`  TargetContent:\n${chunk.TargetContent || chunk.targetContent}`);
      console.log(`  ReplacementContent:\n${chunk.ReplacementContent || chunk.replacementContent}`);
    });
  }
});
