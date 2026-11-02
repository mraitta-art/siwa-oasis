const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const DB = {
  host: process.env.TIDB_HOST || process.env.DB_HOST,
  port: Number(process.env.TIDB_PORT || process.env.DB_PORT || 4000),
  user: process.env.TIDB_USER || process.env.DB_USER,
  password: process.env.TIDB_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.TIDB_DATABASE || process.env.DB_NAME,
  ssl: { rejectUnauthorized: true },
};

(async () => {
  const conn = await mysql.createConnection(DB);

  // --- Real estate form fields ---
  const [fields] = await conn.execute(
    "SELECT id, section_id, name, label_ar, group_key FROM form_fields WHERE business_type_id = 'real_estate' ORDER BY section_id, sort_order"
  );
  console.log(`\n=== REAL ESTATE FORM FIELDS (${fields.length} total) ===`);
  for (const f of fields) {
    console.log(`  [${f.section_id}] ${f.name} | ar: ${f.label_ar || '—'} | group: ${f.group_key || '—'}`);
  }

  // --- Field groups ---
  const [groups] = await conn.execute(
    "SELECT id, section_id, name, label_ar FROM field_groups WHERE business_type_id = 'real_estate' ORDER BY section_id, sort_order"
  );
  console.log(`\n=== REAL ESTATE FIELD GROUPS (${groups.length} total) ===`);
  for (const g of groups) {
    console.log(`  [${g.section_id}] ${g.name} → ${g.label_ar}`);
  }

  // --- outreach_templates ---
  const [ot] = await conn.execute("SHOW TABLES LIKE 'outreach_templates'");
  console.log(`\n=== outreach_templates: ${ot.length ? 'EXISTS ✅' : 'MISSING ❌'}`);

  // --- Developers ---
  const [devs] = await conn.execute('SELECT id, name, business_id FROM developers ORDER BY name');
  console.log(`\n=== DEVELOPERS (${devs.length}) ===`);
  for (const d of devs) {
    console.log(`  ${d.name} | business_id: ${d.business_id || 'not linked'}`);
  }

  await conn.end();
  process.exit(0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
