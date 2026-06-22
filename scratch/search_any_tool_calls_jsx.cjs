const fs = require('fs');
const path = require('path');

const srcDir = 'e:\\CraftonAI\\src';
const files = fs.readdirSync(srcDir);

files.forEach(file => {
  const filePath = path.join(srcDir, file);
  if (fs.statSync(filePath).isFile()) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('renderCVQASimulator')) {
        console.log(`Match found in: ${file} (Size: ${fs.statSync(filePath).size} bytes)`);
      }
    } catch (e) {
      // ignore errors
    }
  }
});
