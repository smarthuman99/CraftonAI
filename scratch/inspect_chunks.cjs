const fs = require('fs');
const content = fs.readFileSync('e:\\CraftonAI\\scratch\\chunks_2745_raw.txt', 'utf8');
console.log('Total length:', content.length);
const pos = 1862;
const start = Math.max(0, pos - 100);
const end = Math.min(content.length, pos + 100);
console.log('--- Context around pos 1862 ---');
console.log(content.substring(start, end));
console.log('-------------------------------');
for (let i = start; i < end; i++) {
  const code = content.charCodeAt(i);
  console.log(`char ${i}: char='${content[i].replace(/\n/g, '\\n').replace(/\r/g, '\\r')}' (code ${code})`);
}
