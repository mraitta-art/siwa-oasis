const fs = require('fs');
const files = [
  'scripts/migrate_business_section_controls.js',
  'scripts/fix_slug.js',
  'scripts/seed_sections.js',
  'scripts/seed_trip_planner_types.js',
  'scripts/seed_dummy_businesses.js'
];
for(const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /database:\s*process\.env\.DB_NAME,?\s*port:\s*Number\(process\.env\.DB_PORT\s*\|\|\s*3306\)/g, 
    "database: process.env.DB_NAME, port: Number(process.env.DB_PORT || 3306), ssl: process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud') ? { rejectUnauthorized: false } : undefined"
  );
  fs.writeFileSync(file, content);
}
console.log('Updated scripts to support SSL');
