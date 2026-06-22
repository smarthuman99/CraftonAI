const fs = require('fs');
const path = require('path');

const files = [
  'step_3461_tc_0_args.json',
  'step_3469_tc_0_args.json',
  'step_3991_tc_0_args.json',
  'step_3995_tc_0_args.json'
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

for (const file of files) {
  const filePath = path.join('e:\\CraftonAI\\scratch', file);
  if (!fs.existsSync(filePath)) {
    console.log(`File ${file} does not exist.`);
    continue;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  
  const content = cleanValue(data.ReplacementContent || data.replacementContent);
  const outPath = path.join('e:\\CraftonAI\\scratch', file.replace('.json', '_unwrapped.txt'));
  fs.writeFileSync(outPath, content);
  console.log(`Wrote unescaped content of ${file} to ${outPath}`);
}
