const fs = require('fs');

const raw = fs.readFileSync("e:\\CraftonAI\\scratch\\step_3461_tc_0_args.json", 'utf8');
const data = JSON.parse(raw);

const repl = data.ReplacementContent;
console.log("REPLACEMENT CONTENT LENGTH:", repl.length);
console.log("--- START (first 400 chars) ---");
console.log(repl.substring(0, 400));
console.log("--- END (last 400 chars) ---");
console.log(repl.substring(repl.length - 400));
