import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: { rejectUnauthorized: true }
  });

  try {
    console.log('Finding orphaned sections...');
    const [sections] = await connection.execute(
      'SELECT id, name, business_type_id FROM sections WHERE business_type_id IS NOT NULL AND business_type_id != "" AND business_type_id NOT IN (SELECT id FROM business_types)'
    );
    
    console.log('Orphaned sections found:', sections);

    if (Array.isArray(sections) && sections.length > 0) {
      console.log(`Deleting ${sections.length} orphaned sections...`);
      const [result] = await connection.execute(
        'DELETE FROM sections WHERE business_type_id IS NOT NULL AND business_type_id != "" AND business_type_id NOT IN (SELECT id FROM business_types)'
      );
      console.log('Deletion result:', result);
    } else {
      console.log('No orphaned sections found.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

run();
