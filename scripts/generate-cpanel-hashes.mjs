import bcrypt from 'bcryptjs';

const passwords = {
  'super@siwa.com': 'super123',
  'content@siwa.com': 'content123',
  'salesmanager@siwa.com': 'sales123',
  'support@siwa.com': 'support123',
  'salesman@siwa.com': 'salesman123',
  'vendor@siwa.com': 'vendor123'
};

console.log('BCRYPT PASSWORD HASHES FOR CPANEL:');
console.log('=====================================\n');

for (const [email, pwd] of Object.entries(passwords)) {
  const hash = await bcrypt.hash(pwd, 10);
  console.log(`${email}`);
  console.log(`  Password: ${pwd}`);
  console.log(`  Hash: ${hash}\n`);
}

console.log('\nNOTE: Use these hashes in schema.sql if you want to pre-seed accounts.');
console.log('Otherwise, auth.ts will auto-create accounts on first login attempt.\n');
