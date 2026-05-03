const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [rows] = await connection.execute('SELECT email, role FROM profiles');
  console.log('--- DATABASE CHECK ---');
  console.log('DB Name:', process.env.DB_NAME);
  console.log('User Count:', rows.length);
  console.log('Users found:', rows);
  
  const [dbList] = await connection.execute('SHOW DATABASES');
  console.log('All Databases on this server:', dbList.map(d => d.Database));
  
  await connection.end();
}

check().catch(console.error);
