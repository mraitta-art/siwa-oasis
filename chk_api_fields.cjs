const mysql = require('./node_modules/mysql2/promise');
async function main() {
  const conn = await mysql.createConnection({
    host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3iv5fPeLo2ze3jn.root',
    password: 'Dj2teUVtQyMYghF3',
    database: 'siwa_oasis',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  const [rows] = await conn.query("SELECT * FROM form_fields WHERE business_type_id IN ('hotel', 'accommodation', 'SECTION_TEMPLATE') LIMIT 10");
  console.log('Fields matching hotel / accommodation / SECTION_TEMPLATE:', rows.length);
  rows.forEach(r => console.log(`  id=${r.id} section=${r.section_id} name=${r.name} bt=${r.business_type_id}`));

  await conn.end();
}
main().catch(e => console.error(e));
