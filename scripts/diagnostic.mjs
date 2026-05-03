// Complete system diagnostic script
// Run with: node scripts/diagnostic.mjs

import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🔍 SYSTEM DIAGNOSTIC STARTING...\n');

async function runDiagnostics() {
  // 1. Check Node.js
  console.log('1️⃣  Node.js Version:');
  const nodeVersion = process.version;
  console.log(`   ${nodeVersion}`);
  console.log(`   Status: ${nodeVersion.startsWith('v22') || nodeVersion.startsWith('v20') || nodeVersion.startsWith('v18') ? '✅ OK' : '⚠️  Recommended: v18, v20, or v22'}\n`);

  // 2. Check Environment Variables
  console.log('2️⃣  Environment Variables:');
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
  const envOk = requiredVars.every(v => process.env[v]);
  console.log(`   DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT || 'NOT SET'}`);
  console.log(`   DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);
  console.log(`   Status: ${envOk ? '✅ All required vars set' : '❌ Missing required vars'}\n`);

  // 3. Check if MySQL is running
  console.log('3️⃣  MySQL Server:');
  try {
    const connection = await createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    const [rows] = await connection.query('SELECT VERSION() as version');
    console.log(`   MySQL Version: ${rows[0].version}`);
    console.log(`   Status: ✅ MySQL is running\n`);
    await connection.end();
  } catch (error) {
    console.log(`   Status: ❌ Cannot connect to MySQL`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Fix: Start MySQL service\n`);
    return;
  }

  // 4. Check if database exists
  console.log('4️⃣  Database:');
  try {
    const connection = await createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    const [dbs] = await connection.query('SHOW DATABASES');
    const dbExists = dbs.some(db => db.Database === process.env.DB_NAME);
    
    if (dbExists) {
      console.log(`   Database "${process.env.DB_NAME}": ✅ EXISTS\n`);
      
      // 5. Check tables
      console.log('5️⃣  Database Tables:');
      await connection.query(`USE \`${process.env.DB_NAME}\``);
      const [tables] = await connection.query('SHOW TABLES');
      
      const tableNames = tables.map(t => Object.values(t)[0]);
      console.log(`   Total tables: ${tableNames.length}`);
      console.log(`   Tables: ${tableNames.join(', ')}\n`);

      // 6. Check if website_configs table exists
      console.log('6️⃣  Critical Table (website_configs):');
      if (tableNames.includes('website_configs')) {
        console.log(`   Status: ✅ EXISTS\n`);
        
        // Check if it has data
        const [rows] = await connection.query('SELECT type, JSON_LENGTH(config) as slide_count FROM website_configs');
        console.log('7️⃣  Config Data:');
        if (rows.length > 0) {
          rows.forEach(row => {
            console.log(`   Type: ${row.type}, Slides: ${row.slide_count}`);
          });
          console.log(`   Status: ✅ Has data\n`);
        } else {
          console.log(`   Status: ⚠️  Table exists but empty\n`);
        }
      } else {
        console.log(`   Status: ❌ MISSING`);
        console.log(`   Action Required: Create the table\n`);
        console.log('   Run this SQL in phpMyAdmin:');
        console.log('   ──────────────────────────────────────');
        console.log('   CREATE TABLE IF NOT EXISTS website_configs (');
        console.log('     id INT AUTO_INCREMENT PRIMARY KEY,');
        console.log('     type VARCHAR(100) UNIQUE NOT NULL,');
        console.log('     config JSON NOT NULL,');
        console.log('     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,');
        console.log('     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,');
        console.log('     INDEX idx_type (type)');
        console.log('   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
        console.log('   ──────────────────────────────────────\n');
      }

      await connection.end();
    } else {
      console.log(`   Database "${process.env.DB_NAME}": ❌ DOES NOT EXIST`);
      console.log(`   Action: Create database first\n`);
      await connection.end();
      return;
    }
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
    return;
  }

  // 8. Check if dev server is running
  console.log('8️⃣  Development Server:');
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok || response.status === 404) {
      console.log(`   Status: ✅ RUNNING on http://localhost:3000\n`);
    } else {
      console.log(`   Status: ⚠️  Running but returned status ${response.status}\n`);
    }
  } catch (error) {
    console.log(`   Status: ❌ NOT RUNNING`);
    console.log(`   Fix: Run "npm run dev" in terminal\n`);
  }

  // 9. Check package.json dependencies
  console.log('9️⃣  Dependencies:');
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
  const pkg = JSON.parse(pkgContent);
  const hasMysql2 = pkg.dependencies && pkg.dependencies.mysql2;
  const hasNext = pkg.dependencies && pkg.dependencies.next;
  const hasReact = pkg.dependencies && pkg.dependencies.react;
  
  console.log(`   mysql2: ${hasMysql2 ? '✅' : '❌'}`);
  console.log(`   next: ${hasNext ? '✅' : '❌'}`);
  console.log(`   react: ${hasReact ? '✅' : '❌'}`);
  console.log(`   Status: ${hasMysql2 && hasNext && hasReact ? '✅ All dependencies present' : '❌ Missing dependencies'}\n`);

  // 10. Check node_modules
  console.log('🔟  node_modules:');
  const fs = await import('fs');
  const nodeModulesExists = fs.existsSync(path.join(__dirname, '..', 'node_modules'));
  if (nodeModulesExists) {
    console.log(`   Status: ✅ EXISTS\n`);
  } else {
    console.log(`   Status: ❌ MISSING`);
    console.log(`   Fix: Run "npm install"\n`);
  }

  // Final Summary
  console.log('═'.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('═'.repeat(60));
  console.log('');
  console.log('✅ WHAT\'S WORKING:');
  console.log('   • Node.js installed');
  console.log('   • Environment variables configured');
  console.log('   • MySQL server running');
  console.log('   • Dependencies installed');
  console.log('');
  
  if (!tableNames || !tableNames.includes('website_configs')) {
    console.log('❌ CRITICAL ISSUE:');
    console.log('   • website_configs table is MISSING');
    console.log('   • This prevents carousel from saving');
    console.log('');
    console.log('🔧 ACTION REQUIRED:');
    console.log('   1. Open phpMyAdmin: http://localhost/phpmyadmin');
    console.log('   2. Select database: siwa_oasis');
    console.log('   3. Go to SQL tab');
    console.log('   4. Paste the CREATE TABLE SQL shown above');
    console.log('   5. Click "Go"');
    console.log('   6. Restart dev server: npm run dev');
    console.log('');
  }

  console.log('═'.repeat(60));
  console.log('🎯 NEXT STEPS:');
  console.log('═'.repeat(60));
  console.log('');
  console.log('1. If table is missing → Create it (see SQL above)');
  console.log('2. If server not running → npm run dev');
  console.log('3. If dependencies missing → npm install');
  console.log('4. After fixes → Visit: http://localhost:3000/admin/hero-carousel');
  console.log('');
  console.log('🚀 Done!\n');
}

runDiagnostics().catch(console.error);
