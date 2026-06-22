const fs = require('fs');

const path = "e:\\CraftonAI\\src\\app_fully_restored.jsx";
if (!fs.existsSync(path)) {
  console.log("File does not exist!");
  process.exit(1);
}

const content = fs.readFileSync(path, 'utf8');
console.log("File length:", content.length);
console.log("First 1000 characters:");
console.log(content.substring(0, 1000));
console.log("\nLast 1000 characters:");
console.log(content.substring(content.length - 1000));
