import { createConnection } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🚀 Starting Component Library Database Migration...\n');

  let connection;

  try {
    // Read environment variables or use defaults
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'siwa_oasis';

    console.log('📊 Connecting to database...');
    console.log(`   Host: ${dbHost}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   User: ${dbUser}\n`);

    // Create connection
    connection = await createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      multipleStatements: true
    });

    console.log('✅ Connected to database\n');

    // Read SQL file
    const sqlFile = path.join(__dirname, '../scripts/component-library-schema.sql');
    console.log(`📄 Reading SQL file: ${sqlFile}\n`);
    
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute SQL
    console.log('⚙️  Running migration...\n');
    await connection.query(sql);

    console.log('✅ Migration completed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('component_library', 'page_components', 'component_usage_log')
      ORDER BY TABLE_NAME
    `, [dbName]);

    if (tables.length === 3) {
      console.log('✅ All tables created successfully:\n');
      tables.forEach((table) => {
        console.log(`   ✓ ${table.TABLE_NAME}`);
      });
    } else {
      console.log('⚠️  Warning: Not all tables were created!');
      console.log(`   Expected: 3 tables`);
      console.log(`   Found: ${tables.length} tables\n`);
    }

    // Check if example data was inserted
    const [components] = await connection.query('SELECT COUNT(*) as count FROM component_library');
    console.log(`\n📦 Example components in library: ${components[0].count}`);

    console.log('\n✨ Migration complete! You can now use the Component Library system.\n');

  } catch (error) {
    console.error('\n❌ Migration failed!\n');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure MySQL is running');
    console.error('2. Check database credentials in .env.local');
    console.error('3. Verify database "siwa_oasis" exists');
    console.error('4. Check if you have permission to create tables\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('👋 Database connection closed.\n');
    }
  }
}

// Run migration
runMigration();
