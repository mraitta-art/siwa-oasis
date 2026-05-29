const fs = require('fs');
const content = fs.readFileSync('e:/ANitgravity/siwatoday/siwa-oasis-prototype/index.html', 'utf8');
const match = content.match(/<script>([\s\S]*?)<\/script>/);
if (match) {
    fs.writeFileSync('e:/ANitgravity/siwatoday/temp.js', match[1]);
    console.log("Extracted JS.");
} else {
    console.log("No script found.");
}
