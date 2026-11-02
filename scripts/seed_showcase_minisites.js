const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

async function seedRealMinisites() {
  console.log(' Connecting to TiDB Cloud database...');
  const conn = await mysql.createConnection({
    host: process.env.TIDB_HOST || process.env.DB_HOST,
    port: parseInt(process.env.TIDB_PORT || process.env.DB_PORT || '4000'),
    user: process.env.TIDB_USER || process.env.DB_USER,
    password: process.env.TIDB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TIDB_DB || process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  console.log(' Connected. Preparing real developer projects and units...');

  // 1. Fetch Developer IDs
  const [devRows] = await conn.query('SELECT id, slug, name FROM developers');
  const devMap = {};
  devRows.forEach(d => { devMap[d.slug] = d.id; });

  const emaarId = devMap['emaar-misr'];
  const palmHillsId = devMap['palm-hills'];
  const mountainViewId = devMap['mountain-view'];
  const hassanAllamId = devMap['hassan-allam'];

  console.log('Developers IDs mapped:', { emaarId, palmHillsId, mountainViewId, hassanAllamId });

  // 2. Ensure LVLS Ras El Hekma development exists under Mountain View
  let [lvlsRows] = await conn.query('SELECT id FROM developments WHERE slug = "lvls-ras-el-hekma"');
  let lvlsDevId = lvlsRows[0]?.id;
  if (!lvlsDevId) {
    lvlsDevId = randomUUID();
    await conn.query(`
      INSERT INTO developments (
        id, market_id, slug, name_en, name_ar, developer_name, developer_id, 
        delivery_year, status, active, kind, facilities, lat, lng
      ) VALUES (?, 'ras-el-hekma', 'lvls-ras-el-hekma', 'LVLS Ras El Hekma', 'ليفيلز رأس الحكمة', 'Mountain View', ?, 2027, 'under_construction', 1, 'compound', ?, 31.0520, 27.8420)
    `, [
      lvlsDevId,
      mountainViewId,
      JSON.stringify(['Elevated 40m Sea View Terraces', 'Sandy Beach Lagoon', 'Beach Club', 'Commercial Strip', 'Infinity Pools'])
    ]);
    console.log(' Added development: LVLS Ras El Hekma');
  }

  // Get Marassi & Hacienda Bay & Swan Lake development IDs
  const [marassiRows] = await conn.query('SELECT id FROM developments WHERE slug = "marassi"');
  const marassiId = marassiRows[0]?.id;

  const [haciendaRows] = await conn.query('SELECT id FROM developments WHERE slug = "hacienda-bay"');
  const haciendaId = haciendaRows[0]?.id;

  const [swanLakeRows] = await conn.query('SELECT id FROM developments WHERE slug = "swan-lake-north-coast"');
  const swanLakeId = swanLakeRows[0]?.id;

  console.log('Developments mapped:', { marassiId, haciendaId, lvlsDevId, swanLakeId });

  // 3. Define the 4 Real Showcase Minisites & Units
  const showcaseData = [
    {
      slug: 'marassi-zaha-chalet',
      nameEn: 'Marassi Marina Zaha - Luxury 3BR Waterfront Chalet',
      nameAr: 'شاليه فاخر 3 غرف بإطلالة مارينا زها المباشرة - مراسي',
      developerId: emaarId,
      developmentId: marassiId,
      marketId: 'el-alamein',
      descEn: 'Experience prime Mediterranean living in Marassi Sidi Abdel Rahman. This 145 sqm 3-bedroom chalet overlooks the international yacht marina with signature Emaar hotel-grade finishing, fully air-conditioned, and immediate beach club access.',
      descAr: 'عيش أرقى تجارب الساحل الشمالي في مراسي سيدي عبد الرحمن. شاليه بمساحة 145 متر مربع مكون من 3 غرف نوم بإطلالة بانورامية مباشرة على مارينا اليخوت الدولية، تشطيب سوبر لوكس فندقي كامل بالتكييفات مع كارت شاطئ مراسي الحصري.',
      coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80'
      ],
      unit: {
        unitType: 'chalet',
        listingKind: 'sale',
        price: 22500000,
        currency: 'EGP',
        downPaymentPct: 10,
        installmentYears: 7,
        deliveryYear: 2025,
        areaSqm: 145,
        bedrooms: 3,
        bathrooms: 2,
        finishing: 'fully_finished',
        furnished: false,
        amenities: ['International Marina View', 'Private Beach Access', 'Clubhouse & Spa', 'Central AC', 'Covered Parking']
      },
      phone: '+201001234567',
      whatsapp: '+201001234567'
    },
    {
      slug: 'hacienda-bay-water-villa',
      nameEn: 'Hacienda Bay - Waterfront Twinhouse on Crystal Lagoon',
      nameAr: 'توين هاوس ووتر فيلا على اللاجون مباشرة - هاسيندا باي',
      developerId: palmHillsId,
      developmentId: haciendaId,
      marketId: 'el-alamein',
      descEn: 'Architectural masterpiece by Palm Hills Developments in Hacienda Bay KM 125. 280 sqm twinhouse featuring a private infinity plunge pool, sprawling manicured garden, and direct access to swimmable crystal lagoons and Lake Yard nightlife.',
      descAr: 'تحفة معمارية من شركة بالم هيلز للتعمير في هاسيندا باي الكيلو 125. توين هاوس بمساحة 280 متر مربع يضم حمام سباحة خاص وحديقة رحبة مع نزول مباشر على كريستال لاجون وممشى ليك يارد الشهير للمطاعم والخدمات.',
      coverImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80'
      ],
      unit: {
        unitType: 'twinhouse',
        listingKind: 'sale',
        price: 32000000,
        currency: 'EGP',
        downPaymentPct: 5,
        installmentYears: 8,
        deliveryYear: 2025,
        areaSqm: 280,
        bedrooms: 4,
        bathrooms: 4,
        finishing: 'fully_finished',
        furnished: false,
        amenities: ['Direct Lagoon Frontage', 'Private Pool', 'Lake Yard Access', 'Golf Course Proximity', 'Maid Room + Bath']
      },
      phone: '+201009876543',
      whatsapp: '+201009876543'
    },
    {
      slug: 'lvls-ras-el-hekma-beach-house',
      nameEn: 'LVLS Ras El Hekma - Elevated Sea View Beach House',
      nameAr: 'بيتش هاوس فاخر بإطلالة بحر كاملة على مصاطب - ليفيلز رأس الحكمة',
      developerId: mountainViewId,
      developmentId: lvlsDevId,
      marketId: 'ras-el-hekma',
      descEn: 'Perched 40 meters above sea level in Ras El Hekma KM 179 by Mountain View. This 180 sqm Beach House guarantees 100% panoramic Mediterranean horizon views, natural sandy beach lagoons, and generous 8-year flexible installment terms.',
      descAr: 'على مصاطب مدرجة بارتفاع 40 متراً عن سطح البحر في رأس الحكمة الكيلو 179 من ماونتن فيو. بيتش هاوس بمساحة 180 متر مربع يضمن إطلالة بحر مفتوحة بزاوية 180 درجة مع لاجون رملي خاص وتسهيلات سداد تصل إلى 8 سنوات بأقل مقدم.',
      coverImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80'
      ],
      unit: {
        unitType: 'townhouse',
        listingKind: 'sale',
        price: 19800000,
        currency: 'EGP',
        downPaymentPct: 10,
        installmentYears: 8,
        deliveryYear: 2027,
        areaSqm: 180,
        bedrooms: 3,
        bathrooms: 3,
        finishing: 'fully_finished',
        furnished: false,
        amenities: ['100% Sea View Guarantee', 'Sandy Lagoon Beach', 'Beach Clubhouse', 'Private Terrace', 'Smart Home System']
      },
      phone: '+201011122334',
      whatsapp: '+201011122334'
    },
    {
      slug: 'swan-lake-lagoon-townhouse',
      nameEn: 'Swan Lake North Coast - Signature Lagoon Townhouse',
      nameAr: 'تاون هاوس سيجنتشر على اللاجون - سوان ليك الساحل الشمالي',
      developerId: hassanAllamId,
      developmentId: swanLakeId,
      marketId: 'el-alamein',
      descEn: 'Signature boutique living by Hassan Allam Properties in Sidi Abdel Rahman. 255 sqm townhouse positioned along pristine swimmable crystal lagoons, bespoke architectural finishes, and an exclusive community for high-net-worth families.',
      descAr: 'مجتمع النخبة العائلي الراقي من شركة حسن علام العقارية في سيدي عبد الرحمن. تاون هاوس بمساحة 255 متر مربع على شاطئ الكريستال لاجون الصافي، تشطيب فاخر متكامل، مع مطاعم شاطئية عالمية ونادي رياضي متكامل.',
      coverImage: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80'
      ],
      unit: {
        unitType: 'townhouse',
        listingKind: 'sale',
        price: 26500000,
        currency: 'EGP',
        downPaymentPct: 5,
        installmentYears: 7,
        deliveryYear: 2026,
        areaSqm: 255,
        bedrooms: 4,
        bathrooms: 3,
        finishing: 'fully_finished',
        furnished: false,
        amenities: ['Boutique Beachfront Club', 'Crystal Lagoons Access', 'Sports Academy', 'Private Garden', 'Double Height Living']
      },
      phone: '+201022233445',
      whatsapp: '+201022233445'
    }
  ];

  // 4. Upsert businesses and units
  for (const item of showcaseData) {
    console.log(`\n Processing: ${item.slug} (${item.nameEn})`);

    // Check if business exists
    const [existingBiz] = await conn.query('SELECT id FROM businesses WHERE slug = ?', [item.slug]);
    let businessId = existingBiz[0]?.id;

    const customData = {
      basic: {
        business_name: item.nameEn,
        business_name_ar: item.nameAr,
        description: item.descEn,
        description_ar: item.descAr,
        logo: item.coverImage,
        cover_image: item.coverImage,
        phone: item.phone,
        whatsapp: item.whatsapp
      },
      asset_type: 'real_estate',
      specs: {
        listingKind: item.unit.listingKind,
        unitType: item.unit.unitType,
        price: String(item.unit.price),
        areaSqm: String(item.unit.areaSqm),
        bedrooms: String(item.unit.bedrooms),
        bathrooms: String(item.unit.bathrooms),
        downPaymentPct: String(item.unit.downPaymentPct),
        installmentYears: String(item.unit.installmentYears),
        deliveryYear: String(item.unit.deliveryYear),
        finishing: item.unit.finishing,
        amenities: item.unit.amenities
      },
      gallery: item.gallery,
      location: {
        market_id: item.marketId,
        development_id: item.developmentId,
        developer_id: item.developerId
      }
    };

    if (businessId) {
      // Update existing
      await conn.query(`
        UPDATE businesses SET
          name = ?,
          name_ar = ?,
          type_id = 'real_estate',
          market_id = ?,
          development_id = ?,
          status = 'active',
          published = 1,
          custom_data = ?
        WHERE id = ?
      `, [
        item.nameEn,
        item.nameAr,
        item.marketId,
        item.developmentId,
        JSON.stringify(customData),
        businessId
      ]);
      console.log(` Updated business: ${item.slug}`);
    } else {
      // Create new
      businessId = randomUUID();
      await conn.query(`
        INSERT INTO businesses (
          id, slug, name, name_ar, type_id, market_id, development_id,
          status, published, service_level, custom_data
        ) VALUES (?, ?, ?, ?, 'real_estate', ?, ?, 'active', 1, 'level_2', ?)
      `, [
        businessId,
        item.slug,
        item.nameEn,
        item.nameAr,
        item.marketId,
        item.developmentId,
        JSON.stringify(customData)
      ]);
      console.log(` Inserted business: ${item.slug} (${businessId})`);
    }

    // Upsert Unit entry for search & broker assignment
    const [existingUnit] = await conn.query('SELECT id FROM units WHERE slug = ? OR business_id = ?', [item.slug, businessId]);
    if (existingUnit[0]?.id) {
      await conn.query(`
        UPDATE units SET
          business_id = ?,
          development_id = ?,
          market_id = ?,
          title_ar = ?,
          title_en = ?,
          unit_type = ?,
          listing_kind = ?,
          bedrooms = ?,
          bathrooms = ?,
          area_sqm = ?,
          price = ?,
          currency = 'EGP',
          down_payment_pct = ?,
          installment_years = ?,
          delivery_year = ?,
          finishing = ?,
          status = 'available',
          active = 1,
          amenities = ?
        WHERE id = ?
      `, [
        businessId,
        item.developmentId,
        item.marketId,
        item.nameAr,
        item.nameEn,
        item.unit.unitType,
        item.unit.listingKind,
        item.unit.bedrooms,
        item.unit.bathrooms,
        item.unit.areaSqm,
        item.unit.price,
        item.unit.downPaymentPct,
        item.unit.installmentYears,
        item.unit.deliveryYear,
        item.unit.finishing,
        JSON.stringify(item.unit.amenities),
        existingUnit[0].id
      ]);
      console.log(` Updated unit inventory: ${item.slug}`);
    } else {
      const unitId = randomUUID();
      await conn.query(`
        INSERT INTO units (
          id, business_id, development_id, market_id, slug,
          title_ar, title_en, unit_type, listing_kind,
          bedrooms, bathrooms, area_sqm, price, currency,
          down_payment_pct, installment_years, delivery_year,
          finishing, status, active, amenities
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EGP', ?, ?, ?, ?, 'available', 1, ?)
      `, [
        unitId,
        businessId,
        item.developmentId,
        item.marketId,
        item.slug,
        item.nameAr,
        item.nameEn,
        item.unit.unitType,
        item.unit.listingKind,
        item.unit.bedrooms,
        item.unit.bathrooms,
        item.unit.areaSqm,
        item.unit.price,
        item.unit.downPaymentPct,
        item.unit.installmentYears,
        item.unit.deliveryYear,
        item.unit.finishing,
        JSON.stringify(item.unit.amenities)
      ]);
      console.log(` Inserted unit inventory: ${item.slug} (${unitId})`);
    }
  }

  await conn.end();
  console.log('\n All 4 Real Showcase Minisites & Units Successfully Seeded in TiDB Cloud!');
}

seedRealMinisites().catch(console.error);
