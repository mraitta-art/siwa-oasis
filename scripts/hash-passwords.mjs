/**
 * PASSWORD HASH GENERATOR
 * Run: node scripts/hash-passwords.mjs
 * Updates the placeholder hashes in schema.sql with real bcrypt hashes
 */
import bcrypt from 'bcryptjs';

const users = [
  { id: 'a1', email: 'super@siwa.com',        password: 'super123' },
  { id: 'a2', email: 'content@siwa.com',       password: 'content123' },
  { id: 'a3', email: 'salesmanager@siwa.com',  password: 'sales123' },
  { id: 'a4', email: 'support@siwa.com',       password: 'support123' },
  { id: 'a5', email: 'salesman@siwa.com',      password: 'salesman123' },
  { id: 'a6', email: 'vendor@siwa.com',        password: 'vendor123' },
];

console.log('-- SIWA OASIS: Password Hash Update SQL');
console.log('-- Generated:', new Date().toISOString());
console.log('');

for (const u of users) {
  const hash = bcrypt.hashSync(u.password, 10);
  console.log(`UPDATE profiles SET password_hash = '${hash}' WHERE id = '${u.id}';`);
}

console.log('\n-- Done! Apply these SQL statements to your MySQL database.');
