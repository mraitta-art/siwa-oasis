/**
 * Fix placeholder password hashes in the database with real bcrypt hashes.
 * Run with: node fix-passwords.js
 */
require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const ACCOUNTS = [
  { id: 'a1', email: 'super@siwa.com',        hash: '$2b$10$7aZPj53SG7WS4edcuhhA9e542EHyjlO4D6N31r1GbhFaQm1nYz7ra' }, // super123
  { id: 'a2', email: 'content@siwa.com',       hash: '$2b$10$HQrqMTbPPiAya9J94LfgH.kDkB8sPwWhWERZCWqJiG2lJtf3JXZIm' }, // content123
  { id: 'a3', email: 'salesmanager@siwa.com',  hash: '$2b$10$n.PBS8QMQpjPGFrtDVyIcevWmnJOTEhkgpLG/dibx5lUe.UDuZoZ2' }, // sales123
  { id: 'a4', email: 'support@siwa.com',       hash: '$2b$10$K.50jvBJdj6glH5c2pnJ4OPwla9DnjX7lHRoNpVCCOrpab97lcPyW' }, // support123
  { id: 'a5', email: 'salesman@siwa.com',      hash: '$2b$10$ab9lZtq8AL2eLs7QwaPsQOIcBmeFn7ZsT7WPyXoz6h1ZWXEbLZJRa' }, // salesman123
  { id: 'a6', email: 'vendor@siwa.com',        hash: '$2b$10$JLVZ1DnRPL.h0KO50ISareIcrRCo/r0CWS9zG1kh4OLtuMO8HYvtq' }, // vendor123
];

async function main() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'siwa_oasis',
  });

  console.log('Connected to database.');

  for (const acc of ACCOUNTS) {
    // Upsert: update if exists, insert if not
    const [rows] = await conn.execute('SELECT id FROM profiles WHERE id = ?', [acc.id]);
    if (rows.length > 0) {
      await conn.execute(
        'UPDATE profiles SET password_hash = ? WHERE id = ?',
        [acc.hash, acc.id]
      );
      console.log(`✅ Updated password for ${acc.email}`);
    } else {
      console.log(`⚠️  Account ${acc.email} not found in DB — skipping.`);
    }
  }

  await conn.end();
  console.log('\n✅ Done! You can now login with:');
  console.log('   super@siwa.com       / super123');
  console.log('   content@siwa.com     / content123');
  console.log('   salesmanager@siwa.com/ sales123');
  console.log('   salesman@siwa.com    / salesman123');
  console.log('   vendor@siwa.com      / vendor123');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
