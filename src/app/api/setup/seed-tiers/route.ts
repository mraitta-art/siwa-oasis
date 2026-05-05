import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';

/**
 * TIER RECONCILIATION API
 * Configures the Free Trial vs Gold Premier feature gates.
 */
export async function GET(req: NextRequest) {
  try {
    const tiers = [
      { 
        id: 'free', 
        name: 'Free Trial', 
        features: { 
          maxSlides: 2, 
          maxImages: 5, 
          allowedMediaTypes: ['image'], 
          remove_watermark: false, 
          allow_youtube_story: false, 
          allow_custom_logo: false, 
          allowed_public_sections: ['sec_1_identity', 'sec_3_services', 'sec_5_connectivity'] 
        } 
      },
      { 
        id: 'gold', 
        name: 'Gold Premier', 
        features: { 
          maxSlides: 10, 
          maxImages: 50, 
          allowedMediaTypes: ['image', 'youtube', 'video'], 
          remove_watermark: true, 
          allow_youtube_story: true, 
          allow_custom_logo: true, 
          allowed_public_sections: [
            'sec_1_identity', 'sec_2_ambience', 'sec_3_services', 
            'sec_4_facilities', 'sec_5_connectivity', 'sec_6_geographic', 
            'sec_7_investment', 'sec_8_rates_offers'
          ] 
        } 
      }
    ];

    for (const t of tiers) {
      await execute(
        'INSERT INTO subscription_tiers (id, name, features) VALUES (?, ?, ?) ' +
        'ON DUPLICATE KEY UPDATE features = VALUES(features)',
        [t.id, t.name, JSON.stringify(t.features)]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription Tiers Reconciled Successfully',
      tiers: tiers.map(t => t.name)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
