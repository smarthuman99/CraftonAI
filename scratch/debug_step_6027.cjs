const fs = require('fs');

function cleanValue(val) {
  if (typeof val !== 'string') return val;
  let s = val.trim();
  while (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    try {
      const parsed = JSON.parse(s);
      if (typeof parsed === 'string') {
        s = parsed.trim();
      } else {
        break;
      }
    } catch (e) {
      s = s.slice(1, -1).trim();
    }
  }
  return s;
}

const args = JSON.parse(fs.readFileSync("scratch/step_6027_tc_0_args.json", "utf8"));
console.log("CLEANED TARGET CONTENT FIRST 300 CHARS:");
const cleanedTarget = cleanValue(args.TargetContent);
console.log(JSON.stringify(cleanedTarget.substring(0, 300)));

const appJsPath = "e:\\CraftonAI\\src\\app.jsx";
const content = fs.readFileSync(appJsPath, 'utf8').replace(/\r\n/g, '\n');
console.log("\nDOES IT EXIST IN APP.JSX?");
console.log(content.includes(cleanedTarget));
if (!content.includes(cleanedTarget)) {
  // Let's find where they differ
  for (let i = 0; i < cleanedTarget.length; i++) {
    const sub = cleanedTarget.substring(0, i);
    if (!content.includes(sub)) {
      console.log(`Failed at char index ${i-1}:`);
      console.log(`Target char: ${JSON.stringify(cleanedTarget[i-1])} (code: ${cleanedTarget.charCodeAt(i-1)})`);
      console.log(`Next 50 chars of target:\n`, cleanedTarget.substring(i-1, i+50));
      break;
    }
  }
}
