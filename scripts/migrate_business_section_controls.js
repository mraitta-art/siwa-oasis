const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });
async function migrate() {
  const c = await mysql.createConnection({ host:process.env.DB_HOST, user:process.env.DB_USER, password:process.env.DB_PASSWORD, database:process.env.DB_NAME, port:Number(process.env.DB_PORT||3306) });
  
  console.log('Creating business_section_controls table...');
  await c.query(`
    CREATE TABLE IF NOT EXISTS business_section_controls (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      business_id VARCHAR(36) NOT NULL,
      section_id VARCHAR(100) NOT NULL,
      custom_label VARCHAR(200) NULL,
      admin_locked_label TINYINT(1) DEFAULT 0,
      admin_hidden TINYINT(1) DEFAULT 0,
      admin_disabled TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_biz_section (business_id, section_id),
      INDEX idx_business_id (business_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Table created successfully.');
  await c.end();
}
migrate().catch(console.error);
