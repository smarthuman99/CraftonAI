const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/app.jsx'), 'utf8');

let line = 1;
let col = 1;
const stack = [];

// Ignore comments and strings
let inSingleLineComment = false;
let inMultiLineComment = false;
let inString = null; // can be '"', "'", or '`'

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const nextChar = content[i + 1];

  if (char === '\n') {
    line++;
    col = 1;
    inSingleLineComment = false;
    continue;
  } else {
    col++;
  }

  if (inSingleLineComment) {
    continue;
  }

  if (inMultiLineComment) {
    if (char === '*' && nextChar === '/') {
      inMultiLineComment = false;
      i++;
      col++;
    }
    continue;
  }

  if (inString) {
    if (char === '\\') {
      i++;
      col++;
      continue;
    }
    if (char === inString) {
      inString = null;
    }
    continue;
  }

  // Check for start of comments or strings
  if (char === '/' && nextChar === '/') {
    inSingleLineComment = true;
    i++;
    col++;
    continue;
  }
  if (char === '/' && nextChar === '*') {
    inMultiLineComment = true;
    i++;
    col++;
    continue;
  }
  if (char === '"' || char === "'" || char === '`') {
    inString = char;
    continue;
  }

  // Bracket tracking
  if (char === '{' || char === '(' || char === '[') {
    stack.push({ char, line, col });
  } else if (char === '}' || char === ')' || char === ']') {
    if (stack.length === 0) {
      console.log(`Unmatched closing ${char} at line ${line}, col ${col}`);
    } else {
      const last = stack.pop();
      const match = { '}': '{', ')': '(', ']': '[' }[char];
      if (last.char !== match) {
        console.log(`Mismatch: found ${char} at line ${line}, col ${col} matching ${last.char} from line ${last.line}, col ${last.col}`);
      }
    }
  }
}

if (stack.length > 0) {
  console.log(`Unclosed brackets left on stack: ${stack.length}`);
  // print the last 20 unclosed
  stack.slice(-20).forEach(item => {
    console.log(`Unclosed ${item.char} at line ${item.line}, col ${item.col}`);
  });
} else {
  console.log("All brackets balanced (ignoring JSX/Template subtleties, but basic check passed)");
}
