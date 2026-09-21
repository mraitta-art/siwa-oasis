import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

/**
 * POST /api/setup/seed-page-layouts
 * Seeds the website_configs table with sensible default builder layouts
 * for every public page — only if that page has NO existing config.
 * Safe to call multiple times (idempotent via INSERT IGNORE).
 */

interface ComponentDef {
  id: string;
  type: string;
  props?: Record<string, unknown>;
}

interface PageSeed {
  id: string; // e.g. "website_accommodations"
  label: string;
  header_components: ComponentDef[];
  body_components: ComponentDef[];
  footer_components: ComponentDef[];
}

function makeSection(id: string, type: string, props: Record<string, unknown> = {}): ComponentDef {
  return { id, type, props };
}

// ── Default layouts for every public page ──────────────────────────────────
const PAGE_SEEDS: PageSeed[] = [
  // ── Category pages ─────────────────────────────────────────────────────
  {
    id: 'website_accommodations',
    label: 'Accommodations',
    header_components: [],
    body_components: [
      makeSection('acc_carousel',     'hero_carousel',           { carousel_id: 'accommodations_hero' }),
      makeSection('acc_hero',         'category_hero',           { category: 'accommodation', label: 'Accommodation', title: 'Find the perfect place to stay in Siwa', accent: '#92400e', description: 'Search eco-lodges, boutique hotels, heritage stays, camps, and desert retreats.' }),
      makeSection('acc_search',       'search_bar',              { defaultCategory: 'accommodation' }),
      makeSection('acc_deals',        'category_commercial_tabs',{ category: 'accommodation' }),
      makeSection('acc_directory',    'services_hub',            { title: 'Accommodation Directory', subtitle: 'Verified stays across Siwa Oasis' }),
      makeSection('acc_story',        'storytelling_section',    { title: 'Authentic Stays in Siwa', subtitle: 'Discover the heritage and serenity of the oasis.' }),
      makeSection('acc_partner',      'partner_cta',             { title: 'Are you an accommodation provider in Siwa?', subtitle: 'List your business and receive direct bookings.' }),
    ],
    footer_components: [],
  },
  {
    id: 'website_activities',
    label: 'Activities',
    header_components: [],
    body_components: [
      makeSection('act_carousel',     'hero_carousel',           { carousel_id: 'activities_hero' }),
      makeSection('act_hero',         'category_hero',           { category: 'activity', label: 'Activities', title: 'Explore adventures in the Siwa Oasis', accent: '#166534', description: 'Desert safaris, sandboarding, swimming in Cleopatra\'s spring, and cultural tours.' }),
      makeSection('act_search',       'search_bar',              { defaultCategory: 'activity' }),
      makeSection('act_deals',        'category_commercial_tabs',{ category: 'activity' }),
      makeSection('act_directory',    'services_hub',            { title: 'Activities Directory', subtitle: 'Verified activity operators across Siwa Oasis' }),
      makeSection('act_story',        'storytelling_section',    { title: 'Adventures in Siwa', subtitle: 'Experience the desert, the salt lakes, and ancient Berber culture.' }),
      makeSection('act_partner',      'partner_cta',             { title: 'Are you an activity provider in Siwa?', subtitle: 'Join our ecosystem to reach more travellers.' }),
    ],
    footer_components: [],
  },
  {
    id: 'website_restaurants',
    label: 'Restaurants',
    header_components: [],
    body_components: [
      makeSection('res_carousel',     'hero_carousel',           { carousel_id: 'restaurants_hero' }),
      makeSection('res_hero',         'category_hero',           { category: 'restaurant', label: 'Restaurants', title: 'Discover the flavours of Siwa', accent: '#7f1d1d', description: 'Siwan cuisine, Egyptian classics, fresh juice bars, and desert dining experiences.' }),
      makeSection('res_search',       'search_bar',              { defaultCategory: 'restaurant' }),
      makeSection('res_deals',        'category_commercial_tabs',{ category: 'restaurant' }),
      makeSection('res_directory',    'services_hub',            { title: 'Restaurant Directory', subtitle: 'Verified dining partners across Siwa Oasis' }),
      makeSection('res_partner',      'partner_cta',             { title: 'Are you a restaurant owner in Siwa?', subtitle: 'List your venue and attract more guests.' }),
    ],
    footer_components: [],
  },
  {
    id: 'website_food-beverage',
    label: 'Food & Beverage',
    header_components: [],
    body_components: [
      makeSection('fnb_carousel',     'hero_carousel',           { carousel_id: 'food-beverage_hero' }),
      makeSection('fnb_hero',         'category_hero',           { category: 'food', label: 'Food & Beverage', title: 'Taste the Siwa Oasis', accent: '#9a3412', description: 'Restaurants, cafes, juice bars, traditional kitchens, and catering services.' }),
      makeSection('fnb_search',       'search_bar',              { defaultCategory: 'food' }),
      makeSection('fnb_deals',        'category_commercial_tabs',{ category: 'food' }),
      makeSection('fnb_directory',    'services_hub',            { title: 'Food & Beverage Directory', subtitle: 'Verified food businesses across Siwa Oasis' }),
      makeSection('fnb_partner',      'partner_cta',             { title: 'Are you a food business in Siwa?', subtitle: 'Join our platform and grow your customer base.' }),
    ],
    footer_components: [],
  },
  {
    id: 'website_transportation',
    label: 'Transportation',
    header_components: [],
    body_components: [
      makeSection('trp_carousel',     'hero_carousel',           { carousel_id: 'transportation_hero' }),
      makeSection('trp_hero',         'category_hero',           { category: 'transportation', label: 'Transportation', title: 'Get around Siwa your way', accent: '#1e3a5f', description: 'Taxis, 4x4 jeeps, bicycle rentals, and private transfers.' }),
      makeSection('trp_search',       'search_bar',              { defaultCategory: 'transportation' }),
      makeSection('trp_deals',        'category_commercial_tabs',{ category: 'transportation' }),
      makeSection('trp_directory',    'services_hub',            { title: 'Transportation Directory', subtitle: 'Verified transport operators across Siwa Oasis' }),
      makeSection('trp_partner',      'partner_cta',             { title: 'Are you a transport operator in Siwa?', subtitle: 'List your vehicles and services on Siwify.' }),
    ],
    footer_components: [],
  },
  {
    id: 'website_crafts-wellness',
    label: 'Crafts & Wellness',
    header_components: [],
    body_components: [
      makeSection('cw_carousel',      'hero_carousel',           { carousel_id: 'crafts-wellness_hero' }),
      makeSection('cw_hero',          'category_hero',           { category: 'crafts-wellness', label: 'Crafts & Wellness', title: 'Siwan craft & wellness traditions', accent: '#4a1942', description: 'Berber jewellery, traditional weaving, salt flotation, and desert healing therapies.' }),
      makeSection('cw_search',        'search_bar',              { defaultCategory: 'crafts-wellness' }),
      makeSection('cw_deals',         'category_commercial_tabs',{ category: 'crafts-wellness' }),
      makeSection('cw_directory',     'services_hub',            { title: 'Crafts & Wellness Directory', subtitle: 'Verified artisans and wellness providers in Siwa' }),
      makeSection('cw_partner',       'partner_cta',             { title: 'Are you a craftsperson or wellness provider in Siwa?', subtitle: 'Join Siwify and reach global travellers.' }),
    ],
    footer_components: [],
  },
  // ── Standalone pages ───────────────────────────────────────────────────
  {
    id: 'website_journeys',
    label: 'Journeys',
    header_components: [],
    body_components: [
      makeSection('jrn_carousel',     'hero_carousel',           { carousel_id: 'journeys_hero' }),
      makeSection('jrn_hero',         'category_hero',           { category: 'journey', label: 'Journeys', title: 'Build your perfect Siwa expedition', accent: '#78350f', description: 'Day-by-day bespoke itineraries with expert Siwan guides, desert camps, and cultural workshops.' }),
      makeSection('jrn_search',       'search_bar',              { defaultCategory: 'journey' }),
      makeSection('jrn_directory',    'services_hub',            { title: 'Journey Operators', subtitle: 'Licensed expedition operators across Siwa Oasis' }),
      makeSection('jrn_partner',      'partner_cta',             { title: 'Are you a journey operator in Siwa?', subtitle: 'List your expeditions and receive direct bookings.' }),
    ],
    footer_components: [],
  },
  {
    id: 'website_services',
    label: 'Services',
    header_components: [],
    body_components: [
      makeSection('svc_carousel',     'hero_carousel',           { carousel_id: 'services_hero' }),
      makeSection('svc_hero',         'category_hero',           { category: 'service', label: 'Services', title: 'Siwa Oasis services', accent: '#064e3b', description: 'All categories of services available in Siwa — accommodation, food, activities, crafts, and more.' }),
      makeSection('svc_directory',    'services_hub',            { title: 'Services Directory', subtitle: 'All Siwa Oasis businesses in one place' }),
      makeSection('svc_partner',      'partner_cta',             { title: 'List your business on Siwify', subtitle: 'Reach thousands of travellers visiting Siwa Oasis.' }),
    ],
    footer_components: [],
  },
  {
    id: 'website_blog',
    label: 'Blog',
    header_components: [],
    body_components: [
      makeSection('blg_carousel',     'hero_carousel',           { carousel_id: 'blog_hero' }),
      makeSection('blg_hero',         'category_hero',           { category: 'blog', label: 'Blog', title: 'Stories from the Siwa Oasis', accent: '#1e3a5f', description: 'Cultural narratives, travel guides, and insider perspectives from the oasis.' }),
      makeSection('blg_posts',        'blog',                    { title: 'Latest Stories', subtitle: 'Insights and guides from Siwa Oasis' }),
    ],
    footer_components: [],
  },
  {
    id: 'website_offers',
    label: 'Offers',
    header_components: [],
    body_components: [
      makeSection('ofc_carousel',     'hero_carousel',           { carousel_id: 'offers_hero' }),
      makeSection('ofc_hero',         'category_hero',           { category: 'offer', label: 'Offers', title: 'Exclusive Siwa deals & packages', accent: '#78350f', description: 'Special offers, packages, and exclusive discounts from businesses across Siwa Oasis.' }),
      makeSection('ofc_directory',    'services_hub',            { title: 'Offers Directory', subtitle: 'Live deals from verified Siwa businesses' }),
    ],
    footer_components: [],
  },
  {
    id: 'website_packages',
    label: 'Packages',
    header_components: [],
    body_components: [
      makeSection('pkg_carousel',     'hero_carousel',           { carousel_id: 'packages_hero' }),
      makeSection('pkg_hero',         'category_hero',           { category: 'package', label: 'Packages', title: 'Curated Siwa travel packages', accent: '#78350f', description: 'All-inclusive travel packages and curated experience bundles from Siwa operators.' }),
      makeSection('pkg_directory',    'services_hub',            { title: 'Packages Directory', subtitle: 'Travel packages from verified Siwa businesses' }),
    ],
    footer_components: [],
  },
  {
    id: 'website_investment-opportunities',
    label: 'Investment Opportunities',
    header_components: [],
    body_components: [
      makeSection('inv_carousel',     'hero_carousel',           { carousel_id: 'investment-opportunities_hero' }),
      makeSection('inv_hero',         'category_hero',           { category: 'investment', label: 'Investment', title: 'Invest in the Siwa Oasis', accent: '#1e3a5f', description: 'Equity deals, partnership opportunities, franchises, and sponsorships from Siwan businesses.' }),
      makeSection('inv_directory',    'services_hub',            { title: 'Investment Directory', subtitle: 'Vetted investment opportunities in Siwa Oasis' }),
      makeSection('inv_partner',      'partner_cta',             { title: 'List your investment opportunity', subtitle: 'Connect with investors and sponsors via Siwify.' }),
    ],
    footer_components: [],
  },
];

export async function POST(_req: NextRequest) {
  try {
    const results: Record<string, string> = {};

    for (const page of PAGE_SEEDS) {
      // Check if this page already has a config
      const existing = await query<{ type: string }>(
        'SELECT type FROM website_configs WHERE type = ? LIMIT 1',
        [page.id]
      );

      if (existing.length > 0) {
        results[page.id] = 'skipped (already configured)';
        continue;
      }

      const config = JSON.stringify({
        header_components: page.header_components,
        body_components: page.body_components,
        footer_components: page.footer_components,
        site_settings: {},
      });

      await execute(
        `INSERT IGNORE INTO website_configs (type, config) VALUES (?, ?)`,
        [page.id, config]
      );

      results[page.id] = 'seeded';
    }

    return NextResponse.json({
      success: true,
      results,
      total: PAGE_SEEDS.length,
      seeded: Object.values(results).filter(v => v === 'seeded').length,
      skipped: Object.values(results).filter(v => v.startsWith('skipped')).length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** GET — dry-run: shows which pages would be seeded vs. already configured */
export async function GET(_req: NextRequest) {
  try {
    const report: Record<string, string> = {};

    for (const page of PAGE_SEEDS) {
      const existing = await query<{ type: string }>(
        'SELECT type FROM website_configs WHERE type = ? LIMIT 1',
        [page.id]
      );
      report[page.id] = existing.length > 0 ? 'already configured' : 'will be seeded';
    }

    return NextResponse.json({ report, total: PAGE_SEEDS.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
