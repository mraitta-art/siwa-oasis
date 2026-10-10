const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const filePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(filePath)) {
      console.error('Sample file not found:', filePath);
      process.exit(1);
    }

    const fileStream = fs.createReadStream(filePath);
    const FormData = global.FormData || require('formdata-node');
    const form = new FormData();
    form.append('file', fileStream, { filename: 'package.json' });
    form.append('businessName', 'TestBiz');
    form.append('sectionName', 'test');

    // Node 20+ supports fetch and form-data natively; fallback to node-fetch if needed
    const fetchImpl = global.fetch || (await import('node-fetch')).default;

    const res = await fetchImpl('http://localhost:3002/api/upload', { method: 'POST', body: form });
    const json = await res.json();
    console.log('Response status:', res.status);
    console.log('Response body:', json);
  } catch (err) {
    console.error('Upload test failed:', err);
    process.exit(1);
  }
})();
