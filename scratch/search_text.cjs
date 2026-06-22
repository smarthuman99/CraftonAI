const fs = require('fs');
const path = require('path');

const scratchDir = "e:\\CraftonAI\\scratch";
const files = fs.readdirSync(scratchDir);

const keywords = ["OurStory", "CaseStudies", "marketingTab", "clientPortalTab"];

files.forEach(file => {
  if (file.endsWith('.json')) {
    const filePath = path.join(scratchDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    keywords.forEach(kw => {
      if (content.includes(kw)) {
        console.log(`File ${file} contains keyword: ${kw}`);
      }
    });
  }
});
