/**
 * seed_showcase_layouts.js
 * Seeds website_configs with proper Jana Minisite Builder layouts
 * for the 4 showcase real estate businesses.
 *
 * Layout key format: minisite_layout_${slug}
 * Each layout includes: vendor_hero, property_specs, vendor_gallery, vendor_services, cta_section
 */

const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const SHOWCASE_SLUGS = [
  'marassi-zaha-chalet',
  'hacienda-bay-water-villa',
  'lvls-ras-el-hekma-beach-house',
  'swan-lake-lagoon-townhouse',
];

/** Build a Jana-compatible minisite layout for a real estate business */
function buildRealEstateLayout(slug, businessName) {
  const ts = new Date().toISOString();
  return {
    mode: 'replace',
    components: [
      {
        id: `vendor_hero_${slug}`,
        type: 'vendor_hero',
        order: 0,
        props: {
          title: businessName,
          show_contact_cta: true,
          show_whatsapp: true,
          overlay_opacity: 0.55,
        },
      },
      {
        id: `vendor_gallery_${slug}`,
        type: 'vendor_gallery',
        order: 1,
        props: {
          title: 'Property Gallery',
          title_ar: 'معرض الصور',
          show_caption: true,
          columns: 3,
        },
      },
      {
        id: `vendor_services_${slug}`,
        type: 'vendor_services',
        order: 2,
        props: {
          title: 'Unit Specifications & Amenities',
          title_ar: 'مواصفات الوحدة والمرافق',
          show_icons: true,
          layout: 'grid',
        },
      },
      {
        id: `cta_section_${slug}`,
        type: 'cta_section',
        order: 3,
        props: {
          title: 'Request a Site Visit',
          title_ar: 'احجز زيارة للموقع',
          subtitle: 'Our sales team will get in touch within 24 hours',
          subtitle_ar: 'سيتواصل معك فريق المبيعات خلال 24 ساعة',
          cta_label: 'Book a Visit',
          cta_label_ar: 'احجز زيارة',
          show_whatsapp: true,
        },
      },
    ],
    site_settings: {
      bg_color: '#090e17',
      primary_color: '#D4AF37',
      nav_bg_color: '#0d1520',
      text_color: '#f8fafc',
      show_platform_nav: true,
      show_platform_footer: true,
    },
    updated_at: ts,
    updated_by: 'admin_seed',
  };
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.TIDB_HOST || process.env.DB_HOST,
    port: parseInt(process.env.TIDB_PORT || process.env.DB_PORT || '4000'),
    user: process.env.TIDB_USER || process.env.DB_USER,
    password: process.env.TIDB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TIDB_DB || process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  console.log('✅ Connected to DB');

  // Fetch showcase businesses
  const placeholders = SHOWCASE_SLUGS.map(() => '?').join(',');
  const [businesses] = await conn.query(
    `SELECT id, slug, name, name_ar FROM businesses WHERE slug IN (${placeholders})`,
    SHOWCASE_SLUGS
  );

  console.log(`\nFound ${businesses.length} showcase businesses:`);
  businesses.forEach((b) => console.log(`  • ${b.slug} → id=${b.id}`));

  if (businesses.length === 0) {
    console.error('❌ No showcase businesses found in DB! Run seed_showcase_minisites.js first.');
    await conn.end();
    return;
  }

  // Seed website_configs for each business
  for (const biz of businesses) {
    const layoutKey = `minisite_layout_${biz.slug.toLowerCase()}`;
    const businessName = biz.name || biz.name_ar || biz.slug;
    const layout = buildRealEstateLayout(biz.slug, businessName);
    const layoutJson = JSON.stringify(layout);

    // Check if already exists
    const [existing] = await conn.query(
      'SELECT id, updated_at FROM website_configs WHERE type = ? LIMIT 1',
      [layoutKey]
    );

    if (existing.length > 0) {
      console.log(`\n⚠️  Layout already exists for ${biz.slug} (id=${existing[0].id}, updated=${existing[0].updated_at})`);
      console.log('   Updating with fresh layout...');
      await conn.query(
        'UPDATE website_configs SET config = ? WHERE type = ?',
        [layoutJson, layoutKey]
      );
      console.log(`   ✅ Updated: ${layoutKey}`);
    } else {
      await conn.query(
        'INSERT INTO website_configs (type, config) VALUES (?, ?)',
        [layoutKey, layoutJson]
      );
      console.log(`\n✅ Inserted layout: ${layoutKey}`);
    }
  }

  // Verify all 4 are now present
  console.log('\n--- Verification ---');
  const [allLayouts] = await conn.query(
    `SELECT type, JSON_LENGTH(config, '$.components') as component_count, 
            JSON_UNQUOTE(JSON_EXTRACT(config, '$.updated_at')) as updated_at
     FROM website_configs 
     WHERE type IN (${SHOWCASE_SLUGS.map(s => `'minisite_layout_${s}'`).join(',')})
     ORDER BY type`
  );
  console.table(allLayouts);

  await conn.end();
  console.log('\n🎉 Done! All 4 showcase minisites now have Jana-compatible layouts in website_configs.');
  console.log('   Visit each at: http://127.0.0.1:3005/jana/minisite-builder?slug=<slug>');
  SHOWCASE_SLUGS.forEach(s => console.log(`     → http://127.0.0.1:3005/jana/minisite-builder?slug=${s}`));
}

run().catch(console.error);
