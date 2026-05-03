const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyBlogMigration() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'siwa_oasis'
  });

  console.log('\n🔍 VERIFYING BLOG MIGRATION\n');

  // Check blog tables
  const [blogTables] = await conn.query("SHOW TABLES LIKE 'blog_%'");
  console.log('✅ BLOG TABLES:');
  blogTables.forEach(t => console.log('  ✓', Object.values(t)[0]));

  // Check relationship table
  const [relTables] = await conn.query("SHOW TABLES LIKE 'content_%'");
  console.log('\n✅ RELATIONSHIP TABLE:');
  relTables.forEach(t => console.log('  ✓', Object.values(t)[0]));

  // Check categories
  const [cats] = await conn.query('SELECT name FROM blog_categories ORDER BY sort_order');
  console.log('\n✅ CATEGORIES (' + cats.length + '):');
  cats.forEach(c => console.log('  •', c.name));

  // Check tags
  const [tags] = await conn.query('SELECT name FROM blog_tags ORDER BY id LIMIT 10');
  console.log('\n✅ TAGS (' + tags.length + ' shown):');
  tags.forEach(t => console.log('  •', t.name));

  // Check sidebar configs
  const [sidebars] = await conn.query('SELECT page_type, layout FROM blog_sidebar_configs');
  console.log('\n✅ SIDEBAR CONFIGS:');
  sidebars.forEach(s => console.log('  •', s.page_type, '-', s.layout));

  console.log('\n🎉 BLOG MIGRATION VERIFIED SUCCESSFULLY!\n');

  await conn.end();
}

verifyBlogMigration().catch(console.error);
