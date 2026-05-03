/**
 * Database Check & Seed Helper
 * This script checks your database status and helps seed data
 * 
 * Usage: node scripts/check-db.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

async function checkDatabase() {
  console.log('🔍 Checking Database Status...\n');
  console.log('='.repeat(70));

  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'siwa_oasis',
    });

    console.log('✅ Connected to database:', process.env.DB_NAME);

    // Check business_types
    console.log('\n📊 Checking business_types table...');
    const [types] = await connection.query('SELECT COUNT(*) as count FROM business_types');
    console.log(`   Records: ${types[0].count}`);
    
    if (types[0].count > 0) {
      const [sampleTypes] = await connection.query('SELECT id, name, is_parent, parent_id FROM business_types LIMIT 10');
      console.log('\n   Sample business types:');
      sampleTypes.forEach(t => {
        const parent = t.parent_id ? ` (child of: ${t.parent_id})` : ' (PARENT)';
        console.log(`   • ${t.name} - ${t.id}${parent}`);
      });
    } else {
      console.log('   ⚠️  NO BUSINESS TYPES FOUND!');
      console.log('   💡 You need to run the seed SQL file');
    }

    // Check sections
    console.log('\n📋 Checking sections table...');
    const [sections] = await connection.query('SELECT COUNT(*) as count FROM sections');
    console.log(`   Records: ${sections[0].count}`);
    
    if (sections[0].count > 0) {
      const [sampleSections] = await connection.query('SELECT id, name FROM sections LIMIT 10');
      console.log('\n   Sample sections:');
      sampleSections.forEach(s => {
        console.log(`   • ${s.name} (${s.id})`);
      });
    } else {
      console.log('   ⚠️  NO SECTIONS FOUND!');
    }

    // Check form_fields
    console.log('\n📝 Checking form_fields table...');
    const [fields] = await connection.query('SELECT COUNT(*) as count FROM form_fields');
    console.log(`   Records: ${fields[0].count}`);

    // Check profiles
    console.log('\n👤 Checking profiles table...');
    const [profiles] = await connection.query('SELECT COUNT(*) as count FROM profiles');
    console.log(`   Records: ${profiles[0].count}`);
    
    if (profiles[0].count > 0) {
      const [sampleProfiles] = await connection.query('SELECT email, role FROM profiles LIMIT 5');
      console.log('\n   Sample users:');
      sampleProfiles.forEach(p => {
        console.log(`   • ${p.email} (${p.role})`);
      });
    }

    // Check if activity_log exists
    console.log('\n📜 Checking activity_log table...');
    try {
      const [logs] = await connection.query('SELECT COUNT(*) as count FROM activity_log');
      console.log(`   ✅ Table exists, Records: ${logs[0].count}`);
    } catch (e) {
      console.log('   ❌ Table does NOT exist');
      console.log('   💡 This is optional - logging will be skipped');
    }

    // Summary and recommendations
    console.log('\n' + '='.repeat(70));
    console.log('📋 SUMMARY & NEXT STEPS');
    console.log('='.repeat(70));

    if (types[0].count === 0) {
      console.log('\n⚠️  YOUR DATABASE IS EMPTY!');
      console.log('\nTo seed the database with example data:');
      console.log('\nOPTION 1: Run the full schema (creates everything)');
      console.log('  1. Open phpMyAdmin or MySQL client');
      console.log('  2. Import: schema.sql');
      console.log('  3. This will create all tables AND seed data');
      
      console.log('\nOPTION 2: Run just the typologies seed');
      console.log('  1. Open phpMyAdmin or MySQL client');
      console.log('  2. Import: scratch/seed_typologies.sql');
      console.log('  3. This will create business types only');
      
      console.log('\nOPTION 3: Use MySQL command line');
      console.log('  mysql -u root siwa_oasis < schema.sql');
      
    } else {
      console.log('\n✅ Database has data!');
      console.log(`   • ${types[0].count} business types`);
      console.log(`   • ${sections[0].count} sections`);
      console.log(`   • ${fields[0].count} form fields`);
      console.log('\nIf you\'re not seeing changes in the UI:');
      console.log('  1. Hard refresh your browser (Ctrl+Shift+R)');
      console.log('  2. Check browser console for errors (F12)');
      console.log('  3. Verify you\'re logged in as admin');
      console.log('  4. Check the server terminal for errors');
    }

  } catch (error) {
    console.error('\n❌ Database connection error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('  1. MySQL server is running');
    console.log('  2. Database "siwa_oasis" exists');
    console.log('  3. Credentials in .env.local are correct');
    console.log('\nTo create the database:');
    console.log('  mysql -u root -e "CREATE DATABASE siwa_oasis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the check
checkDatabase();
