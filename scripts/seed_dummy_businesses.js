const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function seed() {
  const c = await mysql.createConnection({ 
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME, port: Number(process.env.DB_PORT || 3306), ssl: process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud') ? { rejectUnauthorized: false } : undefined 
  });

  const [types] = await c.query('SELECT * FROM business_types WHERE is_parent = 0');
  console.log(`Found ${types.length} leaf business types.`);

  let addedCount = 0;

  for (const t of types) {
    const [existing] = await c.query('SELECT id FROM businesses WHERE type_id = ? LIMIT 1', [t.id]);
    
    if (existing.length === 0) {
      const id = crypto.randomUUID();
      const name = `Siwa Oasis ${t.name}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + id.substring(0, 4);
      
      const custom_data = JSON.stringify({
        basic: {
          section_title: name,
          about: `This is a sample listing for ${t.name}. Visit this listing to see the custom fields and sections tailored for this business type.`
        }
      });

      await c.query(
        `INSERT INTO businesses (id, name, slug, type_id, vendor_id, subscription_tier, status, published, custom_data, views) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, 
          name, 
          slug, 
          t.id, 
          null, // Default anonymous vendor
          'premium', // Give it premium tier to show all features
          'active', 
          1, 
          custom_data,
          Math.floor(Math.random() * 500)
        ]
      );
      addedCount++;
    }
  }

  console.log(`Successfully added ${addedCount} dummy businesses.`);
  await c.end();
}

seed().catch(console.error);
