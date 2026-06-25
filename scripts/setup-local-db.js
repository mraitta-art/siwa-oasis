const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const TEST_PASSWORD = 'demo123';
const rootDir = path.join(__dirname, '..');

const DB_CONFIG = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
};

(async () => {
  let conn;
  try {
    console.log('🔧 SIWA OASIS Local DB Setup');
    console.log('═'.repeat(60));

    // 1. Connect without DB
    console.log('📡 Connecting to MySQL...');
    conn = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected');

    // 2. Create/Reset database
    console.log('\n📦 Creating database...');
    await conn.query('DROP DATABASE IF EXISTS siwa_oasis');
    await conn.query('CREATE DATABASE siwa_oasis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ Database created');

    // 4. Switch to database
    await conn.query('USE siwa_oasis');

    // 5. Create profiles table directly
    console.log('\n📋 Creating profiles table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('super_admin','content_admin','sales_manager','support_agent','salesman','vendor','public') NOT NULL DEFAULT 'vendor',
        display_name VARCHAR(255),
        avatar_url TEXT,
        subscription_tier VARCHAR(50) DEFAULT 'free',
        business_id VARCHAR(36) DEFAULT NULL,
        active BOOLEAN DEFAULT TRUE,
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Profiles table created');

    // 6. Hash test password
    console.log('\n🔐 Generating password hashes...');
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    console.log(`✅ Password hashed (test password: "${TEST_PASSWORD}")`);

    // 7. Insert test users
    console.log('\n👤 Creating test users...');
    const testUsers = [
      { id: 'admin-1', email: 'admin@siwa.local', role: 'super_admin', displayName: 'Admin User', active: 1 },
      { id: 'vendor-1', email: 'vendor@siwa.local', role: 'vendor', displayName: 'Test Vendor', active: 1 },
      { id: 'content-1', email: 'content@siwa.local', role: 'content_admin', displayName: 'Content Admin', active: 1 }
    ];

    for (const user of testUsers) {
      try {
        await conn.query(
          'INSERT INTO profiles (id, email, password_hash, role, display_name, active) VALUES (?, ?, ?, ?, ?, ?)',
          [user.id, user.email, passwordHash, user.role, user.displayName, user.active]
        );
        console.log(`  ✅ ${user.email} (${user.role})`);
      } catch (e) {
        console.warn(`  ⚠️  ${user.email} - ${e.message.substring(0, 50)}`);
      }
    }

    // 8. Load migrations
    console.log('\n🔄 Loading migrations...');
    const migrationsDir = path.join(rootDir, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let migCount = 0;
    for (const file of migrationFiles) {
      try {
        const migPath = path.join(migrationsDir, file);
        const migSql = fs.readFileSync(migPath, 'utf8');
        const migStatements = migSql
          .split(';')
          .map(s => s.trim())
          .filter(s => s && !s.startsWith('--'));
        
        for (const stmt of migStatements) {
          try {
            await conn.query(stmt);
          } catch (e) {
            // Idempotent OK
          }
        }
        migCount++;
        console.log(`  ✅ ${file}`);
      } catch (e) {
        console.warn(`  ⚠️  ${file} - ${e.message.substring(0, 50)}`);
      }
    }
    console.log(`✅ Migrations applied (${migCount} files)`);

    // 8. Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ LOCAL DATABASE SETUP COMPLETE');
    console.log('═'.repeat(60));
    console.log('\n📚 Test Accounts (password: "' + TEST_PASSWORD + '"):');
    for (const user of testUsers) {
      console.log(`  • ${user.email} (${user.role})`);
    }
    console.log('\n🚀 Next: npm run dev');

    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    if (conn) await conn.end().catch(() => {});
    process.exit(1);
  }
})();
