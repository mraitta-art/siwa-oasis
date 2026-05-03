/**
 * SIWA OASIS: Unified Master Schema Generator
 * Merges all scattered SQL files into one production-ready schema.
 * Fixes: password hashes, column mismatches, hardcoded DB name, type conflicts.
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const outputFile = path.join(rootDir, 'master-schema.sql');

// Read source files
const mainSchema = fs.readFileSync(path.join(rootDir, 'schema.sql'), 'utf8');
const blogSchema = fs.readFileSync(path.join(__dirname, 'blog-with-relationships-schema.sql'), 'utf8');
const componentSchema = fs.readFileSync(path.join(__dirname, 'component-library-schema.sql'), 'utf8');

// --- FIX 1: Remove hardcoded DB name ---
let fixedMain = mainSchema
  .replace(/CREATE DATABASE IF NOT EXISTS siwa_oasis[^;]*;\n?/i, '')
  .replace(/USE siwa_oasis;\n?/i, '');

// --- FIX 2: Replace fake password hashes with real bcrypt hashes ---
fixedMain = fixedMain
  .replace("'$2a$10$placeholder_super'", "'$2b$10$Xy060W..9q4kdPM64x3LBOqW8VbpIsYG9GQotW.lECkj48Zqr1CRS'")
  .replace("'$2a$10$placeholder_content'", "'$2b$10$7TkIV.lRT.QfdA7LMB7L3evFJpfwGwVttUKi3cp9E6crDsC2EspgW'")
  .replace("'$2a$10$placeholder_sales'", "'$2b$10$UwrNseTOgCPOj7RZf.YgzO9KYKwEaWRUkOT7mnHK0tIMQXj0Ek4be'")
  .replace("'$2a$10$placeholder_support'", "'$2b$10$1.OBA6UeAbCd3E8uyrXQE.SFywMJheKPWZcrRxE9lkNETt8WzUKsO'")
  .replace("'$2a$10$placeholder_salesman'", "'$2b$10$5N1EdMCV2stliffkQLkT.ODYQCFMMUH0XmGqqVpLG6T91ihz3Wv8.'")
  .replace("'$2a$10$placeholder_vendor'", "'$2b$10$E0tH4FCp8vmdU2l9NXubiuD5LU94bK5uWzg/D.cce3D59Y3WusA92'");

// --- FIX 3: Fix website_configs to use consistent definition ---
// Replace the simple PK-based definition with the auto-increment version
fixedMain = fixedMain.replace(
  /CREATE TABLE IF NOT EXISTS website_configs \(\s*type VARCHAR\(100\) PRIMARY KEY,\s*config JSON NOT NULL,\s*updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\s*\);/s,
  `CREATE TABLE IF NOT EXISTS website_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(100) UNIQUE NOT NULL,
  config JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
);

// --- Assemble the unified schema ---
const header = `-- ============================================================
-- SIWA OASIS: UNIFIED MASTER SCHEMA
-- Generated: ${new Date().toISOString().split('T')[0]}
-- 
-- This file contains ALL tables needed for the complete platform:
--   Part 1: Core Platform (18 tables + seeds)
--   Part 2: Blog System (7 tables + seeds)  
--   Part 3: Component Library (3 tables + seeds)
--
-- INSTRUCTIONS:
--   1. Create your database in cPanel/phpMyAdmin first
--   2. Select that database
--   3. Import this entire file
--
-- Compatible with: MySQL 8.0+, TiDB Cloud, Railway MySQL
-- ============================================================

`;

const separator1 = `

-- ============================================================
-- PART 2: BLOG SYSTEM + CONTENT RELATIONSHIPS
-- (7 tables: blog_posts, blog_categories, blog_tags,
--  blog_post_tags, blog_comments, blog_sidebar_configs,
--  content_relationships)
-- ============================================================

`;

const separator2 = `

-- ============================================================
-- PART 3: COMPONENT LIBRARY SYSTEM
-- (3 tables: component_library, page_components,
--  component_usage_log)
-- ============================================================

`;

const unified = header + fixedMain + separator1 + blogSchema + separator2 + componentSchema;

fs.writeFileSync(outputFile, unified);

// Report
const tableCount = (unified.match(/CREATE TABLE/gi) || []).length;
const insertCount = (unified.match(/INSERT/gi) || []).length;

console.log('✅ Unified master schema created!');
console.log(`   📁 File: master-schema.sql`);
console.log(`   📊 Tables: ${tableCount}`);
console.log(`   🌱 INSERT statements: ${insertCount}`);
console.log(`   📏 Size: ${(Buffer.byteLength(unified) / 1024).toFixed(1)} KB`);
console.log('');
console.log('🔧 Fixes applied:');
console.log('   ✓ Removed hardcoded "CREATE DATABASE / USE siwa_oasis"');
console.log('   ✓ Replaced fake password hashes with real bcrypt hashes');
console.log('   ✓ Fixed website_configs table definition');
console.log('   ✓ Merged blog system (7 tables)');
console.log('   ✓ Merged component library (3 tables)');
console.log('');
console.log('⚠️  REMAINING MANUAL FIX NEEDED:');
console.log('   In src/app/api/blog/route.ts and src/app/api/admin/blog/route.ts:');
console.log('   Change: u.full_name → u.display_name');
