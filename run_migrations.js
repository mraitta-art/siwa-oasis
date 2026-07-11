const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'e:/ANitgravity/siwatoday/siwa-oasis/.env.local' });

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'siwa_oasis',
    port: 3306
  });

  const runSql = async (sql) => {
    try {
      await connection.query(sql);
      console.log(`✅ Success: ${sql}`);
    } catch (e) {
      console.log(`⚠️ Skip/Error: ${e.message}`);
    }
  };

  console.log("Checking and upgrading tables...");
  
  const [tables] = await connection.query('SHOW TABLES');
  const tableNames = tables.map(r => Object.values(r)[0]);
  
  if (!tableNames.includes('businesses')) {
    console.log("Database looks empty. Loading schema.sql...");
    const schemaSql = require('fs').readFileSync('schema.sql', 'utf8');
    const queries = schemaSql.split(';').filter(q => q.trim().length > 0);
    for (const q of queries) {
      await runSql(q);
    }
    
    console.log("Running standalone migrate.js script...");
    require('C:/Users/mega tech/.gemini/antigravity/brain/fb249cad-71c4-41da-92f8-17969508e584/scratch/migrate.js');
  }

  // Now run ALTERS for show_on_main & show_on_minisite
  await runSql("ALTER TABLE section_blogs ADD COLUMN IF NOT EXISTS show_on_main BOOLEAN DEFAULT TRUE");
  await runSql("ALTER TABLE section_blogs ADD COLUMN IF NOT EXISTS show_on_minisite BOOLEAN DEFAULT TRUE");
  await runSql("ALTER TABLE vendor_gallery ADD COLUMN IF NOT EXISTS show_on_main BOOLEAN DEFAULT TRUE");
  await runSql("ALTER TABLE vendor_gallery ADD COLUMN IF NOT EXISTS show_on_minisite BOOLEAN DEFAULT TRUE");

  await connection.end();
  console.log("Local database migrations completed!");
}

main().catch(console.error);
