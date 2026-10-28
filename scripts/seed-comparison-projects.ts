/**
 * Seed a handful of comparison-ready projects so the profile, calculator and
 * side-by-side view have something real-shaped to render end to end.
 *
 * These are DEMONSTRATION rows for an admin to overwrite, not live quotes: the
 * prices and payment plans are plausible but invented, exactly like the existing
 * demo businesses. Never ship them as truth — an admin replaces the figures and
 * stamps `data_verified_at` when they actually check a developer.
 *
 * Market-agnostic on purpose: it seeds into whichever market slug already exists.
 * A project whose market is missing is skipped, so this is safe to run anywhere.
 *
 * Idempotent: keyed on slug, an existing project is updated rather than doubled.
 *
 * Dry run by default. Apply with:  npx tsx scripts/seed-comparison-projects.ts --apply
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import crypto from 'crypto';
import { query, queryOne, execute } from '../src/lib/db';

const APPLY = process.argv.includes('--apply');

interface SeedPlan {
  name: string;
  down_payment_pct: number;
  installment_years: number;
  frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  post_handover: boolean;
}
interface SeedUnit {
  title: string;
  title_ar: string;
  unit_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
  price: number;
  down_payment_pct: number;
  installment_years: number;
}
interface SeedProject {
  market: string;
  slug: string;
  name_en: string;
  name_ar: string;
  developer_name: string;
  delivery_year: number;
  status: 'announced' | 'under_construction' | 'delivered' | 'sold_out';
  data_verified_at: string;
  facilities: string[];
  payment_plans: SeedPlan[];
  units: SeedUnit[];
}

// Two Mediterranean investment projects and one eco project, spanning price per
// m², term length and facilities so the comparison has something to rank.
const PROJECTS: SeedProject[] = [
  {
    market: 'el-alamein',
    slug: 'seed-alamen-bay-residences',
    name_en: 'Alamen Bay Residences',
    name_ar: 'إقامات العلمين باي',
    developer_name: 'Seed Developer Co.',
    delivery_year: 2028,
    status: 'under_construction',
    data_verified_at: '2026-10-01 00:00:00',
    facilities: ['Private beach access', 'Infinity pool', 'Clubhouse & gym', '24/7 security', 'Landscaped gardens'],
    payment_plans: [
      { name: 'Standard', down_payment_pct: 25, installment_years: 5, frequency: 'quarterly', post_handover: false },
      { name: 'Long stay', down_payment_pct: 15, installment_years: 8, frequency: 'quarterly', post_handover: true },
    ],
    units: [
      { title: 'Garden Villa', title_ar: 'فيلا بحديقة', unit_type: 'villa', bedrooms: 4, bathrooms: 3, area_sqm: 260, price: 6200000, down_payment_pct: 25, installment_years: 5 },
      { title: 'Sea-View Chalet', title_ar: 'شاليه بإطلالة بحرية', unit_type: 'chalet', bedrooms: 2, bathrooms: 2, area_sqm: 120, price: 3100000, down_payment_pct: 15, installment_years: 8 },
    ],
  },
  {
    market: 'el-alamein',
    slug: 'seed-marina-heights',
    name_en: 'Marina Heights',
    name_ar: 'مارينا هايتس',
    developer_name: 'Seed Developer Co.',
    delivery_year: 2027,
    status: 'announced',
    data_verified_at: '2026-10-15 00:00:00',
    facilities: ['Marina promenade', 'Rooftop pool', 'Retail arcade', 'Smart access'],
    payment_plans: [
      { name: 'Quick own', down_payment_pct: 30, installment_years: 3, frequency: 'monthly', post_handover: false },
      { name: 'Balance', down_payment_pct: 20, installment_years: 6, frequency: 'quarterly', post_handover: false },
    ],
    units: [
      { title: 'One-Bed Apartment', title_ar: 'شقة غرفة نوم', unit_type: 'apartment', bedrooms: 1, bathrooms: 1, area_sqm: 85, price: 1850000, down_payment_pct: 30, installment_years: 3 },
      { title: 'Penthouse', title_ar: 'بنتهاوس', unit_type: 'penthouse', bedrooms: 3, bathrooms: 3, area_sqm: 210, price: 5400000, down_payment_pct: 20, installment_years: 6 },
    ],
  },
  {
    market: 'siwa',
    slug: 'seed-oasis-eco-courts',
    name_en: 'Oasis Eco Courts',
    name_ar: 'فناءات الواحة البيئية',
    developer_name: 'Seed Oasis Group',
    delivery_year: 2026,
    status: 'delivered',
    data_verified_at: '2026-09-20 00:00:00',
    facilities: ['Salt-lake view', 'Solar-powered', 'Palm-shade courtyards', 'Wellness spring'],
    payment_plans: [
      { name: 'Owner plan', down_payment_pct: 40, installment_years: 4, frequency: 'annual', post_handover: false },
    ],
    units: [
      { title: 'Mud-Brick Court House', title_ar: 'بيت فناء', unit_type: 'house', bedrooms: 3, bathrooms: 2, area_sqm: 180, price: 2200000, down_payment_pct: 40, installment_years: 4 },
    ],
  },
];

async function marketExists(slug: string): Promise<boolean> {
  const row = (await queryOne('SELECT slug FROM markets WHERE slug = ? LIMIT 1', [slug])) as any;
  return Boolean(row);
}

async function seedProject(project: SeedProject): Promise<void> {
  if (!(await marketExists(project.market))) {
    console.log(`  skip ${project.slug} — market '${project.market}' not present`);
    return;
  }

  const facilitiesJson = JSON.stringify(project.facilities);
  const plansJson = JSON.stringify(
    project.payment_plans.map((p) => ({
      name: p.name,
      down_payment_pct: p.down_payment_pct,
      installment_years: p.installment_years,
      frequency: p.frequency,
      post_handover: p.post_handover ? 1 : 0,
    }))
  );

  const existing = (await queryOne('SELECT id FROM developments WHERE slug = ? LIMIT 1', [project.slug])) as any;

  if (existing) {
    console.log(`  update project ${project.slug}`);
    if (APPLY) {
      await execute(
        `UPDATE developments
            SET name_en = ?, name_ar = ?, developer_name = ?, delivery_year = ?, status = ?,
                facilities = ?, payment_plans = ?, data_verified_at = ?, active = 1
          WHERE slug = ?`,
        [
          project.name_en,
          project.name_ar,
          project.developer_name,
          project.delivery_year,
          project.status,
          facilitiesJson,
          plansJson,
          project.data_verified_at,
          project.slug,
        ]
      );
    }
  } else {
    console.log(`  insert project ${project.slug}`);
    if (APPLY) {
      await execute(
        `INSERT INTO developments (id, market_id, slug, name_ar, name_en, kind, developer_name,
                                   delivery_year, status, active, facilities, payment_plans, data_verified_at)
         VALUES (?, ?, ?, ?, ?, 'compound', ?, ?, ?, 1, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          project.market,
          project.slug,
          project.name_ar,
          project.name_en,
          project.developer_name,
          project.delivery_year,
          project.status,
          facilitiesJson,
          plansJson,
          project.data_verified_at,
        ]
      );
    }
  }

  // Resolve the development id the units attach to. On a dry run a brand-new
  // project was never inserted, so there is no id yet — leave it null and the
  // unit loop reports what it *would* write without touching the database.
  let developmentId: string | null = existing ? String(existing.id) : null;
  if (!developmentId && APPLY) {
    const dev = (await queryOne('SELECT id FROM developments WHERE slug = ? LIMIT 1', [project.slug])) as any;
    developmentId = dev ? String(dev.id) : null;
  }

  for (const unit of project.units) {
    const unitSlug = `${project.slug}-${unit.unit_type}-${unit.bedrooms}br`.toLowerCase();
    const hasUnit = (await queryOne('SELECT id FROM units WHERE slug = ? LIMIT 1', [unitSlug])) as any;
    console.log(`  ${hasUnit ? 'update' : 'insert'} unit ${unitSlug}`);
    if (!APPLY) continue;
    if (!developmentId) {
      console.log(`    (skipped: project was not created, so the unit has no container to attach to)`);
      continue;
    }

    const pricePerSqm = Math.round(unit.price / unit.area_sqm);
    if (hasUnit) {
      await execute(
        `UPDATE units SET title_ar = ?, title_en = ?, unit_type = ?, listing_kind = 'sale',
                 bedrooms = ?, bathrooms = ?, area_sqm = ?, price = ?, price_per_sqm = ?,
                 down_payment_pct = ?, installment_years = ?, delivery_year = ?, status = 'available', active = 1
           WHERE slug = ?`,
        [
          unit.title_ar,
          unit.title,
          unit.unit_type,
          unit.bedrooms,
          unit.bathrooms,
          unit.area_sqm,
          unit.price,
          pricePerSqm,
          unit.down_payment_pct,
          unit.installment_years,
          project.delivery_year,
          unitSlug,
        ]
      );
    } else {
      await execute(
        `INSERT INTO units (id, market_id, development_id, slug, title_ar, title_en, unit_type,
                            listing_kind, bedrooms, bathrooms, area_sqm, price, currency, price_per_sqm,
                            down_payment_pct, installment_years, delivery_year, status, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'sale', ?, ?, ?, ?, 'EGP', ?, ?, ?, ?, 'available', 1)`,
        [
          crypto.randomUUID(),
          project.market,
          developmentId,
          unitSlug,
          unit.title_ar,
          unit.title,
          unit.unit_type,
          unit.bedrooms,
          unit.bathrooms,
          unit.area_sqm,
          unit.price,
          pricePerSqm,
          unit.down_payment_pct,
          unit.installment_years,
          project.delivery_year,
        ]
      );
    }
  }
}

async function main() {
  console.log(APPLY ? 'Seeding comparison projects (APPLY)...' : 'Dry run — pass --apply to write.');
  for (const project of PROJECTS) {
    await seedProject(project);
  }
  console.log(APPLY ? '\nDone.' : '\nNothing written. Re-run with --apply.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
