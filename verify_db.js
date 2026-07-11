const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'corrupt_backup',
    port: 3306
  });
  const [rows] = await connection.query('SHOW TABLES');
  console.log("Tables in corrupt_backup:", rows.map(r => Object.values(r)[0]));
  await connection.end();
}

main().catch(console.error);
