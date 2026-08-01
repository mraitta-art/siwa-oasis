const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

// ── CONFIGURATION ────────────────────────────────────────────────────────────
const TOTAL_VIEWS = 8500;
const DAYS_BACK = 30;

const PAGES = [
  { path: '/', type: 'homepage' },
  { path: '/offers', type: 'offers' },
  { path: '/packages', type: 'packages' },
  { path: '/discounts', type: 'discounts' },
  { path: '/investment-opportunities', type: 'investments' },
  { path: '/auctions', type: 'auctions' },
  { path: '/blog', type: 'blog' },
  { path: '/search', type: 'discovery' },
  // Business minisites
  { path: '/lodge-deluxe', type: 'business', business_id: 'lodge_deluxe' },
  { path: '/glamping-tent', type: 'business', business_id: 'glamping_tent' },
  { path: '/eco-lodge', type: 'business', business_id: 'eco_lodge' },
  { path: '/fine-dining', type: 'business', business_id: 'fine_dining' },
  { path: '/sandboarding-safari', type: 'business', business_id: 'sandboarding' },
  { path: '/salt-cave-spa', type: 'business', business_id: 'salt_therapy' },
];

const REFERRERS = [
  { url: '', weight: 40 }, // Direct
  { url: 'https://www.google.com', weight: 30 },
  { url: 'https://l.instagram.com', weight: 12 },
  { url: 'https://lm.facebook.com', weight: 10 },
  { url: 'https://t.co', weight: 4 }, // Twitter/X
  { url: 'https://web.whatsapp.com', weight: 4 },
];

const DEVICES = [
  { type: 'mobile', weight: 65 },
  { type: 'desktop', weight: 30 },
  { type: 'tablet', weight: 5 },
];

const COUNTRIES = [
  { code: 'EG', weight: 60 },
  { code: 'US', weight: 15 },
  { code: 'DE', weight: 8 },
  { code: 'FR', weight: 7 },
  { code: 'GB', weight: 5 },
  { code: 'IT', weight: 5 },
];

// Helper to get weighted random item
function getWeightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    if (random < (item.weight || 1)) return item;
    random -= (item.weight || 1);
  }
  return items[0];
}

async function run() {
  console.log('Connecting to database...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '4000'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: true }
  });

  try {
    console.log('Cleaning up old page views...');
    await conn.execute('TRUNCATE TABLE page_views');

    console.log(`Generating ${TOTAL_VIEWS} page views over the last ${DAYS_BACK} days...`);

    // Generate unique sessions
    const sessions = [];
    for (let i = 0; i < 1800; i++) {
      sessions.push({
        id: 'sv-seed-' + crypto.randomUUID(),
        device: getWeightedRandom(DEVICES).type,
        country: getWeightedRandom(COUNTRIES).code,
        referrer: getWeightedRandom(REFERRERS).url,
      });
    }

    const values = [];
    const now = new Date();

    for (let i = 0; i < TOTAL_VIEWS; i++) {
      // Pick random session
      const session = sessions[Math.floor(Math.random() * sessions.length)];

      // Pick page view time (higher density in evenings and last few days)
      const dayOffset = Math.pow(Math.random(), 1.5) * DAYS_BACK; // weight towards recent days
      const hour = Math.floor(Math.max(0, Math.min(23, 12 + Math.random() * 8 + (Math.random() > 0.7 ? -8 : 0)))); // weight towards evening (12-20)
      const minute = Math.floor(Math.random() * 60);

      const timestamp = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      timestamp.setHours(hour, minute, 0, 0);

      // Pick page
      const page = PAGES[Math.floor(Math.random() * PAGES.length)];

      // Duration (higher for blog/details, lower for search/homepage)
      let duration = 5000 + Math.random() * 45000; // 5s to 50s baseline
      if (page.type === 'blog' || page.type === 'business') {
        duration = 15000 + Math.random() * 165000; // 15s to 3m
      } else if (page.type === 'homepage') {
        duration = 3000 + Math.random() * 20000;
      }

      // Check if this is a bounce (15% chance of < 2s duration)
      if (Math.random() < 0.15) {
        duration = 500 + Math.random() * 1000;
      }

      values.push([
        session.id,
        null, // visitor_id
        page.path,
        page.type,
        page.business_id || null,
        session.referrer || null,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
        session.device,
        session.country,
        Math.round(duration),
        timestamp
      ]);
    }

    // Sort chronologically
    values.sort((a, b) => a[10].getTime() - b[10].getTime());

    // Batch insert
    const batchSize = 1000;
    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      const queryStr = 'INSERT INTO page_views (session_id, visitor_id, page_path, page_type, business_id, referrer, user_agent, device_type, country, duration_ms, created_at) VALUES ' + 
        batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      
      const flatValues = batch.reduce((acc, val) => acc.concat(val), []);
      await conn.execute(queryStr, flatValues);
      console.log(`Inserted ${i + batch.length}/${TOTAL_VIEWS} views...`);
    }

    console.log('✓ Successfully seeded page views database!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await conn.end();
  }
}

run();
