import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { randomUUID } from 'crypto';

/**
 * PREMIER SIWA SEEDER: VIRAL EXAMPLES
 * Injecting world-class Siwa businesses with high-fidelity 8-block data.
 */
export async function GET(req: NextRequest) {
  try {
    const demos = [
      {
        id: 'demo_adrere',
        name: 'Adrere Amellal Eco-Lodge',
        type: 'accommodation',
        tier: 'gold',
        data: {
          sec_1_identity: {
            display_name: 'Adrere Amellal Eco-Lodge',
            establishment_info: 'Restored 1990s Heritage Site',
            section_blog: 'The most exclusive eco-lodge in the world, built entirely from salt-rock and palm wood.'
          },
          sec_2_ambience: {
            construction_materials: ['Kershef (Salt Brick)', 'Palm Wood'],
            construction_era: 'Traditional Siwan',
            property_philosophy: 'A dialogue between nature and architecture. No electricity, only beeswax candles.',
            section_gallery: [
              { url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62', caption: 'The Salt-Brick Walls', is_hero: true },
              { url: 'https://images.unsplash.com/photo-1505881502353-a1986add373c', caption: 'Candle-lit Dinners', is_hero: true }
            ]
          },
          sec_3_services: {
            experience_focus: ['Spiritual Retreat', 'Honeymoon'],
            view_types: ['Great Sand Sea Dunes', 'Salt Lake View'],
            section_blog: 'Experience absolute silence under the desert stars.'
          },
          sec_4_facilities: {
            amenities: ['Pool', 'Traditional Breakfast'],
            total_rooms: '40 unique suites'
          },
          sec_8_rates_offers: {
            price_standard: '$600 - $1200 per night',
            active_discounts: ['Long Stay (20%)'],
            special_conditions: 'All-inclusive of organic meals and excursions.'
          }
        }
      },
      {
        id: 'demo_taziry',
        name: 'Taziry Eco-Resort',
        type: 'accommodation',
        tier: 'premium',
        data: {
          sec_1_identity: { display_name: 'Taziry Eco-Resort', establishment_info: 'Contemporary Traditional' },
          sec_2_ambience: {
            construction_materials: ['Mud/Clay', 'Stone'],
            property_philosophy: 'Sustainable luxury focused on the Berber heritage of Siwa.',
            section_gallery: [
              { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23', caption: 'The Red Mountain View', is_hero: true }
            ]
          },
          sec_3_services: {
            experience_focus: ['Desert Adventure', 'Digital Nomad Friendly'],
            view_types: ['Great Sand Sea Dunes', 'Ancient Ruins']
          }
        }
      }
    ];

    for (const d of demos) {
      await execute(
        'INSERT INTO businesses (id, name, type_id, subscription_tier, custom_data, status) VALUES (?, ?, ?, ?, ?, "active") ' +
        'ON DUPLICATE KEY UPDATE custom_data = VALUES(custom_data), subscription_tier = VALUES(subscription_tier)',
        [d.id, d.name, d.type, d.tier, JSON.stringify(d.data)]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Viral Demo Examples Materialized Successfully',
      businesses: demos.map(b => b.name)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
