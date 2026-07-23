const fs = require('fs');
const path = 'src/app/jana/layout.tsx';
const text = fs.readFileSync(path, 'utf8');
const lines = text.split(/\r?\n/);
const start = 260;
const end = 275;
let out = '';
for (let i = start; i <= end; i++) {
  const line = lines[i-1] || '';
  out += `${i}: ${line}\n`;
  out += `${Array.from(line).map(c => c.charCodeAt(0)).join(' ')}\n`;
}
fs.writeFileSync('layout_debug_bytes.txt', out, 'utf8');
