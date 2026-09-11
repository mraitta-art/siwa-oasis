import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { CANONICAL_SECTION_IDS, normalizeSectionIds } from '@/lib/section-registry';

const LEGACY_KEYS: Record<string, string> = {
  basic: 'sec_1_identity',
  vibe: 'sec_2_ambience',
  experience: 'sec_5_experiences',
  location: 'sec_8_connector',
  gallery: 'sec_1_identity',
  offers: 'sec_8_connector',
  testimonials: 'sec_10_testimonials_faqs',
  sec_3_services: 'sec_5_experiences',
  sec_4_facilities: 'sec_3_facilities',
  sec_5_connectivity: 'sec_8_connector',
  sec_6_geographic: 'sec_8_connector',
  sec_8_rates_offers: 'sec_8_connector',
};

function parseObject(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, any>;
  try { return JSON.parse(String(value)); } catch { return {}; }
}

function migrateCustomData(value: unknown) {
  const source = parseObject(value);
  const result: Record<string, any> = {};
  for (const [key, data] of Object.entries(source)) {
    const target = LEGACY_KEYS[key] || key;
    if (!CANONICAL_SECTION_IDS.includes(target as any) && !key.startsWith('_')) continue;
    if (target.startsWith('sec_') && result[target] && typeof result[target] === 'object' && typeof data === 'object') {
      result[target] = { ...result[target], ...(data as object) };
    } else {
      result[target] = data;
    }
  }
  return result;
}

/** One-time destructive consolidation of all section systems into the 10-section registry. */
export async function POST() {
  await requireAdmin();

  type DbBusinessRow = { id: string; custom_data?: unknown };
  type DbTypeRow = { id: string; is_parent?: boolean | number | string; sections?: unknown; own_sections?: unknown };
  type DbTierRow = { id: string; features?: unknown };
  type DbSectionRow = { id: string };

  const oldSectionRows = await query<DbSectionRow>('SELECT id FROM sections WHERE id NOT IN (?)', [CANONICAL_SECTION_IDS]);
  const businesses = await query<DbBusinessRow>('SELECT id, custom_data FROM businesses');
  for (const business of businesses) {
    const migrated = migrateCustomData(business.custom_data);
    await execute('UPDATE businesses SET custom_data = ? WHERE id = ?', [JSON.stringify(migrated), business.id]);
  }

  await execute('DELETE FROM form_fields WHERE section_id NOT IN (?)', [CANONICAL_SECTION_IDS]);
  await execute('DELETE FROM sections WHERE id NOT IN (?)', [CANONICAL_SECTION_IDS]);

  const types = await query<DbTypeRow>('SELECT id, is_parent, sections, own_sections FROM business_types');
  for (const type of types) {
    const sections = type.is_parent || Number(type.is_parent) === 1
      ? CANONICAL_SECTION_IDS
      : normalizeSectionIds(type.sections);
    await execute('UPDATE business_types SET sections = ?, own_sections = ? WHERE id = ?', [
      JSON.stringify(sections), JSON.stringify(normalizeSectionIds(type.own_sections)), type.id
    ]);
  }

  const tiers = await query<DbTierRow>('SELECT id, features FROM subscription_tiers');
  for (const tier of tiers) {
    const features = parseObject(tier.features);
    delete features.allowedSections;
    delete features.allowed_public_sections;
    await execute('UPDATE subscription_tiers SET features = ? WHERE id = ?', [JSON.stringify(features), tier.id]);
  }

  return NextResponse.json({
    success: true,
    canonical_sections: CANONICAL_SECTION_IDS,
    removed_sections: oldSectionRows.map(row => row.id),
    migrated_businesses: businesses.length,
  });
}
