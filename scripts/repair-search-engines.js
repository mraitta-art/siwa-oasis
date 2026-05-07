const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function repairSearchEngines() {
  console.log('🔧 REPAIRING SEARCH ENGINE POLICIES...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  const env = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  env.split('\n').forEach(l => {
    const parts = l.split('=');
    if (parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  });

  const conn = await mysql.createConnection({
    host: envVars.DB_HOST,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_NAME
  });

  // 1. Get all valid field names
  const [fields] = await conn.query('SELECT name FROM form_fields');
  const validNames = fields.map(f => f.name);
  console.log('Valid fields in DB:', validNames.join(', '));

  // 2. Identify common mappings
  const mapping = {
    'Name': 'business_name',
    'Location': 'location_map',
    'Vibe': 'vibe_tags',
    'Experience': 'experience_tags'
  };

  // 3. Fix the engines
  const [engines] = await conn.query('SELECT id, name, allowed_fields FROM search_engines');
  
  for (const eng of engines) {
    let allowed = JSON.parse(eng.allowed_fields || '[]');
    let fixed = allowed.map(f => mapping[f] || f);
    
    // Final check: only keep what actually exists
    fixed = fixed.filter(f => validNames.includes(f));

    if (JSON.stringify(allowed) !== JSON.stringify(fixed)) {
      console.log(`✅ Repairing "${eng.name}": [${allowed}] -> [${fixed}]`);
      await conn.query('UPDATE search_engines SET allowed_fields = ? WHERE id = ?', [JSON.stringify(fixed), eng.id]);
    }
  }

  await conn.end();
  console.log('✨ REPAIR COMPLETE.');
}

repairSearchEngines().catch(e => {
  console.error('❌ REPAIR FAILED:', e.message);
  process.exit(1);
});
