import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const DEFAULT_SETTINGS = {
  enabled: true,
  frequency: 'every_3d', // 'every_session' | 'every_24h' | 'every_3d' | 'every_7d' | 'once_only' | 'disabled'
  target_tier: 'free_only',
  enable_watermark: true,
  watermark_text: 'Powered by Siwify.com | Claim or Upgrade',
  watermark_link: '/vendor/upgrade',
  promo_badge: 'Official Siwa Oasis Marketplace Ecosystem',
  headline: 'Unlock the Full Authority of Your Siwify Minisite',
  subtitle: 'Discover everything included in your Free Template, and explore powerful Pro features designed to drive bookings & revenue.',
  free_tier_features: [
    'Permanent Free Vanity URL & Search Listing',
    'Verified Identity & GPS Oasis Map Navigation',
    'Direct WhatsApp & Phone Customer Leads',
    'High-Resolution Photo Showcase (Up to 6 photos)',
    'Desktop & Mobile Responsive Minisite',
    'Instant Tabletop & Front-Desk QR Code'
  ],
  pro_tier_features: [
    'Direct Booking & Dynamic Room/Service Pricing',
    'Dedicated Sub-Paths & Deep Links (/{slug}/{section})',
    'Multi-Image Galleries & Fullscreen Sliders',
    'Cinematic Video Backgrounds & YouTube Stories',
    'Priority Discovery & "Featured in Siwa" Badging',
    'Zero Siwify Watermark — 100% Whitelabel Brand Identity'
  ]
};

export async function GET() {
  try {
    const results = await query(
      'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
      ['vendor_modal_settings']
    );

    if (results.length === 0) {
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    const config = typeof results[0].config === 'string'
      ? JSON.parse(results[0].config)
      : results[0].config;

    return NextResponse.json({ ...DEFAULT_SETTINGS, ...config });
  } catch (err: any) {
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    const config = JSON.stringify({
      ...DEFAULT_SETTINGS,
      ...body,
      updated_at: new Date().toISOString()
    });

    await execute(
      `INSERT INTO website_configs (type, config) VALUES ('vendor_modal_settings', ?) ON DUPLICATE KEY UPDATE config = VALUES(config)`,
      [config]
    );

    return NextResponse.json({ success: true, settings: { ...DEFAULT_SETTINGS, ...body } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
