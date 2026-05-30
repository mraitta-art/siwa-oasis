const mysql = require('mysql2');
require('dotenv').config();

const conn = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'siwa_oasis'
});

conn.query(`
  SELECT id, name, is_parent, parent_id FROM business_types 
  ORDER BY name, id
`, (err, results) => {
  if (err) {
    console.error('Error:', err.message);
    conn.end();
    process.exit(1);
  }

  console.log('=== ALL BUSINESS TYPES ===\n');
  results.forEach(r => {
    const type = r.is_parent ? '[PARENT]' : '[CHILD]';
    const parent = r.parent_id ? ` → Parent: ${r.parent_id}` : '';
    console.log(`${type} ${r.id}: ${r.name}${parent}`);
  });

  // Check for duplicates by name
  const nameGroups = {};
  results.forEach(r => {
    if (!nameGroups[r.name]) nameGroups[r.name] = [];
    nameGroups[r.name].push(r.id);
  });

  const duplicates = Object.entries(nameGroups).filter(([name, ids]) => ids.length > 1);
  
  console.log('\n=== DUPLICATE NAMES ===');
  if (duplicates.length === 0) {
    console.log('✓ No duplicate names found');
  } else {
    duplicates.forEach(([name, ids]) => {
      console.log(`\n"${name}": ${ids.join(', ')}`);
    });
  }

  conn.end();
});
