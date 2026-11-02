/**
 * Reference Real Estate & Developments Seeder
 *
 * Populates canonical developers, flagship developments (compounds),
 * sample unit inventory, and corporate business identities.
 *
 * Usage:
 *   node scripts/seed_real_estate_reference.js --dry
 *   node scripts/seed_real_estate_reference.js --apply
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const isDryRun = !process.argv.includes('--apply');

const DEVELOPERS = [
  {
    slug: 'emaar-misr',
    name: 'Emaar Misr',
    name_ar: 'إعمار مصر',
    about: 'One of the largest master-planned community developers in Egypt, creator of Marassi, Uptown Cairo, and Mivida.',
    about_ar: 'من أكبر مطوري المجتمعات العمرانية المتكاملة في مصر، مطور مراسي وأبتاون كايرو وميفيدا.',
  },
  {
    slug: 'palm-hills',
    name: 'Palm Hills Developments',
    name_ar: 'بالم هيلز للتعمير',
    about: 'Leading real estate developer with a vast portfolio across East Cairo, West Cairo, and the North Coast.',
    about_ar: 'شركة رائدة في التطوير العقاري تمتلك محفظة مشروعات ضخمة في شرق وغرب القاهرة والساحل الشمالي.',
  },
  {
    slug: 'sodic',
    name: 'SODIC',
    name_ar: 'سوديك',
    about: 'Prominent developer known for upscale mixed-use developments, residential communities, and commercial hubs.',
    about_ar: 'مطور رائد يشتهر بالمجتمعات السكنية الراقية والمشروعات متعددة الاستخدامات والمراكز التجارية.',
  },
  {
    slug: 'hassan-allam',
    name: 'Hassan Allam Properties',
    name_ar: 'حسن علام العقارية',
    about: 'Prestigious family-owned legacy developer behind Swan Lake, Seasons, and Park View.',
    about_ar: 'مطور عريق ذو إرث ممتد وصاحب مشروعات سوان ليك وسيزونز وبارك فيو.',
  },
  {
    slug: 'mountain-view',
    name: 'Mountain View',
    name_ar: 'ماونتن فيو',
    about: 'Renowned for innovative lifestyle-focused communities in New Cairo, 6th of October, and Ras El Hekma.',
    about_ar: 'يشتهر بمجتمعات أسلوب الحياة المبتكرة في القاهرة الجديدة و6 أكتوبر ورأس الحكمة.',
  },
];

const DEVELOPMENTS = [
  {
    slug: 'marassi',
    market_id: 'el-alamein',
    name_en: 'Marassi',
    name_ar: 'مراسي',
    developer_slug: 'emaar-misr',
    developer_name: 'Emaar Misr',
    kind: 'compound',
    status: 'delivered',
    delivery_year: 2024,
    lat: 30.9856,
    lng: 28.8924,
    facilities: ['18-Hole Golf Course', 'International Marina', 'Beach Club', 'Five-Star Hotels', 'Commercial Promenade'],
    payment_plans: [
      { name: 'Direct Resale', down_payment_pct: 100, installment_years: 0, frequency: 'monthly', post_handover: false },
      { name: 'Developer Plan (Phased)', down_payment_pct: 10, installment_years: 7, frequency: 'quarterly', post_handover: true },
    ],
    place_at_root: 1,
  },
  {
    slug: 'hacienda-bay',
    market_id: 'el-alamein',
    name_en: 'Hacienda Bay',
    name_ar: 'هاسيندا باي',
    developer_slug: 'palm-hills',
    developer_name: 'Palm Hills Developments',
    kind: 'compound',
    status: 'delivered',
    delivery_year: 2023,
    lat: 30.9321,
    lng: 28.7654,
    facilities: ['Championship Golf Course', 'Lake Yard Commercial Area', 'Private Beach', 'Clubhouse'],
    payment_plans: [
      { name: 'Immediate Delivery Plan', down_payment_pct: 15, installment_years: 6, frequency: 'quarterly', post_handover: true },
    ],
    place_at_root: 1,
  },
  {
    slug: 'swan-lake-north-coast',
    market_id: 'el-alamein',
    name_en: 'Swan Lake North Coast',
    name_ar: 'سوان ليك الساحل الشمالي',
    developer_slug: 'hassan-allam',
    developer_name: 'Hassan Allam Properties',
    kind: 'compound',
    status: 'under_construction',
    delivery_year: 2026,
    lat: 30.9142,
    lng: 28.6987,
    facilities: ['Crystal Lagoons', 'Boutique Hotel', 'Sports Club', 'Gourmet Dining'],
    payment_plans: [
      { name: 'Off-Plan Launch', down_payment_pct: 5, installment_years: 8, frequency: 'quarterly', post_handover: true },
    ],
    place_at_root: 0,
  },
];

const SAMPLE_UNITS = [
  {
    slug: 'marassi-chalet-caterpillar-3br',
    development_slug: 'marassi',
    market_id: 'el-alamein',
    title_ar: 'شاليه فاخر 3 غرف أرضي بحديقة في مراسي',
    title_en: 'Luxury 3-Bedroom Ground Chalet with Garden in Marassi',
    unit_type: 'chalet',
    listing_kind: 'sale',
    price: 18500000,
    currency: 'EGP',
    bedrooms: 3,
    bathrooms: 2,
    area_sqm: 145,
    price_per_sqm: 127586,
    finishing: 'fully_finished',
    delivery_year: 2024,
    down_payment_pct: 20,
    installment_years: 5,
    amenities: ['Private Garden', 'Sea View', 'Covered Parking', 'Central AC'],
  },
  {
    slug: 'hacienda-bay-senior-chalet-lakeyard',
    development_slug: 'hacienda-bay',
    market_id: 'el-alamein',
    title_ar: 'شاليه علوي بروف بالقرب من ليك يارد هاسيندا باي',
    title_en: 'Senior Chalet with Roof Near Lake Yard Hacienda Bay',
    unit_type: 'chalet',
    listing_kind: 'sale',
    price: 22000000,
    currency: 'EGP',
    bedrooms: 4,
    bathrooms: 3,
    area_sqm: 195,
    price_per_sqm: 112820,
    finishing: 'furnished',
    delivery_year: 2023,
    down_payment_pct: 15,
    installment_years: 6,
    amenities: ['Roof Terrace', 'Furnished by Interior Designer', 'Lagoon Access'],
  },
  {
    slug: 'marassi-summer-rental-chalet-marina',
    development_slug: 'marassi',
    market_id: 'el-alamein',
    title_ar: 'شاليه للإيجار الصيفي بإطلالة مباشرة على مارينا مراسي',
    title_en: 'Summer Rental Chalet with Direct Marina Views in Marassi',
    unit_type: 'chalet',
    listing_kind: 'rent_night',
    price: 14000,
    currency: 'EGP',
    bedrooms: 2,
    bathrooms: 2,
    area_sqm: 110,
    finishing: 'furnished',
    amenities: ['Marina View', 'Daily Housekeeping', 'Beach Access Card'],
  },
];

async function main() {
  console.log('='.repeat(60));
  console.log(`REAL ESTATE REFERENCE DATA SEEDER [${isDryRun ? 'DRY-RUN' : 'APPLY'}]`);
  console.log('='.repeat(60));

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud') ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
  });

  try {
    // 1. Seed Developers
    console.log(`\n[1/3] Processing ${DEVELOPERS.length} Canonical Developers...`);
    const developerMap = new Map();

    for (const dev of DEVELOPERS) {
      const [existing] = await conn.query('SELECT id, slug, name FROM developers WHERE slug = ?', [dev.slug]);
      if (existing.length > 0) {
        console.log(`  ✓ Developer already exists: ${dev.name} (${existing[0].id})`);
        developerMap.set(dev.slug, existing[0].id);
      } else {
        const id = crypto.randomUUID();
        developerMap.set(dev.slug, id);
        console.log(`  + [NEW] Developer to insert: ${dev.name} (${dev.slug})`);
        if (!isDryRun) {
          await conn.query(
            `INSERT INTO developers (id, slug, name, name_ar, about, about_ar, active)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [id, dev.slug, dev.name, dev.name_ar, dev.about, dev.about_ar]
          );
        }
      }
    }

    // 2. Seed Developments
    console.log(`\n[2/3] Processing ${DEVELOPMENTS.length} Flagship Developments...`);
    const developmentMap = new Map();

    for (const d of DEVELOPMENTS) {
      const devId = developerMap.get(d.developer_slug);
      const [existing] = await conn.query('SELECT id, slug, name_en FROM developments WHERE slug = ?', [d.slug]);

      if (existing.length > 0) {
        console.log(`  ✓ Development already exists: ${d.name_en} (${existing[0].id})`);
        developmentMap.set(d.slug, existing[0].id);
      } else {
        const id = crypto.randomUUID();
        developmentMap.set(d.slug, id);
        console.log(`  + [NEW] Development to insert: ${d.name_en} (${d.slug}) [Kind: ${d.kind}, Dev: ${d.developer_name}]`);

        if (!isDryRun) {
          await conn.query(
            `INSERT INTO developments (
               id, market_id, slug, name_ar, name_en, kind, developer_name, developer_id,
               status, delivery_year, lat, lng, facilities, payment_plans, data_verified_at,
               place_at_root, active
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 1)`,
            [
              id,
              d.market_id,
              d.slug,
              d.name_ar,
              d.name_en,
              d.kind,
              d.developer_name,
              devId || null,
              d.status,
              d.delivery_year,
              d.lat,
              d.lng,
              JSON.stringify(d.facilities),
              JSON.stringify(d.payment_plans),
              d.place_at_root,
            ]
          );
        }
      }
    }

    // 3. Seed Reference Units
    console.log(`\n[3/3] Processing ${SAMPLE_UNITS.length} Sample Units...`);
    for (const u of SAMPLE_UNITS) {
      const devId = developmentMap.get(u.development_slug);
      if (!devId) {
        console.log(`  ! Skipping unit ${u.slug}: parent development ${u.development_slug} not found.`);
        continue;
      }

      const [existing] = await conn.query('SELECT id, slug FROM units WHERE slug = ?', [u.slug]);
      if (existing.length > 0) {
        console.log(`  ✓ Unit already exists: ${u.title_en} (${existing[0].id})`);
      } else {
        const id = crypto.randomUUID();
        console.log(`  + [NEW] Unit to insert: ${u.title_en} [${u.listing_kind.toUpperCase()} - ${u.price} ${u.currency}]`);

        if (!isDryRun) {
          await conn.query(
            `INSERT INTO units (
               id, market_id, development_id, slug, title_ar, title_en, unit_type,
               listing_kind, price, currency, bedrooms, bathrooms,
               area_sqm, price_per_sqm, finishing, delivery_year, down_payment_pct,
               installment_years, amenities, status
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
            [
              id,
              u.market_id,
              devId,
              u.slug,
              u.title_ar,
              u.title_en,
              u.unit_type,
              u.listing_kind,
              u.price,
              u.currency,
              u.bedrooms,
              u.bathrooms,
              u.area_sqm,
              u.price_per_sqm || null,
              u.finishing,
              u.delivery_year || null,
              u.down_payment_pct || null,
              u.installment_years || null,
              JSON.stringify(u.amenities),
            ]
          );
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    if (isDryRun) {
      console.log('DRY RUN COMPLETE — No changes were written.');
      console.log('Run with --apply to commit these reference records to the database.');
    } else {
      console.log('SUCCESS: All reference real estate records committed to the database.');
    }
    console.log('='.repeat(60));
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('Fatal error during seed execution:', err);
  process.exit(1);
});
