/**
 * patch_property_specs.js
 *
 * Registers `property_specs` as a proper Jana Minisite component type:
 *  1. minisite-governance-client.ts  → adds to MinisiteComponentType union + DEFAULT_TIER_RULES + COMPONENT_META
 *  2. MinisiteBuilderRenderer.tsx    → adds case 'property_specs' that calls renderAssetSpecsSection()
 *                                      removes the old auto-inject after vendor_hero
 *  3. website_configs (DB)           → updates the 4 seeded showcase layouts to include property_specs
 */

const fs   = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const ROOT = path.resolve(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Patch minisite-governance-client.ts
// ─────────────────────────────────────────────────────────────────────────────
function patchGovernanceClient() {
  const filePath = path.join(ROOT, 'src/lib/minisite-governance-client.ts');
  let src = fs.readFileSync(filePath, 'utf8');

  // 1a. Add 'property_specs' to the MinisiteComponentType union
  const unionTarget = "  | 'auctions_feed';";
  if (src.includes("| 'property_specs'")) {
    console.log('[governance] property_specs already in union — skipping union patch');
  } else if (!src.includes(unionTarget)) {
    console.error('[governance] ❌ Cannot find union anchor:', unionTarget);
    process.exit(1);
  } else {
    src = src.replace(
      unionTarget,
      `  | 'auctions_feed'\n  | 'property_specs';`
    );
    console.log('[governance] ✅ Added property_specs to MinisiteComponentType union');
  }

  // 1b. Add 'property_specs' to all four tier rule arrays
  const tiers = ['free', 'standard', 'premium', 'admin'];
  for (const tier of tiers) {
    // Find the closing ] of each tier array and insert before it
    // Pattern: look for 'testimonials', inside the tier block
    const anchor = `'testimonials',\n  ],`;
    if (!src.includes(anchor) && tier === 'free') {
      // Try alternate format
      console.warn('[governance] ⚠️  Tier rule anchor not found, attempting alternate format');
    }
  }

  // Simpler approach: add property_specs after 'auctions_feed' in admin tier,
  // and after 'testimonials' in all tiers
  const freeAnchor    = `    'testimonials',\n  ],\n  standard:`;
  const standardAnchor = `    'testimonials',\n  ],\n  premium:`;
  const premiumAnchor  = `    'testimonials',\n  ],\n  admin:`;
  const adminAnchor    = `    'auctions_feed',\n  ],\n};`;

  if (!src.includes("'property_specs'")) {
    // For free, standard, premium tiers: add after 'testimonials'
    for (const [old, next] of [
      [freeAnchor,    `    'testimonials',\n    'property_specs',\n  ],\n  standard:`],
      [standardAnchor, `    'testimonials',\n    'property_specs',\n  ],\n  premium:`],
      [premiumAnchor,  `    'testimonials',\n    'property_specs',\n  ],\n  admin:`],
      [adminAnchor,    `    'auctions_feed',\n    'property_specs',\n  ],\n};`],
    ]) {
      if (src.includes(old)) {
        src = src.replace(old, next);
        console.log(`[governance] ✅ Added property_specs to tier containing: ...${old.trim().substring(0,40)}...`);
      } else {
        console.warn(`[governance] ⚠️  Could not find tier anchor: ${old.trim().substring(0,60)}`);
      }
    }
  } else {
    console.log('[governance] property_specs already in tier rules — skipping');
  }

  // 1c. Add COMPONENT_META entry for property_specs (before the closing }; of COMPONENT_META)
  const metaAnchor = `  auctions_feed: {
    label: 'Commercial Deals & Auction',
    icon: 'fa-gavel',
    description: 'Platform commercial auction feeds or exclusive bids.',
    vendorScoped: false,
    tier: 'admin',
    mainSitePages: ['/investment-opportunities', '/offers'],
    canonicalSections: ['sec_7_investment'],
  },
};`;

  const metaReplacement = `  auctions_feed: {
    label: 'Commercial Deals & Auction',
    icon: 'fa-gavel',
    description: 'Platform commercial auction feeds or exclusive bids.',
    vendorScoped: false,
    tier: 'admin',
    mainSitePages: ['/investment-opportunities', '/offers'],
    canonicalSections: ['sec_7_investment'],
  },
  property_specs: {
    label: 'Property Specs & Pricing Card',
    icon: 'fa-ruler-combined',
    description: 'Real estate unit specifications: price, payment plan, area, bedrooms, finishing, and amenity badges. Auto-reads from business custom_data.specs.',
    vendorScoped: true,
    tier: 'free',
    mainSitePages: ['/'],
    canonicalSections: ['sec_7_investment', 'sec_1_identity'],
  },
};`;

  if (src.includes("property_specs: {")) {
    console.log('[governance] property_specs COMPONENT_META already present — skipping meta patch');
  } else if (src.includes(metaAnchor)) {
    src = src.replace(metaAnchor, metaReplacement);
    console.log('[governance] ✅ Added property_specs COMPONENT_META entry');
  } else {
    console.error('[governance] ❌ Cannot find COMPONENT_META closing anchor. Dumping search...');
    const idx = src.indexOf('auctions_feed:');
    console.log(src.substring(idx, idx + 300));
    process.exit(1);
  }

  fs.writeFileSync(filePath, src, 'utf8');
  console.log('[governance] ✅ File saved:', filePath);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Patch MinisiteBuilderRenderer.tsx
// ─────────────────────────────────────────────────────────────────────────────
function patchRenderer() {
  const filePath = path.join(ROOT, 'src/components/MinisiteBuilderRenderer.tsx');
  let src = fs.readFileSync(filePath, 'utf8');

  // 2a. Add case 'property_specs' before the default: case
  const defaultAnchor = `      default:\n        return null;\n    }\n  };`;
  const propertySpecsCase = `      // ──────────────────────────────────────────────
      // PROPERTY SPECS CARD (Real Estate Unit Details)
      // ──────────────────────────────────────────────
      case 'property_specs': {
        return renderAssetSpecsSection();
      }

      default:\n        return null;\n    }\n  };`;

  if (src.includes("case 'property_specs'")) {
    console.log('[renderer] property_specs case already exists — skipping case patch');
  } else if (src.includes(defaultAnchor)) {
    src = src.replace(defaultAnchor, propertySpecsCase);
    console.log('[renderer] ✅ Added case property_specs to renderComponent switch');
  } else {
    // Try CRLF variant
    const defaultAnchorCRLF = `      default:\r\n        return null;\r\n    }\r\n  };`;
    if (src.includes(defaultAnchorCRLF)) {
      const propertySpecsCaseCRLF = `      // ──────────────────────────────────────────────\r\n      // PROPERTY SPECS CARD (Real Estate Unit Details)\r\n      // ──────────────────────────────────────────────\r\n      case 'property_specs': {\r\n        return renderAssetSpecsSection();\r\n      }\r\n\r\n      default:\r\n        return null;\r\n    }\r\n  };`;
      src = src.replace(defaultAnchorCRLF, propertySpecsCaseCRLF);
      console.log('[renderer] ✅ Added case property_specs (CRLF variant)');
    } else {
      console.error('[renderer] ❌ Cannot find default: case anchor');
      process.exit(1);
    }
  }

  // 2b. Remove the old auto-inject after vendor_hero
  // Target: {comp.type === 'vendor_hero' && hasSpecs && renderAssetSpecsSection()}
  const autoInjectLF   = `              {renderComponent(comp)}\n              {comp.type === 'vendor_hero' && hasSpecs && renderAssetSpecsSection()}\n            </React.Fragment>`;
  const autoInjectCRLF = `              {renderComponent(comp)}\r\n              {comp.type === 'vendor_hero' && hasSpecs && renderAssetSpecsSection()}\r\n            </React.Fragment>`;
  const cleanRender    = `              {renderComponent(comp)}\n            </React.Fragment>`;
  const cleanRenderCRLF = `              {renderComponent(comp)}\r\n            </React.Fragment>`;

  if (src.includes(autoInjectLF)) {
    src = src.replace(autoInjectLF, cleanRender);
    console.log('[renderer] ✅ Removed auto-inject after vendor_hero (LF)');
  } else if (src.includes(autoInjectCRLF)) {
    src = src.replace(autoInjectCRLF, cleanRenderCRLF);
    console.log('[renderer] ✅ Removed auto-inject after vendor_hero (CRLF)');
  } else {
    // It may already be removed, check
    if (!src.includes('renderAssetSpecsSection()}\n            </React.Fragment>') &&
        !src.includes("comp.type === 'vendor_hero' && hasSpecs")) {
      console.log('[renderer] auto-inject already removed — skipping');
    } else {
      console.warn('[renderer] ⚠️  Could not find auto-inject anchor to remove — may need manual check');
    }
  }

  fs.writeFileSync(filePath, src, 'utf8');
  console.log('[renderer] ✅ File saved:', filePath);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Update website_configs to include property_specs component in layouts
// ─────────────────────────────────────────────────────────────────────────────
async function updateLayouts() {
  const mysql = require('mysql2/promise');
  const conn = await mysql.createConnection({
    host:     process.env.TIDB_HOST     || process.env.DB_HOST,
    port:     parseInt(process.env.TIDB_PORT || process.env.DB_PORT || '4000'),
    user:     process.env.TIDB_USER     || process.env.DB_USER,
    password: process.env.TIDB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TIDB_DB       || process.env.DB_NAME,
    ssl:      { rejectUnauthorized: false },
  });

  const SLUGS = [
    'marassi-zaha-chalet',
    'hacienda-bay-water-villa',
    'lvls-ras-el-hekma-beach-house',
    'swan-lake-lagoon-townhouse',
  ];

  for (const slug of SLUGS) {
    const key = `minisite_layout_${slug}`;
    const [rows] = await conn.query(
      'SELECT id, config FROM website_configs WHERE type = ? LIMIT 1',
      [key]
    );
    if (rows.length === 0) {
      console.warn(`[db] ⚠️  No layout found for ${slug}`);
      continue;
    }

    const row    = rows[0];
    const layout = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;

    // Check if property_specs already in components
    const alreadyHasSpecs = layout.components?.some(c => c.type === 'property_specs');
    if (alreadyHasSpecs) {
      console.log(`[db] property_specs already in layout for ${slug} — skipping`);
      continue;
    }

    // Insert property_specs after vendor_hero (order 0 → becomes order 1, push others down)
    const heroIdx = layout.components.findIndex(c => c.type === 'vendor_hero');
    const insertAt = heroIdx >= 0 ? heroIdx + 1 : 1;

    const specsComponent = {
      id:    `property_specs_${slug}`,
      type:  'property_specs',
      order: insertAt,
      props: {
        show_payment_plan: true,
        show_amenities:    true,
        show_gallery_hint: true,
      },
    };

    layout.components.splice(insertAt, 0, specsComponent);

    // Re-number orders sequentially
    layout.components = layout.components.map((c, i) => ({ ...c, order: i }));
    layout.updated_at = new Date().toISOString();
    layout.updated_by = 'admin_patch_property_specs';

    await conn.query(
      'UPDATE website_configs SET config = ? WHERE type = ?',
      [JSON.stringify(layout), key]
    );

    console.log(`[db] ✅ Updated layout for ${slug} — inserted property_specs at position ${insertAt}`);
    console.log(`      Components: ${layout.components.map(c => c.type).join(' → ')}`);
  }

  await conn.end();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n=== Step 1: Patch minisite-governance-client.ts ===');
  patchGovernanceClient();

  console.log('\n=== Step 2: Patch MinisiteBuilderRenderer.tsx ===');
  patchRenderer();

  console.log('\n=== Step 3: Update website_configs layouts in DB ===');
  await updateLayouts();

  console.log('\n🎉 All done! The property_specs component is now a proper Jana component.');
  console.log('   Verify in Jana builder: http://127.0.0.1:3005/jana/minisite-builder?slug=marassi-zaha-chalet');
  console.log('   Verify public minisite:  http://127.0.0.1:3005/marassi-zaha-chalet');
})();
