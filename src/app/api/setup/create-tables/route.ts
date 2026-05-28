import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Creating website_configs table...');
    await execute(`
      CREATE TABLE IF NOT EXISTS website_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(100) UNIQUE NOT NULL,
        config JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('🔧 Creating journey_itineraries table...');
    await execute(`
      CREATE TABLE IF NOT EXISTS journey_itineraries (
        id VARCHAR(36) PRIMARY KEY,
        itinerary_key VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        summary TEXT,
        vibe VARCHAR(100) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        pace VARCHAR(50) NOT NULL,
        steps JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Seed default itineraries if empty
    const countResult = await query('SELECT COUNT(*) as count FROM journey_itineraries');
    if (countResult[0].count === 0) {
      console.log('🌱 Seeding default journey itineraries...');
      
      const defaultItineraries = [
        {
          id: 'ji-1',
          itinerary_key: 'spiritual-2-slow',
          name: 'The Purification Cycle',
          summary: 'A tranquil weekend designed to release city fatigue through high-salinity minerals, ancient architecture, and organic thermal pool soaking.',
          vibe: 'spiritual',
          duration: '2',
          pace: 'slow',
          steps: JSON.stringify([
            {
              day: 1,
              title: 'The Great Salt Float',
              activities: ['Float in the high-salinity Salt Lakes for deep muscular relief.', 'Sip lemongrass tea at Cleopatra\'s natural hot pool during sunset.'],
              tips: 'Avoid getting salt water in your eyes; rinse immediately with pure water.',
              location: 'Salt Lake Oasis & Cleopatra Spring'
            },
            {
              day: 2,
              title: 'The Clay Fortress & Silence',
              activities: ['Quiet architectural walk through Shali Fortress ruins.', 'Traditional kershef tea ceremony in Adrere Amellal shadow.'],
              tips: 'Wear light linen fabrics and organic walking sandals.',
              location: 'Shali Fortress & Adrere Amellal'
            }
          ])
        },
        {
          id: 'ji-2',
          itinerary_key: 'adventure-5-active',
          name: 'The Sahara Nomad Odyssey',
          summary: 'A fast-paced, high-energy trek scaling the highest dunes of the Great Sand Sea, desert stargazing, and historic hot spring diving.',
          vibe: 'adventure',
          duration: '5',
          pace: 'active',
          steps: JSON.stringify([
            {
              day: 1,
              title: 'Fortress Scaling & Clay Hikes',
              activities: ['Ascend Shali Fortress during sunrise.', 'Rent a local bike to ride around Aghurmi ruins.'],
              tips: 'Bring plenty of mineral water and a wide-brimmed sun hat.',
              location: 'Shali Mountain & Aghurmi'
            },
            {
              day: 2,
              title: 'The Deep Dunes & 4x4',
              activities: ['4x4 desert safari scaling the Great Sand Sea.', 'Sandboarding down massive 80-meter dunes.'],
              tips: 'Secure your phone and camera in zip-lock bags to protect from fine desert dust.',
              location: 'Great Sand Sea'
            },
            {
              day: 3,
              title: 'Nomadic Oasis Camping',
              activities: ['Traditional Bedouin dinner cooked under sand.', 'Stargazing session near the cold spring lake.'],
              tips: 'Temperatures drop significantly in the desert at night; bring a warm fleece jacket.',
              location: 'Bir Wahed Desert Camp'
            },
            {
              day: 4,
              title: 'The Oracle Temple & Ancient Myths',
              activities: ['Visit Temple of Oracle Alexander the Great.', 'Climb Mountain of Dead for panoramic date grove views.'],
              tips: 'Respect the local heritage guidelines by not touching ancient wall engravings.',
              location: 'Oracle Temple & Mountain of the Dead'
            },
            {
              day: 5,
              title: 'Salt Recovery Soak',
              activities: ['Final intense float in salt lakes to recharge.', 'Dinner at traditional organic olive grove.'],
              tips: 'Wash with fresh water immediately after floating to avoid skin irritation.',
              location: 'Salt Lake & Local Date Orchards'
            }
          ])
        }
      ];

      for (const item of defaultItineraries) {
        await execute(
          'INSERT INTO journey_itineraries (id, itinerary_key, name, summary, vibe, duration, pace, steps) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [item.id, item.itinerary_key, item.name, item.summary, item.vibe, item.duration, item.pace, item.steps]
        );
      }
      console.log('✅ Seeding completed!');
    }

    return NextResponse.json({
      success: true,
      message: 'Tables created and seeded successfully!',
      websiteConfigsExists: (await query("SHOW TABLES LIKE 'website_configs'")).length > 0,
      journeyItinerariesExists: (await query("SHOW TABLES LIKE 'journey_itineraries'")).length > 0,
    });

  } catch (error: any) {
    console.error('❌ Error creating tables:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'Check database connection in .env.local'
    }, { status: 500 });
  }
}
