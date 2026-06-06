// ================================================================
// SIWA OASIS — Blueprint Engine Admin Setup Script
// Runs: DB migration + atom seeding + blueprint config per type
// Usage: node scripts/setup-blueprint-engine.mjs
// ================================================================

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ── DB Connection ─────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'siwa_oasis',
  multipleStatements: true,
  charset: 'utf8mb4',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const q = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};
const run = async (sql, params = []) => {
  const [result] = await pool.query(sql, params);
  return result;
};

const log  = (msg) => console.log(`  ✅ ${msg}`);
const info = (msg) => console.log(`\n🔷 ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 0 — DB MIGRATION
// ─────────────────────────────────────────────────────────────────────────────
async function runMigration() {
  info('PHASE 0 — DB Migration');

  // blueprint_atoms table
  await run(`CREATE TABLE IF NOT EXISTS blueprint_atoms (
    id              VARCHAR(100) PRIMARY KEY,
    label           VARCHAR(255) NOT NULL,
    type            VARCHAR(50)  NOT NULL,
    chapter         ENUM('identity','vibe','amenities','cuisine','programs','ecology','invest','offers') NOT NULL,
    options_json    JSON         NULL,
    validation_json JSON         NULL,
    display_hint    VARCHAR(500) NULL,
    icon            VARCHAR(100) NULL,
    layer_default   TINYINT      DEFAULT 1,
    tags_json       JSON         NULL,
    sort_order      INT          DEFAULT 0,
    active          BOOLEAN      DEFAULT true,
    created_at      DATETIME     DEFAULT NOW(),
    updated_at      DATETIME     DEFAULT NOW() ON UPDATE NOW(),
    INDEX idx_chapter (chapter),
    INDEX idx_layer   (layer_default),
    INDEX idx_active  (active)
  )`);
  log('blueprint_atoms table created/verified');

  // blueprint_schema column
  try {
    await run(`ALTER TABLE business_types ADD COLUMN blueprint_schema JSON NULL`);
    log('blueprint_schema column added to business_types');
  } catch (e) {
    if (e.message.includes('Duplicate column')) warn('blueprint_schema column already exists — skipped');
    else throw e;
  }

  // business_media table
  await run(`CREATE TABLE IF NOT EXISTS business_media (
    id          VARCHAR(36)  PRIMARY KEY,
    business_id VARCHAR(100) NOT NULL,
    chapter     ENUM('identity','vibe','amenities','cuisine','programs','ecology','invest','offers') NOT NULL,
    url         TEXT         NOT NULL,
    public_id   VARCHAR(255) NULL,
    type        ENUM('image','video') DEFAULT 'image',
    caption     VARCHAR(255) NULL,
    is_pinned   BOOLEAN      DEFAULT false,
    pin_order   INT          DEFAULT 0,
    uploaded_at DATETIME     DEFAULT NOW(),
    INDEX idx_biz     (business_id),
    INDEX idx_chapter (business_id, chapter),
    INDEX idx_pins    (business_id, is_pinned, pin_order)
  )`);
  log('business_media table created/verified');

  // business_posts table
  await run(`CREATE TABLE IF NOT EXISTS business_posts (
    id          VARCHAR(36)  PRIMARY KEY,
    business_id VARCHAR(100) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    body        LONGTEXT     NULL,
    cover_url   TEXT         NULL,
    category    VARCHAR(100) NULL,
    published   BOOLEAN      DEFAULT false,
    created_at  DATETIME     DEFAULT NOW(),
    updated_at  DATETIME     DEFAULT NOW() ON UPDATE NOW(),
    INDEX idx_biz (business_id),
    INDEX idx_pub (business_id, published)
  )`);
  log('business_posts table created/verified');
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — SEED ATOMS
// ─────────────────────────────────────────────────────────────────────────────
const ATOMS = [
  // IDENTITY
  { id:'description',       label:'Description',           type:'textarea',      chapter:'identity',  icon:'fa-align-left',    layer_default:1, tags:['all'] },
  { id:'hours',             label:'Opening Hours',         type:'text',          chapter:'identity',  icon:'fa-clock',         layer_default:1, tags:['all'] },
  { id:'website',           label:'Website URL',           type:'url',           chapter:'identity',  icon:'fa-link',          layer_default:1, tags:['all'] },
  { id:'email',             label:'Email Address',         type:'email',         chapter:'identity',  icon:'fa-envelope',      layer_default:1, tags:['all'] },
  { id:'social_links',      label:'Social Media Links',    type:'text',          chapter:'identity',  icon:'fa-share-alt',     layer_default:1, tags:['all'] },
  { id:'star_rating',       label:'Star Rating',           type:'star_rating',   chapter:'identity',  icon:'fa-star',          layer_default:2, tags:['hospitality'] },
  { id:'rooms',             label:'Number of Rooms',       type:'number',        chapter:'identity',  icon:'fa-bed',           layer_default:2, tags:['hospitality'] },
  { id:'check_in',          label:'Check-in Time',         type:'text',          chapter:'identity',  icon:'fa-sign-in-alt',   layer_default:2, tags:['hospitality'] },
  { id:'check_out',         label:'Check-out Time',        type:'text',          chapter:'identity',  icon:'fa-sign-out-alt',  layer_default:2, tags:['hospitality'] },
  { id:'architecture_style',label:'Architecture Style',    type:'select',        chapter:'identity',  icon:'fa-archway',       layer_default:2, tags:['hospitality','traditional'],
    options:['Traditional Kertshef','Restored Kertshef','Modern Kertshef Fusion','Contemporary Modern','Fully Eco/Off-Grid'] },
  // VIBE
  { id:'atmosphere',        label:'Atmosphere Tags',       type:'multiselect',   chapter:'vibe',      icon:'fa-wind',          layer_default:1, tags:['all'],
    options:['Peaceful','Vibrant','Romantic','Family-Friendly','Adventurous','Luxurious','Spiritual','Cultural'] },
  { id:'target_audience',   label:'Target Audience',       type:'multiselect',   chapter:'vibe',      icon:'fa-users',         layer_default:1, tags:['all'],
    options:['Couples','Families','Solo Travelers','Groups','Business','Backpackers'] },
  { id:'experience_type',   label:'Experience Type',       type:'multiselect',   chapter:'vibe',      icon:'fa-heart',         layer_default:2, tags:['all'],
    options:['Romantic','Family','Adventure','Cultural','Luxury','Meditation','Wellness'] },
  { id:'music',             label:'Music / Entertainment', type:'text',          chapter:'vibe',      icon:'fa-music',         layer_default:2, tags:['dining','nightlife'] },
  { id:'dress_code',        label:'Dress Code',            type:'text',          chapter:'vibe',      icon:'fa-tshirt',        layer_default:2, tags:['hospitality','dining'] },
  // AMENITIES
  { id:'restaurant_onsite', label:'Restaurant On-site',    type:'boolean',       chapter:'amenities', icon:'fa-utensils',      layer_default:1, tags:['hospitality'] },
  { id:'ac',                label:'Air Conditioning',      type:'boolean',       chapter:'amenities', icon:'fa-snowflake',     layer_default:1, tags:['all'] },
  { id:'garden',            label:'Garden',                type:'boolean',       chapter:'amenities', icon:'fa-leaf',          layer_default:1, tags:['all'] },
  { id:'pets_allowed',      label:'Pets Allowed',          type:'boolean',       chapter:'amenities', icon:'fa-paw',           layer_default:1, tags:['all'] },
  { id:'private_pool',      label:'Private Pool',          type:'boolean',       chapter:'amenities', icon:'fa-swimmer',       layer_default:2, tags:['hospitality'] },
  { id:'spa',               label:'Spa & Wellness',        type:'boolean',       chapter:'amenities', icon:'fa-spa',           layer_default:2, tags:['hospitality','wellness'] },
  { id:'gym',               label:'Fitness / Gym',         type:'boolean',       chapter:'amenities', icon:'fa-dumbbell',      layer_default:2, tags:['hospitality'] },
  { id:'rooftop',           label:'Rooftop Area',          type:'boolean',       chapter:'amenities', icon:'fa-layer-group',   layer_default:2, tags:['hospitality','dining'] },
  { id:'desert_view',       label:'Desert / Dune View',    type:'boolean',       chapter:'amenities', icon:'fa-mountain',      layer_default:2, tags:['hospitality'] },
  // CUISINE
  { id:'halal',             label:'Halal Certified',       type:'boolean',       chapter:'cuisine',   icon:'fa-check-circle',  layer_default:1, tags:['dining'] },
  { id:'vegetarian',        label:'Vegetarian Options',    type:'boolean',       chapter:'cuisine',   icon:'fa-seedling',      layer_default:1, tags:['dining'] },
  { id:'cuisine_type',      label:'Cuisine Type',          type:'multiselect',   chapter:'cuisine',   icon:'fa-globe',         layer_default:2, tags:['dining'],
    options:['Egyptian','Siwan Traditional','Mediterranean','International','BBQ','Seafood','Vegan','Fusion'] },
  { id:'seating_capacity',  label:'Seating Capacity',      type:'number',        chapter:'cuisine',   icon:'fa-chair',         layer_default:2, tags:['dining'] },
  { id:'delivery',          label:'Delivery Available',    type:'boolean',       chapter:'cuisine',   icon:'fa-motorcycle',    layer_default:2, tags:['dining'] },
  { id:'menu_url',          label:'Menu URL',              type:'url',           chapter:'cuisine',   icon:'fa-book-open',     layer_default:2, tags:['dining'] },
  { id:'breakfast_included',label:'Breakfast Included',    type:'boolean',       chapter:'cuisine',   icon:'fa-mug-hot',       layer_default:2, tags:['hospitality'] },
  // PROGRAMS
  { id:'booking_required',  label:'Booking Required',      type:'boolean',       chapter:'programs',  icon:'fa-calendar-check',layer_default:1, tags:['all'] },
  { id:'guide_available',   label:'Guide Available',       type:'boolean',       chapter:'programs',  icon:'fa-user-tie',      layer_default:1, tags:['tours','activities'] },
  { id:'group_size_min',    label:'Min Group Size',        type:'number',        chapter:'programs',  icon:'fa-users',         layer_default:2, tags:['tours','activities'] },
  { id:'group_size_max',    label:'Max Group Size',        type:'number',        chapter:'programs',  icon:'fa-users',         layer_default:2, tags:['tours','activities'] },
  { id:'duration',          label:'Duration',              type:'text',          chapter:'programs',  icon:'fa-hourglass',     layer_default:2, tags:['tours','activities'],
    display_hint:'e.g. 2 hours, Full day, 3 nights' },
  { id:'languages',         label:'Languages Offered',     type:'multiselect',   chapter:'programs',  icon:'fa-language',      layer_default:2, tags:['tours'],
    options:['Arabic','English','French','German','Italian','Spanish'] },
  // ECOLOGY
  { id:'solar_powered',     label:'Solar Powered',         type:'boolean',       chapter:'ecology',   icon:'fa-solar-panel',   layer_default:1, tags:['eco'] },
  { id:'eco_materials',     label:'Eco / Natural Materials',type:'boolean',      chapter:'ecology',   icon:'fa-leaf',          layer_default:1, tags:['eco'] },
  { id:'plastic_free',      label:'Plastic-Free Policy',   type:'boolean',       chapter:'ecology',   icon:'fa-recycle',       layer_default:1, tags:['eco'] },
  { id:'water_recycling',   label:'Water Recycling',       type:'boolean',       chapter:'ecology',   icon:'fa-water',         layer_default:2, tags:['eco'] },
  { id:'eco_certification', label:'Eco Certification',     type:'text',          chapter:'ecology',   icon:'fa-certificate',   layer_default:2, tags:['eco'],
    display_hint:'e.g. Green Key, EarthCheck, local eco body' },
  // INVEST
  { id:'price_per_night',   label:'Price Per Night (EGP)', type:'number',        chapter:'invest',    icon:'fa-moon',          layer_default:1, tags:['hospitality'] },
  { id:'price_range',       label:'Price Range',           type:'select',        chapter:'invest',    icon:'fa-tag',           layer_default:1, tags:['all'],
    options:['Budget (< 500 EGP)','Mid-Range (500–2000 EGP)','Upscale (2000–5000 EGP)','Luxury (5000+ EGP)'] },
  { id:'min_investment',    label:'Min Investment (EGP)',  type:'number',        chapter:'invest',    icon:'fa-chart-line',    layer_default:2, tags:['invest'] },
  { id:'roi_estimate',      label:'ROI Estimate (%)',      type:'number',        chapter:'invest',    icon:'fa-percentage',    layer_default:2, tags:['invest'] },
  { id:'payment_methods',   label:'Payment Methods',       type:'multiselect',   chapter:'invest',    icon:'fa-credit-card',   layer_default:2, tags:['all'],
    options:['Cash','Bank Transfer','Credit Card','Instapay','Vodafone Cash'] },
  // OFFERS
  { id:'discount_pct',      label:'Discount (%)',          type:'number',        chapter:'offers',    icon:'fa-tag',           layer_default:1, tags:['all'] },
  { id:'offer_expires',     label:'Offer Expires',         type:'text',          chapter:'offers',    icon:'fa-calendar-times',layer_default:1, tags:['all'],
    display_hint:'e.g. 31 Dec 2025 or Ramadan Season' },
  { id:'promo_code',        label:'Promo Code',            type:'text',          chapter:'offers',    icon:'fa-barcode',       layer_default:2, tags:['all'] },
  { id:'early_bird',        label:'Early Bird Discount',   type:'boolean',       chapter:'offers',    icon:'fa-clock',         layer_default:2, tags:['all'] },
];

async function seedAtoms() {
  info('PHASE 1 — Seeding Atom Registry');
  let inserted = 0, skipped = 0;
  for (const atom of ATOMS) {
    try {
      await run(
        `INSERT IGNORE INTO blueprint_atoms
         (id, label, type, chapter, options_json, validation_json, display_hint, icon, layer_default, tags_json, sort_order, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          atom.id, atom.label, atom.type, atom.chapter,
          atom.options  ? JSON.stringify(atom.options)  : null,
          null,
          atom.display_hint || null,
          atom.icon || null,
          atom.layer_default ?? 1,
          atom.tags ? JSON.stringify(atom.tags) : null,
          ATOMS.indexOf(atom),
        ]
      );
      inserted++;
    } catch (e) {
      warn(`Atom '${atom.id}' skipped: ${e.message}`);
      skipped++;
    }
  }
  log(`${inserted} atoms seeded, ${skipped} already existed`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — CONFIGURE BLUEPRINTS PER BUSINESS TYPE
// ─────────────────────────────────────────────────────────────────────────────

// Default schema applied to ALL types as a baseline
const BASE_SCHEMA = {
  chapters: {
    identity:  { layer1: ['description','hours','website','email','social_links'], layer2: [] },
    vibe:      { layer1: ['atmosphere','target_audience'], layer2: ['experience_type'] },
    amenities: { layer1: ['ac','garden','pets_allowed','restaurant_onsite'], layer2: [] },
    cuisine:   { layer1: ['halal','vegetarian'], layer2: [] },
    programs:  { layer1: ['booking_required','guide_available'], layer2: [] },
    ecology:   { layer1: ['solar_powered','eco_materials','plastic_free'], layer2: [] },
    invest:    { layer1: ['price_range'], layer2: [] },
    offers:    { layer1: ['discount_pct','offer_expires'], layer2: ['promo_code'] },
  }
};

// Type-specific overrides (merged on top of base)
const TYPE_BLUEPRINTS = {
  // ── HOTELS / ACCOMMODATION ─────────────────────────────────────────────────
  hotel: {
    identity:  { l2: ['star_rating','rooms','check_in','check_out','architecture_style'] },
    amenities: { l2: ['private_pool','spa','gym','rooftop','desert_view'] },
    cuisine:   { l2: ['breakfast_included','cuisine_type','seating_capacity'] },
    invest:    { l1: ['price_per_night','price_range'], l2: ['payment_methods'] },
  },
  boutique_hotel: {
    identity:  { l2: ['star_rating','rooms','check_in','check_out','architecture_style'] },
    amenities: { l2: ['private_pool','spa','rooftop','desert_view'] },
    cuisine:   { l2: ['breakfast_included','cuisine_type'] },
    invest:    { l1: ['price_per_night','price_range'], l2: ['payment_methods'] },
  },
  eco_lodge: {
    identity:  { l2: ['architecture_style','check_in','check_out'] },
    amenities: { l2: ['desert_view','rooftop'] },
    ecology:   { l2: ['water_recycling','eco_certification'] },
    invest:    { l1: ['price_per_night','price_range'], l2: ['payment_methods'] },
  },
  desert_camp: {
    identity:  { l2: ['check_in','check_out'] },
    amenities: { l2: ['desert_view'] },
    programs:  { l2: ['group_size_min','group_size_max','duration','languages'] },
    invest:    { l1: ['price_per_night','price_range'], l2: ['payment_methods'] },
  },
  // ── DINING ────────────────────────────────────────────────────────────────
  restaurant: {
    amenities: { l2: ['rooftop'] },
    cuisine:   { l1: ['halal','vegetarian'], l2: ['cuisine_type','seating_capacity','delivery','menu_url'] },
    invest:    { l1: ['price_range'], l2: ['payment_methods'] },
  },
  cafe: {
    cuisine:   { l2: ['cuisine_type','delivery','menu_url'] },
    invest:    { l1: ['price_range'], l2: ['payment_methods'] },
  },
  // ── TOURS & ACTIVITIES ────────────────────────────────────────────────────
  guide: {
    programs:  { l2: ['group_size_min','group_size_max','duration','languages'] },
    invest:    { l1: ['price_range'], l2: ['payment_methods'] },
  },
  tour_operator: {
    programs:  { l2: ['group_size_min','group_size_max','duration','languages'] },
    invest:    { l1: ['price_range'], l2: ['payment_methods','min_investment'] },
  },
  activity: {
    programs:  { l2: ['group_size_min','group_size_max','duration','languages'] },
    invest:    { l1: ['price_range'], l2: ['payment_methods'] },
  },
  // ── WELLNESS ──────────────────────────────────────────────────────────────
  spa: {
    amenities: { l2: ['private_pool','rooftop'] },
    programs:  { l2: ['duration'] },
    invest:    { l1: ['price_range'], l2: ['payment_methods'] },
  },
};

function buildSchema(typeId) {
  const schema = JSON.parse(JSON.stringify(BASE_SCHEMA)); // deep clone base
  const overrides = TYPE_BLUEPRINTS[typeId] || {};

  for (const [ch, over] of Object.entries(overrides)) {
    if (!schema.chapters[ch]) schema.chapters[ch] = { layer1: [], layer2: [] };
    if (over.l1) schema.chapters[ch].layer1 = [...new Set([...schema.chapters[ch].layer1, ...over.l1])];
    if (over.l2) schema.chapters[ch].layer2 = [...new Set([...schema.chapters[ch].layer2, ...over.l2])];
  }
  return schema;
}

async function configureBlueprints() {
  info('PHASE 2 — Configuring Blueprints Per Business Type');

  const types = await q('SELECT id, name FROM business_types ORDER BY name');
  log(`Found ${types.length} business types`);

  let configured = 0, skipped = 0;

  for (const type of types) {
    // Check if already has a blueprint_schema set
    const [row] = await q('SELECT blueprint_schema FROM business_types WHERE id = ?', [type.id]);
    if (row.blueprint_schema) {
      warn(`${type.name} (${type.id}) — already has blueprint, skipping`);
      skipped++;
      continue;
    }

    const schema = buildSchema(type.id);
    await run(
      'UPDATE business_types SET blueprint_schema = ? WHERE id = ?',
      [JSON.stringify(schema), type.id]
    );
    log(`${type.name} (${type.id}) → blueprint configured`);
    configured++;
  }

  log(`\n  ${configured} types configured, ${skipped} skipped (already had blueprints)`);
  return types;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  SIWA OASIS — Blueprint Engine Admin Setup');
  console.log('═'.repeat(60));

  try {
    await runMigration();
    await seedAtoms();
    const types = await configureBlueprints();

    // Summary
    info('COMPLETE — Summary');
    const atomCount = await q('SELECT COUNT(*) as n FROM blueprint_atoms WHERE active = 1');
    const schemaCount = await q('SELECT COUNT(*) as n FROM business_types WHERE blueprint_schema IS NOT NULL');
    console.log(`
  ⚛️  Active Atoms:        ${atomCount[0].n}
  🏛️  Types Configured:    ${schemaCount[0].n} / ${types.length}
  📦  Tables:              blueprint_atoms, business_media, business_posts
  ✅  All done — Blueprint Engine is ready!
    `);
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
