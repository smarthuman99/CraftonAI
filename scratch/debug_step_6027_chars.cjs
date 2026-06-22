const fs = require('fs');

const args = JSON.parse(fs.readFileSync("scratch/step_6027_tc_0_args.json", "utf8"));
const val = args.TargetContent;
console.log("val type:", typeof val);
console.log("val starts with quote:", val.startsWith('"'));
console.log("val ends with quote:", val.endsWith('"'));
console.log("val length:", val.length);
console.log("val last 20 chars:", JSON.stringify(val.substring(val.length - 20)));
for (let i = 0; i < 20; i++) {
  const idx = val.length - 20 + i;
  console.log(`Char at ${idx}: ${JSON.stringify(val[idx])} (code: ${val.charCodeAt(idx)})`);
}
