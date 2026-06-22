const fs = require('fs');

const content = fs.readFileSync('src/app.jsx', 'utf8');

const braceStack = [];
const parenStack = [];
const bracketStack = [];

let inString = false;
let stringChar = '';
let inComment = false;
let inRegex = false;

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const prevChar = j > 0 ? line[j - 1] : '';
    const nextChar = j + 1 < line.length ? line[j + 1] : '';

    // Handle comments and strings (basic state machine to avoid counting inside comments/strings)
    if (inComment) {
      if (char === '/' && prevChar === '*') {
        inComment = false;
      }
      continue;
    }
    if (inString) {
      if (char === stringChar && prevChar !== '\\') {
        inString = false;
      }
      continue;
    }
    if (char === '/' && nextChar === '*') {
      inComment = true;
      j++;
      continue;
    }
    if (char === '/' && nextChar === '/') {
      break; // Rest of the line is a comment
    }
    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }

    // Bracket matching
    if (char === '{') {
      braceStack.push({ line: i + 1, col: j + 1, text: line.trim().substring(0, 50) });
    } else if (char === '}') {
      if (braceStack.length > 0) braceStack.pop();
      else console.log(`Extra } on Line ${i + 1}:${j + 1}`);
    } else if (char === '(') {
      parenStack.push({ line: i + 1, col: j + 1, text: line.trim().substring(0, 50) });
    } else if (char === ')') {
      if (parenStack.length > 0) parenStack.pop();
      else console.log(`Extra ) on Line ${i + 1}:${j + 1}`);
    } else if (char === '[') {
      bracketStack.push({ line: i + 1, col: j + 1, text: line.trim().substring(0, 50) });
    } else if (char === ']') {
      if (bracketStack.length > 0) bracketStack.pop();
      else console.log(`Extra ] on Line ${i + 1}:${j + 1}`);
    }
  }
}

console.log(`\n--- UNCLOSED BRACES (${braceStack.length}) ---`);
braceStack.forEach(b => console.log(`Line ${b.line}:${b.col} -> ${b.text}`));

console.log(`\n--- UNCLOSED PARENTHESES (${parenStack.length}) ---`);
parenStack.forEach(p => console.log(`Line ${p.line}:${p.col} -> ${p.text}`));

console.log(`\n--- UNCLOSED BRACKETS (${bracketStack.length}) ---`);
bracketStack.forEach(b => console.log(`Line ${b.line}:${b.col} -> ${b.text}`));
