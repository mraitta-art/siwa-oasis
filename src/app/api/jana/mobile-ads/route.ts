import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ADS_CONFIG_KEY = 'mobile_dashboard_ad';

export interface MobileAdConfig {
  enabled: boolean;
  badgeAr: string;
  badgeEn: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  ctaTextAr: string;
  ctaTextEn: string;
  ctaLink: string;
  icon: string;
  whatsappNumber: string;
}

const DEFAULT_MOBILE_AD: MobileAdConfig = {
  enabled: true,
  badgeAr: 'إعلان المنصة الرسمي',
  badgeEn: 'OFFICIAL PLATFORM NOTICE',
  titleAr: 'فرصتك الحصرية لتصدر نتائج رحلات سيوة والخرائط الرقمية 🌴',
  titleEn: 'Exclusive Opportunity: Top #1 Ranking on Siwa Trips & Maps 🌴',
  descAr: 'عملاؤك وزوار سيوة يبحثون عنك الآن! حافظ على سرعة الرد عبر واتساب، وحدّث صور مركبتك/خدمتك باستمرار لتصلك حجوزات أكثر مباشرة وبدون أي عمولة.',
  descEn: 'Guests are discovering Siwa right now! Reply promptly on WhatsApp and keep your service photos updated to maximize direct, commission-free bookings.',
  ctaTextAr: 'تواصل مع إدارة المنصة',
  ctaTextEn: 'Contact Support',
  ctaLink: '', // If empty, will default to WhatsApp with whatsappNumber
  icon: '📢',
  whatsappNumber: '201000000000',
};

export async function GET() {
  try {
    const config = await queryOne(
      `SELECT value FROM website_configs WHERE key = ? AND type = 'mobile_ads'`,
      [ADS_CONFIG_KEY]
    ) as any;

    let adConfig: MobileAdConfig = DEFAULT_MOBILE_AD;
    if (config?.value) {
      try {
        const parsed = JSON.parse(config.value);
        if (parsed && typeof parsed === 'object') {
          adConfig = { ...DEFAULT_MOBILE_AD, ...parsed };
        }
      } catch {}
    }

    return NextResponse.json({ ad: adConfig });
  } catch (err: any) {
    return NextResponse.json({ ad: DEFAULT_MOBILE_AD, error: err?.message }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { ad } = body;

    if (!ad || typeof ad !== 'object') {
      return NextResponse.json({ error: 'ad configuration object required' }, { status: 400 });
    }

    const merged = { ...DEFAULT_MOBILE_AD, ...ad };
    const jsonStr = JSON.stringify(merged);

    const existing = await queryOne(
      `SELECT id FROM website_configs WHERE key = ? AND type = 'mobile_ads'`,
      [ADS_CONFIG_KEY]
    );

    if (existing) {
      await execute(
        `UPDATE website_configs SET value = ?, updated_at = NOW() WHERE key = ? AND type = 'mobile_ads'`,
        [jsonStr, ADS_CONFIG_KEY]
      );
    } else {
      await execute(
        `INSERT INTO website_configs (\`key\`, type, value, created_at, updated_at) VALUES (?, 'mobile_ads', ?, NOW(), NOW())`,
        [ADS_CONFIG_KEY, jsonStr]
      );
    }

    return NextResponse.json({ success: true, ad: merged });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save mobile ad' }, { status: 500 });
  }
}
