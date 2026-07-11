const fs = require('fs');

const content = fs.readFileSync('schema.sql', 'utf8');

const regexes = [
  /CREATE TABLE\s+vendor_gallery[\s\S]+?;/i,
  /CREATE TABLE\s+section_blogs[\s\S]+?;/i
];

for (const regex of regexes) {
  const match = content.match(regex);
  if (match) {
    console.log(match[0]);
  } else {
    console.log("No match found for", regex);
  }
}
