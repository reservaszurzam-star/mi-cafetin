const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(walk(fullPath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          results.push(fullPath);
        }
      } catch (err) {}
    });
  } catch (err) {}
  return results;
}

const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

const files = walk(path.join(process.cwd(), 'src'));
const emojiFiles = [];

files.forEach(f => {
  try {
    const content = fs.readFileSync(f, 'utf8');
    const matches = content.match(emojiRegex);
    if (matches && matches.length > 0) {
      emojiFiles.push({
        file: path.relative(process.cwd(), f),
        count: matches.length,
        samples: Array.from(new Set(matches)).slice(0, 10)
      });
    }
  } catch (err) {}
});

console.log('Files with emojis:');
emojiFiles.sort((a,b) => b.count - a.count).forEach(ef => {
  console.log(`${ef.file} (${ef.count} emojis): ${ef.samples.join(' ')}`);
});
