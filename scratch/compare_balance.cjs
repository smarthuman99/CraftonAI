const { execSync } = require('child_process');
const fs = require('fs');

// 1. Get original file content from git
const originalContent = execSync('git show HEAD:src/app.jsx').toString('utf8');

function checkBalancing(content, name) {
  const braceStack = [];
  const parenStack = [];
  const lines = content.split('\n');

  let inString = false;
  let stringChar = '';
  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const prevChar = j > 0 ? line[j - 1] : '';
      const nextChar = j + 1 < line.length ? line[j + 1] : '';

      if (inComment) {
        if (char === '/' && prevChar === '*') inComment = false;
        continue;
      }
      if (inString) {
        if (char === stringChar && prevChar !== '\\') inString = false;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inComment = true;
        j++;
        continue;
      }
      if (char === '/' && nextChar === '/') break;
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
        continue;
      }

      if (char === '{') {
        braceStack.push({ line: i + 1, text: line.trim().substring(0, 50) });
      } else if (char === '}') {
        if (braceStack.length > 0) braceStack.pop();
        else console.log(`[${name}] Extra } on Line ${i + 1}`);
      } else if (char === '(') {
        parenStack.push({ line: i + 1, text: line.trim().substring(0, 50) });
      } else if (char === ')') {
        if (parenStack.length > 0) parenStack.pop();
        else console.log(`[${name}] Extra ) on Line ${i + 1}`);
      }
    }
  }

  console.log(`\n=== Balance report for ${name} ===`);
  console.log(`Unclosed Braces: ${braceStack.length}`);
  braceStack.slice(-5).forEach(b => console.log(`- Line ${b.line}: ${b.text}`));
  console.log(`Unclosed Parentheses: ${parenStack.length}`);
}

checkBalancing(originalContent, "PRISTINE (HEAD)");
const currentContent = fs.readFileSync('src/app.jsx', 'utf8');
checkBalancing(currentContent, "CURRENT");
