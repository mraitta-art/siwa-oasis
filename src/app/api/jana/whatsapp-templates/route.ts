import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const TEMPLATES_CONFIG_KEY = 'whatsapp_message_templates';

export interface WhatsAppTemplateItem {
  id: string;
  name: string;
  categoryKey: string; // 'transport' | 'safari' | 'wellness' | 'tour_operator' | 'hotel' | 'dining' | 'crafts' | 'general'
  targetAudience: 'all' | 'new_unclaimed' | 'active_vendor' | 'tourist_client' | 'inactive_reactivation';
  isHidden: boolean;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  includedFeatures: string[];
  updatedAt?: string;
}

const DEFAULT_TEMPLATES: WhatsAppTemplateItem[] = [
  {
    id: 'transport_onboarding',
    name: 'Tuk-Tuk & Transfers Onboarding',
    categoryKey: 'transport',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة ترحيب وتفعيل لسائقي التوك توك والنقل',
    titleEn: 'Welcome & Free Minisite for Tuk-Tuk & Transfer Drivers',
    contentAr: `مرحباً بك يا كابتن *{name}* في سيوة! 🌴✨\n\nيسر منصة *SiWiFy.com* إعلامك باعتماد وتوثيق نشاطك تحت تصنيف:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *خدماتك المجانية المتاحة فوراً:*\n1️⃣ موقعك المصغر للحجز المباشر (0% عمولة): {minisiteUrl}\n2️⃣ صانع فيديوهات الريلز المجاني: {socialToolkitUrl}\n3️⃣ لوحة تحكم موبايل لمتابعة نشاطك: {mobileDashboardUrl}\n\n🔑 لتفعيل وتأكيد حسابك كشريك رسمي:\n{claimUrl}\n\n🚀 *ترقية باقتك للبريميوم تمنحك:*\n• الصدارة #1 في بحث سيوة والخرائط\n• علامة التوثيق الذهبية\n• إمكانية تحصيل العربون أونلاين`,
    contentEn: `Welcome *{name}* to Siwa Oasis Digital Platform! 🌴✨\n\nYour profile is verified under:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Your 100% Free Included Tools:*\n1️⃣ Official Minisite: {minisiteUrl}\n2️⃣ Free Reels & Stories Maker: {socialToolkitUrl}\n3️⃣ Private Mobile Dashboard: {mobileDashboardUrl}\n\n🔑 Claim your account: {claimUrl}\n\n🚀 *Upgrade to Premium to get:*\n• #1 Ranking on Siwa search\n• Verified Gold Badge\n• Accept online deposits directly`,
    includedFeatures: ['Licensed Tuk-Tuk', 'Verified Local Driver', 'Salt Lakes & Sunset Tours'],
  },
  {
    id: 'wellness_onboarding',
    name: 'Health & Wellness Onboarding',
    categoryKey: 'wellness',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة اعتماد مراكز الاستشفاء والعافية والملح',
    titleEn: 'Welcome & Activation for Wellness & Salt Centers',
    contentAr: `مرحباً بكم في مركز *{name}* للاستشفاء والعافية في سيوة! 🌴✨\n\nتم توثيق مركزكم في دليل سيوة السياحي الرسمي:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *الخدمات المجانية المتاحة لمركزكم فوراً:*\n1️⃣ صفحة عرض رسمية لحجز جلسات الاستشفاء: {minisiteUrl}\n2️⃣ صانع فيديوهات السوشيال ميديا: {socialToolkitUrl}\n3️⃣ لوحة تحكم لمتابعة الحجوزات: {mobileDashboardUrl}\n\n🔑 تأكيد وتفعيل الحساب: {claimUrl}\n\n🚀 *الترقية تتيح حجز برامج الاستشفاء وجلسات الدكرور مع تحصيل العربون وتصدر البحث الطبي.*`,
    contentEn: `Welcome *{name}* to the Siwa Oasis Wellness Hub! 🌴✨\n\nYour wellness center is verified under:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Your 100% Free Included Tools:*\n1️⃣ Official Minisite: {minisiteUrl}\n2️⃣ Social Reels Creator: {socialToolkitUrl}\n3️⃣ Mobile Command Center: {mobileDashboardUrl}\n\n🔑 Claim profile: {claimUrl}\n\n🚀 *Upgrade to accept multi-day retreat bookings with online advance deposits.*`,
    includedFeatures: ['Healing Salt Lakes', 'Dakrour Sand Baths', 'Sulfur Springs', 'Herbal Massages'],
  },
  {
    id: 'tour_operator_onboarding',
    name: 'Tour Operators & Itineraries Onboarding',
    categoryKey: 'tour_operator',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة اعتماد منظمي الرحلات والبرامج السياحية',
    titleEn: 'Welcome & Activation for Tour Operators',
    contentAr: `مرحباً بشركة/منظم رحلات *{name}* في سيوة! 🌴✨\n\nتم توثيق نشاطكم في منصة *SiWiFy.com* لتنظيم البرامج المتكاملة:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *مزاياكم المجانية:*\n1️⃣ موقعكم المصغر لعرض الباقات: {minisiteUrl}\n2️⃣ صانع فيديوهات الريلز للرحلات: {socialToolkitUrl}\n3️⃣ لوحة إدارة البرامج من الموبايل: {mobileDashboardUrl}\n\n🔑 تأكيد الحساب: {claimUrl}\n\n🚀 *الترقية تتيح دمج باقات السفاري والإقامة والنقل في فاتورة واحدة للعميل مع تحصيل الدفعات أونلاين.*`,
    contentEn: `Welcome *{name}* to Siwa Oasis Tour Operations! 🌴✨\n\nYour agency is verified under:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Free Included Tools:*\n1️⃣ Verified Itinerary Minisite: {minisiteUrl}\n2️⃣ Tour Reels Maker: {socialToolkitUrl}\n3️⃣ Mobile Dashboard: {mobileDashboardUrl}\n\n🔑 Claim profile: {claimUrl}\n\n🚀 *Upgrade to enable Multi-Service Package Bundling & Group deposit checkouts.*`,
    includedFeatures: ['All-Inclusive Itineraries', 'Cairo Group Logistics', 'Desert Permits Included'],
  },
  {
    id: 'client_showcase_general',
    name: 'Client / Tourist Showcase Pitch',
    categoryKey: 'general',
    targetAudience: 'tourist_client',
    isHidden: false,
    titleAr: 'بطاقة عرض الخدمة للزبائن والسياح',
    titleEn: 'Direct Tourist Showcase & Booking Pitch',
    contentAr: `🌴 مرحباً بك في واحة سيوة! ✨\n\nنقدم لك خدمة موثوقة ومباشرة مع: *{name}*\n\n📸 *معرض الصور والمركبة / الخدمة:*\n{photoLinks}\n\n✨ *المميزات والخدمات المشمولة:*\n{featureList}\n\n🌐 *للتفاصيل والحجز المباشر بدون عمولة (0%):*\n{minisiteUrl}\n\nنتمنى لكم إقامة وتجربة لا تُنسى في سيوة! 🌿`,
    contentEn: `🌴 Welcome to Siwa Oasis! ✨\n\nHere is verified direct service details for: *{name}*\n\n📸 *Photos & Showcase:*\n{photoLinks}\n\n✨ *Highlights & Inclusions:*\n{featureList}\n\n🌐 *Direct Minisite & 0% Commission Booking:*\n{minisiteUrl}\n\nHave a magical journey in Siwa Oasis! 🌿`,
    includedFeatures: ['Verified Partner', 'Instant Booking', '0% Commission'],
  },
];

export async function GET() {
  try {
    await requireAdmin();

    const config = await queryOne(
      `SELECT value FROM website_configs WHERE key = ? AND type = 'whatsapp_templates'`,
      [TEMPLATES_CONFIG_KEY]
    ) as any;

    let templates: WhatsAppTemplateItem[] = DEFAULT_TEMPLATES;
    if (config?.value) {
      try {
        const parsed = JSON.parse(config.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          templates = parsed;
        }
      } catch {}
    }

    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { templates } = body;

    if (!Array.isArray(templates)) {
      return NextResponse.json({ error: 'templates array required' }, { status: 400 });
    }

    const jsonStr = JSON.stringify(templates);

    // Save into website_configs
    const existing = await queryOne(
      `SELECT id FROM website_configs WHERE key = ? AND type = 'whatsapp_templates'`,
      [TEMPLATES_CONFIG_KEY]
    );

    if (existing) {
      await execute(
        `UPDATE website_configs SET value = ?, updated_at = NOW() WHERE key = ? AND type = 'whatsapp_templates'`,
        [jsonStr, TEMPLATES_CONFIG_KEY]
      );
    } else {
      await execute(
        `INSERT INTO website_configs (\`key\`, type, value, created_at, updated_at) VALUES (?, 'whatsapp_templates', ?, NOW(), NOW())`,
        [TEMPLATES_CONFIG_KEY, jsonStr]
      );
    }

    return NextResponse.json({ success: true, count: templates.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save templates' }, { status: 500 });
  }
}
