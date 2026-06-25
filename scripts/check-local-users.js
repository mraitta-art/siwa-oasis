const mysql = require('mysql2/promise');
(async () => {
  const cfg = { host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'siwa_oasis' };
  try {
    const conn = await mysql.createConnection(cfg);
    console.log('Connected to local DB');
    const [rows] = await conn.query('SELECT id, email, password_hash, updated_at FROM users LIMIT 10');
    console.log('ROWS_COUNT=' + rows.length);
    rows.forEach(r => console.log(JSON.stringify(r)));
    await conn.end();
  } catch (e) {
    console.error('DB_ERROR:', e.message);
    process.exit(2);
  }
})();
