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

  const [rows] = await conn.query("SELECT id, name, parent_id, blueprint_schema FROM business_types WHERE id IN ('hotel', 'accommodation', 'lodge')");
  rows.forEach(r => console.log(`  id=${r.id} parent=${r.parent_id} blueprint_schema=${r.blueprint_schema ? (typeof r.blueprint_schema==='string'?r.blueprint_schema.substring(0,50):JSON.stringify(r.blueprint_schema).substring(0,50)) : 'NULL'}`));

  await conn.end();
}
main().catch(e => console.error(e));
