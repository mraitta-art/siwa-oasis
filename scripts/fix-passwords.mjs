import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const users = [
  { id: 'a1', email: 'super@siwa.com',       password: 'super123' },
  { id: 'a2', email: 'content@siwa.com',      password: 'content123' },
  { id: 'a3', email: 'salesmanager@siwa.com', password: 'sales123' },
  { id: 'a4', email: 'support@siwa.com',      password: 'support123' },
  { id: 'a5', email: 'salesman@siwa.com',     password: 'salesman123' },
  { id: 'a6', email: 'vendor@siwa.com',       password: 'vendor123' },
];

const db = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'siwa_oasis',
});

console.log('Connected to MySQL. Updating passwords...\n');

for (const u of users) {
  const hash = bcrypt.hashSync(u.password, 10);
  await db.execute('UPDATE profiles SET password_hash = ? WHERE id = ?', [hash, u.id]);
  console.log(`✅ ${u.email} → password: ${u.password}`);
}

console.log('\n🎉 All passwords updated! You can now log in.');
await db.end();
