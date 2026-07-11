const fs = require('fs');
const path = require('path');

const dir = 'migrations';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.sql')) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    if (content.toLowerCase().includes('section_blogs') || content.toLowerCase().includes('create table')) {
      if (content.toLowerCase().includes('section_blogs')) {
        console.log(`Found section_blogs in ${file}`);
      }
    }
  }
}
