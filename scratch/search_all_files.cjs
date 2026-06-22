const fs = require('fs');
const path = require('path');

const srcDir = 'e:\\CraftonAI\\src';
const files = fs.readdirSync(srcDir);

files.forEach(file => {
  const filePath = path.join(srcDir, file);
  if (fs.statSync(filePath).isFile()) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('\x00')) {
        // Try decoding as UTF-16LE
        content = fs.readFileSync(filePath, 'utf16le');
      }
      
      const lines = content.split(/\r?\n/);
      let matches = [];
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes('bespoke') || line.toLowerCase().includes('marketingtab')) {
          matches.push({ lineNum: idx + 1, text: line.trim() });
        }
      });
      
      if (matches.length > 0) {
        console.log(`\nFile: ${file} (Lines: ${lines.length}, Size: ${fs.statSync(filePath).size} bytes)`);
        console.log(`Found ${matches.length} matches. Showing first 5 matches:`);
        matches.slice(0, 5).forEach(m => {
          console.log(`  Line ${m.lineNum}: ${m.text.substring(0, 150)}`);
        });
      }
    } catch (e) {
      console.log(`Error reading ${file}: ${e.message}`);
    }
  }
});
