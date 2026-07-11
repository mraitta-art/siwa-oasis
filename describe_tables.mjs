import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'siwa_oasis'
  });

  try {
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('--- TABLES IN DB ---');
    rows.forEach(r => console.log(Object.values(r)[0]));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

run();
