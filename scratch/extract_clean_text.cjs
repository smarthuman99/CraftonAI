const fs = require('fs');

const file = "src/app_reconstructed_v3.jsx";
if (!fs.existsSync(file)) {
  console.log("File not found:", file);
  process.exit(1);
}

const content = fs.readFileSync(file);
console.log("Original content size:", content.length);

// Strip out all 0x00 bytes
const filtered = content.filter(b => b !== 0x00);
console.log("Filtered content size:", filtered.length);

fs.writeFileSync("src/app_clean_reconstructed.jsx", filtered);
console.log("Saved cleaned file to src/app_clean_reconstructed.jsx");
