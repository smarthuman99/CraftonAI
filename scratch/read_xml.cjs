const fs = require('fs');
const path = require('path');

function extract() {
  const xmlPath = 'e:\\CraftonAI\\temp_arch\\word\\document.xml';
  if (!fs.existsSync(xmlPath)) {
    console.error('File not found:', xmlPath);
    return;
  }
  const content = fs.readFileSync(xmlPath, 'utf8');
  
  // Find all <w:t>...</w:t> tags
  const matches = content.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
  console.log(`Found ${matches.length} text elements.`);
  
  const texts = matches.map(m => {
    const t = m.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '');
    return t;
  });
  
  fs.writeFileSync('e:\\CraftonAI\\extracted_all_wt.txt', texts.join('\n'), 'utf8');
  console.log('Saved to extracted_all_wt.txt');
}

extract();
