const mysql = require('mysql2/promise');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((a, l) => {
  const p = l.split('=');
  if(p.length >= 2) a[p[0].trim()] = p.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  return a;
}, {});

(async () => {
  const c = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME
  });

  const [engines] = await c.query('SELECT id, allowed_fields FROM search_engines');
  const [fields] = await c.query('SELECT name FROM form_fields');
  const validFields = fields.map(f => f.name);

  for (const eng of engines) {
    const allowed = JSON.parse(eng.allowed_fields || '[]');
    const valid = allowed.filter(f => validFields.includes(f));
    await c.query('UPDATE search_engines SET allowed_fields=? WHERE id=?', [JSON.stringify(valid), eng.id]);
    console.log(`Fixed engine ${eng.id}`);
  }

  await c.end();
})();
