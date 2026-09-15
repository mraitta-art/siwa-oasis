import mysql from 'mysql2/promise';
import { prodConfig } from './db-config.js';

const connection = await mysql.createConnection(prodConfig);

try {
  await connection.beginTransaction();

  const [sectionRows] = await connection.query('SELECT COUNT(*) AS count FROM sections WHERE active = 1 OR show_on_public = 1 OR show_on_minisite = 1');
  const activeCount = Number(sectionRows[0]?.count || 0);

  await connection.query(`
    UPDATE sections
    SET active = 0,
        show_on_public = 0,
        show_on_minisite = 0
  `);

  await connection.query(`
    UPDATE business_types
    SET sections = JSON_ARRAY(),
        own_sections = JSON_ARRAY()
  `);

  await connection.commit();
  console.log(`ARCHIVE_COMPLETE: sections_archived=${activeCount}; typology_assignments_cleared=true`);
} catch (error) {
  await connection.rollback();
  console.error(`ARCHIVE_FAILED:${error.message}`);
  process.exitCode = 1;
} finally {
  await connection.end();
}