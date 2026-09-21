import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export interface SubdomainEntry {
  subdomain: string;
  target_route: string;
  label: string;
  category: string;
  active: boolean;
  is_primary?: boolean;
  description?: string;
}

export const DEFAULT_SUBDOMAINS: SubdomainEntry[] = [
  // Accommodations
  { subdomain: 'siwastay', target_route: '/accommodations', label: 'Siwa Stay (Primary)', category: 'accommodations', active: true, is_primary: true, description: 'Main Accommodations & Hotels portal' },
  { subdomain: 'siwastayat', target_route: '/accommodations', label: 'Siwa Stay At', category: 'accommodations', active: true, description: 'SEO alias for stay search keywords' },
  { subdomain: 'siwahotels', target_route: '/accommodations', label: 'Siwa Hotels', category: 'accommodations', active: true, description: 'High-intent hotel search alias' },
  { subdomain: 'siwacamps', target_route: '/accommodations', label: 'Siwa Desert Camps', category: 'accommodations', active: true, description: 'Desert camp & glamping alias' },
  { subdomain: 'siwalodges', target_route: '/accommodations', label: 'Siwa Lodges', category: 'accommodations', active: true, description: 'Eco-lodge & boutique stay alias' },
  { subdomain: 'staywith', target_route: '/accommodations', label: 'Stay With Siwa', category: 'accommodations', active: true, description: 'Brand campaign alias' },

  // Transportation
  { subdomain: 'siwamove', target_route: '/transportation', label: 'Siwa Move (Primary)', category: 'transportation', active: true, is_primary: true, description: 'Main Transportation & Transfers portal' },
  { subdomain: 'siwatransport', target_route: '/transportation', label: 'Siwa Transport', category: 'transportation', active: true, description: 'SEO transportation alias' },
  { subdomain: 'siwatransfers', target_route: '/transportation', label: 'Siwa Transfers', category: 'transportation', active: true, description: 'Direct airport/city transfer alias' },
  { subdomain: 'siwa4x4', target_route: '/transportation', label: 'Siwa 4x4 Desert Mobility', category: 'transportation', active: true, description: '4x4 safari vehicle transport' },
  { subdomain: 'movewith', target_route: '/transportation', label: 'Move With Siwa', category: 'transportation', active: true, description: 'Brand campaign alias' },

  // Activities & Safari
  { subdomain: 'siwatours', target_route: '/activities', label: 'Siwa Tours (Primary)', category: 'activities', active: true, is_primary: true, description: 'Main Tours & Activities explorer' },
  { subdomain: 'siwasafari', target_route: '/activities', label: 'Siwa Desert Safari', category: 'activities', active: true, description: 'Great Sand Sea safari alias' },
  { subdomain: 'siwaactivities', target_route: '/activities', label: 'Siwa Activities', category: 'activities', active: true, description: 'Things to do in Siwa alias' },
  { subdomain: 'siwaexperiences', target_route: '/activities', label: 'Siwa Experiences', category: 'activities', active: true, description: 'Curated experiences alias' },

  // Food & Dining
  { subdomain: 'siwaeat', target_route: '/food-beverage', label: 'Siwa Eat (Primary)', category: 'food-beverage', active: true, is_primary: true, description: 'Restaurants & Traditional Food' },
  { subdomain: 'siwafood', target_route: '/food-beverage', label: 'Siwa Food', category: 'food-beverage', active: true, description: 'Food & culinary directory' },
  { subdomain: 'siwadining', target_route: '/food-beverage', label: 'Siwa Dining', category: 'food-beverage', active: true, description: 'Fine dining & cafes' },
  { subdomain: 'siwarestaurants', target_route: '/food-beverage', label: 'Siwa Restaurants', category: 'food-beverage', active: true, description: 'Restaurant search alias' },

  // Crafts & Wellness
  { subdomain: 'siwawellness', target_route: '/crafts-wellness', label: 'Siwa Wellness (Primary)', category: 'crafts-wellness', active: true, is_primary: true, description: 'Hot springs, salt pools & sand baths' },
  { subdomain: 'siwacrafts', target_route: '/crafts-wellness', label: 'Siwa Handicrafts', category: 'crafts-wellness', active: true, description: 'Handmade salt lamps, embroidery & silver' },
  { subdomain: 'siwasalt', target_route: '/crafts-wellness', label: 'Siwa Salt Therapy', category: 'crafts-wellness', active: true, description: 'Salt lakes & halotherapy' },
  { subdomain: 'siwaspa', target_route: '/crafts-wellness', label: 'Siwa Spa & Healing', category: 'crafts-wellness', active: true, description: 'Natural thermal springs' },

  // Production & Trade
  { subdomain: 'siwatrade', target_route: '/production-trade', label: 'Siwa Trade (Primary)', category: 'production-trade', active: true, is_primary: true, description: 'Dates, Olives & Agricultural Export' },
  { subdomain: 'siwadates', target_route: '/production-trade', label: 'Siwa Dates Export', category: 'production-trade', active: true, description: 'Organic Siwan date farms' },
  { subdomain: 'siwaolives', target_route: '/production-trade', label: 'Siwa Olive Oil', category: 'production-trade', active: true, description: 'Cold pressed virgin olive oil mills' },

  // Stories, Media & Blog
  { subdomain: 'siwastories', target_route: '/blog', label: 'Siwa Stories (Primary)', category: 'blog', active: true, is_primary: true, description: 'Online magazine & traveler tales' },
  { subdomain: 'siwablog', target_route: '/blog', label: 'Siwa Blog', category: 'blog', active: true, description: 'Editorial travel guides' },

  // Commercial & Deals
  { subdomain: 'siwadeals', target_route: '/offers', label: 'Siwa Deals & Offers', category: 'offers', active: true, is_primary: true, description: 'Special promotions & discounts' },
  { subdomain: 'siwapackages', target_route: '/packages', label: 'Siwa Packages', category: 'packages', active: true, is_primary: true, description: 'Multi-day curated packages' },
  { subdomain: 'siwaauctions', target_route: '/auctions', label: 'Siwa Auctions', category: 'auctions', active: true, is_primary: true, description: 'Live land & asset auctions' },
  { subdomain: 'siwainvest', target_route: '/investment-opportunities', label: 'Siwa Investments', category: 'investment', active: true, is_primary: true, description: 'Eco-lodge & land opportunities' },

  // Journeys & Planners
  { subdomain: 'siwajourneys', target_route: '/journeys', label: 'Siwa Journeys', category: 'journeys', active: true, is_primary: true, description: 'Custom Expedition Planner' },

  // Partners & Onboarding
  { subdomain: 'siwapartner', target_route: '/be-a-partner', label: 'Siwa Partner Portal', category: 'partner', active: true, is_primary: true, description: 'Vendor registration & tiers' },
  { subdomain: 'siwaoasis', target_route: '/', label: 'Siwa Oasis Main Portal', category: 'main', active: true, is_primary: true, description: 'Official Oasis Gateway' },
];

export async function GET() {
  try {
    const results = await query(
      'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
      ['subdomain_routing_rules']
    );

    if (results.length === 0) {
      return NextResponse.json({ subdomains: DEFAULT_SUBDOMAINS, custom_enabled: true });
    }

    const data = typeof results[0].config === 'string'
      ? JSON.parse(results[0].config)
      : results[0].config;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ subdomains: DEFAULT_SUBDOMAINS, custom_enabled: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    const config = JSON.stringify({
      subdomains: body.subdomains || DEFAULT_SUBDOMAINS,
      custom_enabled: body.custom_enabled !== false,
      updated_at: new Date().toISOString()
    });

    await execute(
      `INSERT INTO website_configs (id, name, type, config, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE config = VALUES(config), updated_at = NOW()`,
      ['config_subdomain_routing', 'Subdomain Routing Rules', 'subdomain_routing_rules', config]
    );

    return NextResponse.json({ success: true, message: 'Subdomain rules saved successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save subdomains' }, { status: 500 });
  }
}
