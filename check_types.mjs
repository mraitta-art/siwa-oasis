import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  try {
    const [types] = await connection.execute('SELECT id, name, is_parent, parent_id, active FROM business_types');
    console.log('--- ALL BUSINESS TYPES ---');
    types.forEach(t => {
      console.log(`- ${t.name} (ID: ${t.id}) | is_parent: ${t.is_parent} | parent_id: ${t.parent_id} | active: ${t.active}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

run();
