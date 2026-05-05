import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * ELITE DEMO SUITE INJECTION BRIDGE
 * GET: /api/setup/inject-demo
 */
export async function GET() {
  try {
    const demoVendors = [
      {
        id: 'adrere-amellal',
        name: 'Adrere Amellal Eco-Lodge',
        slug: 'adrere-amellal',
        description: 'The world\'s most famous eco-luxury retreat, built entirely of Kershef and stone.',
        type_id: 1, 
        status: 'active',
        subscription_tier: 'gold',
        custom_data: JSON.stringify({
          era: 'Traditional',
          material: 'Kershef',
          vibe: 'Spiritual',
          experience: 'Honeymoon',
          story: 'A masterpiece of architectural heritage, Adrere Amellal offers an experience completely off the grid. No electricity, just the soft glow of candles and the vast desert sky.',
          section_gallery: [
            { url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62', caption: 'The main citadel wing' },
            { url: 'https://images.unsplash.com/photo-1505881502353-a1986add373c', caption: 'The salt-lake terrace' }
          ]
        })
      },
      {
        id: 'shali-citadel',
        name: 'The Shali Fortress',
        slug: 'shali-citadel',
        description: 'The 13th-century heart of Siwa Oasis. A labyrinth of mud-brick architecture.',
        type_id: 2, 
        status: 'active',
        subscription_tier: 'gold',
        custom_data: JSON.stringify({
          era: 'Ancient',
          material: 'Mud',
          vibe: 'Peaceful',
          experience: 'Nomad',
          story: 'Walking through Shali is like stepping back 800 years. The mud and salt walls tell a story of resilience and architectural genius.',
          section_gallery: [
            { url: 'https://images.unsplash.com/photo-1540979388789-6ece48a17499', caption: 'Shali at sunset' }
          ]
        })
      },
      {
        id: 'fatnas-wellness',
        name: 'Fatnas Island Retreat',
        slug: 'fatnas-island',
        description: 'Modern luxury meets ancient salt-lake therapies in a stone-built sanctuary.',
        type_id: 1, 
        status: 'active',
        subscription_tier: 'gold',
        custom_data: JSON.stringify({
          era: 'Modern',
          material: 'Stone',
          vibe: 'Adventure',
          experience: 'Family',
          story: 'Located on the edge of the lake, Fatnas Island is the ultimate sunset destination. Our modern retreat uses local stone to blend seamlessly with the horizon.',
          section_gallery: [
            { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', caption: 'The infinity salt pool' }
          ]
        })
      }
    ];

    const logs = [];

    for (const vendor of demoVendors) {
      const exists: any = await query('SELECT id FROM businesses WHERE id = ? OR slug = ?', [vendor.id, vendor.slug]);
      
      if (exists.length > 0) {
        logs.push(`♻️ Updated ${vendor.name}`);
        await query(`
          UPDATE businesses 
          SET name = ?, description = ?, custom_data = ?, subscription_tier = ?, status = ?
          WHERE id = ? OR slug = ?
        `, [vendor.name, vendor.description, vendor.custom_data, vendor.subscription_tier, vendor.status, vendor.id, vendor.slug]);
      } else {
        logs.push(`✨ Inserted ${vendor.name}`);
        await query(`
          INSERT INTO businesses (id, name, slug, description, type_id, status, subscription_tier, custom_data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [vendor.id, vendor.name, vendor.slug, vendor.description, vendor.type_id, vendor.status, vendor.subscription_tier, vendor.custom_data]);
      }
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
