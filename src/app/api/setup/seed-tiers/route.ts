import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { CANONICAL_SECTION_IDS } from '@/lib/section-registry';

/**
 * TIER RECONCILIATION API
 * Configures the free period vs Gold Premier feature gates.
 *
 * The `free` row doubles as the trial policy: `trial_days` sets how long the
 * period lasts and the rest describes what stays on during it.
 */
export async function GET(req: NextRequest) {
  try {
    const tiers = [
      { 
        id: 'free', 
        name: 'Free Trial', 
        // Free is a period, not a reduced product: every service is switched on
        // (real public existence) and only quantity is capped. `trial_days` is
        // the admin-controlled length — change it here, no deploy needed.
        features: { 
          trial_days: 90,
          trial_full_service: true,

          // Quantity limits in force for the whole period
          maxSlides: 10, 
          maxImages: 60, 
          maxStorageMB: 250,
          maxBusinesses: 1,
          maxCustomBlocks: 6,

          // "Try one" media: one carousel slide, one uploaded video, one YouTube
          // embed. trial_max_slides is separate from maxSlides so the public
          // hero never truncates slides the vendor already has.
          trial_max_slides: 1,
          max_videos: 1,
          max_youtube: 1,

          // Full presentation, no watermarks or missing sections
          allowedMediaTypes: ['image', 'youtube', 'video'], 
          max_youtube_duration: 300,
          remove_watermark: true, 
          allow_youtube_story: true, 
          allow_custom_logo: true,
          canPublishMinisite: true,
          canCustomizeTemplate: true,

          // Every catalog service on during the period
          qr_enabled: true,
          allow_direct_contact: true,
          section_captions: true,
          section_blog: true,
          minisite_carousel: true,
          main_carousel: true,
          journey_view_requests: true,
          journey_submit_offer: true,
          analytics_access: true,
        } 
      },
      { 
        id: 'gold', 
        name: 'Gold Premier', 
        features: { 
          maxSlides: 10, 
          maxImages: 50, 
          max_videos: 10,
          max_youtube: 5,
          allowedMediaTypes: ['image', 'youtube', 'video'], 
          remove_watermark: true, 
          allow_youtube_story: true, 
          allow_custom_logo: true, 
          allowedSections: [...CANONICAL_SECTION_IDS],
          allow_direct_contact: true,
          analytics_access: true,
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
