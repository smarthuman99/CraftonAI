const fs = require('fs');

const content = fs.readFileSync('src/app.jsx', 'utf8');
const lines = content.split('\n');

const stack = [];
let parenCount = 0;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Find potential function declarations to name our stack frames
  const funcMatch = line.match(/(?:const|function)\s+(\w+)\s*=/);
  const funcName = funcMatch ? funcMatch[1] : null;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '{') {
      braceCount++;
      stack.push({ line: i + 1, char: '{', func: funcName || (stack.length > 0 ? stack[stack.length - 1].func : 'global') });
    } else if (char === '}') {
      braceCount--;
      if (stack.length > 0) {
        stack.pop();
      } else {
        console.log(`Warning: Extra '}' on line ${i + 1}`);
      }
    } else if (char === '(') {
      parenCount++;
    } else if (char === ')') {
      parenCount--;
    }
  }
}

console.log(`Total Braces Open: ${braceCount}`);
console.log(`Total Parentheses Open: ${parenCount}`);
console.log("\nUnclosed Braces Stack (top 15):");
stack.slice(-15).forEach(frame => {
  console.log(`- Line ${frame.line} in function '${frame.func}'`);
});
