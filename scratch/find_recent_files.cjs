const fs = require('fs');
const path = require('path');

const dirs = [
  "e:\\CraftonAI",
  "C:\\Users\\huawei\\.gemini\\antigravity\\brain\\bb8cf887-15dc-442b-8106-09161bd4fb60"
];

const todayStr = "2026-06-12";

function scanDir(dir) {
  let results = [];
  let list;
  try {
    list = fs.readdirSync(dir);
  } catch (e) {
    return [];
  }
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch (e) {
      return;
    }
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        results = results.concat(scanDir(filePath));
      }
    } else {
      const mtimeStr = stat.mtime.toISOString();
      if (mtimeStr.startsWith(todayStr)) {
        results.push({
          path: filePath,
          size: stat.size,
          mtime: mtimeStr
        });
      }
    }
  });
  return results;
}

dirs.forEach((dir) => {
  console.log(`Scanning ${dir} for files modified today (${todayStr})...`);
  const files = scanDir(dir);
  console.log(`Found ${files.length} files:`);
  // Sort by mtime descending
  files.sort((a, b) => b.mtime.localeCompare(a.mtime));
  files.forEach((f) => {
    console.log(`- ${f.mtime} | ${f.size.toString().padStart(7)} bytes | ${f.path}`);
  });
});
