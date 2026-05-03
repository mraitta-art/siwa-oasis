const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runBlogMigration() {
  console.log('🚀 Starting blog system database migration...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'siwa_oasis',
    multipleStatements: true
  });

  try {
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'blog-system-schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Reading blog-system-schema.sql...');
    
    // Execute the SQL
    console.log('⚙️  Executing SQL statements...\n');
    await connection.query(sql);

    // Verify tables were created
    console.log('✅ Verifying tables...\n');
    
    const tables = ['blog_posts', 'blog_categories', 'blog_tags', 'blog_post_tags', 'blog_comments', 'blog_sidebar_configs'];
    
    for (const table of tables) {
      const [rows] = await connection.query(`SHOW TABLES LIKE '${table}'`);
      if (rows.length > 0) {
        console.log(`  ✓ ${table} created successfully`);
      } else {
        console.log(`  ✗ ${table} NOT found!`);
      }
    }

    // Count default data
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM blog_categories');
    const [tags] = await connection.query('SELECT COUNT(*) as count FROM blog_tags');
    const [sidebars] = await connection.query('SELECT COUNT(*) as count FROM blog_sidebar_configs');

    console.log('\n📊 Default data:');
    console.log(`  • Categories: ${categories[0].count}`);
    console.log(`  • Tags: ${tags[0].count}`);
    console.log(`  • Sidebar configs: ${sidebars[0].count}`);

    console.log('\n✅ Blog system database migration completed successfully!');
    console.log('🎉 You can now start creating blog posts!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

runBlogMigration().catch(console.error);
