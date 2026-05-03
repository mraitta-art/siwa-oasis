const bcrypt = require('bcryptjs');

const passwords = [
  'super123',
  'content123',
  'sales123',
  'support123',
  'salesman123',
  'vendor123'
];

console.log('--- GENERATING SECURE HASHES FOR SEED DATA ---');
passwords.forEach(pw => {
  const hash = bcrypt.hashSync(pw, 10);
  console.log(`${pw}: ${hash}`);
});
