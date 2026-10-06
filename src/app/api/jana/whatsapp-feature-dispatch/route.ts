import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Standard industry feature presets for WhatsApp Client Showcase
 */
export const CATEGORY_FEATURE_PRESETS: Record<string, { en: string[]; ar: string[] }> = {
  transport: {
    en: [
      '🛺 Licensed & Clean Tuk-Tuk / Transfer Vehicle',
      '👤 Verified Local Siwan Driver',
      '🌅 Salt Lakes, Dakrour & Sunset Trips',
      '💬 English & Arabic Speaking',
      '📍 Free Hotel Pickup & Drop-off in Siwa',
      '⚡ Fixed, Transparent & Fair Pricing',
    ],
    ar: [
      '🛺 توك توك / سيارة نقل مرخصة ونظيفة',
      '👤 سائق سيوي محلي معتمد وموثوق',
      '🌅 جولات بحيرات الملح، جبل الدكرور وغروب الفطناس',
      '💬 يتحدث العربية والإنجليزية للترحيب بالضيوف',
      '📍 استقبال وتوصيل مباشر من وإلى فندقك في سيوة',
      '⚡ أسعار ثابتة ومناسبة بدون عمولات خفية',
    ],
  },
  safari: {
    en: [
      '🚙 Equipped 4x4 Land Cruiser with Desert Permits',
      '🏜️ Great Sand Sea Dune Bashing & Sandboarding',
      '⛺ Hot Spring & Bedouin Tea at Sunset Camp',
      '🧭 Expert Desert Guide with 10+ Years Experience',
    ],
    ar: [
      '🚙 سيارة دفع رباعي 4x4 مجهزة بتصاريح الصحراء',
      '🏜️ سفاري بحر الرمال الأعظم والتزلج على الرمال',
      '⛺ استراحة عند بئر المياه الكبريتية وشاي بدوي عند الغروب',
      '🧭 دليل صحراوي خبير بأمان ودروب الواحة',
    ],
  },
  hotel: {
    en: [
      '🏨 Authentic Siwan Architecture & Salt-Rock Decor',
      '🌴 Lush Palm Garden & Quiet Mountain Views',
      '🍳 Traditional Siwan Breakfast Included',
      '❄️ Air-Conditioned Rooms with Private Bathrooms',
    ],
    ar: [
      '🏨 عمارة كرجيف سيوية أصلية بديكورات صخور الملح',
      '🌴 حدائق نخيل هادئة وإطلالات ساحرة على الجبل',
      '🍳 إفطار سيوي طازج مشمول مع الإقامة',
      '❄️ غرف مكيفة ومجهزة بحمام خاص وواي فاي',
    ],
  },
  dining: {
    en: [
      '🍲 Authentic Siwan Tagines & Wood-Fired Specialties',
      '🌿 Fresh Organic Farm-to-Table Ingredients',
      '🕯️ Romantic Candlelit Palm Garden Seating',
      '☕ Complimentary Siwan Herbal Tea & Dates',
    ],
    ar: [
      '🍲 طواجن سيوية أصلية ومشاوي على الحطب',
      '🌿 مكونات طبيعية طازجة من مزارع سيوة العضوية',
      '🕯️ جلسات نخيل بدوية رومانسية تحت النجوم',
      '☕ ضيافة شاي لويزة وتمور سيوية فاخرة',
    ],
  },
  general: {
    en: [
      '⭐ Verified Partner on SiWiFy.com',
      '💬 Instant WhatsApp Booking & Inquiries',
      '📍 Centrally Located in Siwa Oasis',
      '🤝 100% Direct Contact with 0% Hidden Commission',
    ],
    ar: [
      '⭐ شريك معتمد وموثق على منصة SiWiFy.com',
      '💬 حجز وتواصل فوري وسريع عبر الواتساب',
      '📍 موقع متميز يسهل الوصول إليه في واحة سيوة',
      '🤝 تواصل مباشر 100% بدون أي عمولات وسيطة',
    ],
  },
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const business = await queryOne(`
      SELECT b.*, bt.name as type_name, bt.icon as type_icon, bt.id as type_id
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      WHERE b.id = ? OR b.slug = ?
    `, [businessId, businessId]) as any;

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    let customData: Record<string, any> = {};
    try {
      customData = typeof business.custom_data === 'string'
        ? JSON.parse(business.custom_data)
        : business.custom_data || {};
    } catch {
      customData = {};
    }

    const showcase = customData.whatsapp_showcase || {};

    // Detect category key for presets
    const typeIdStr = String(business.type_id || '').toLowerCase();
    let categoryKey = 'general';
    if (typeIdStr.includes('trans') || typeIdStr.includes('move') || typeIdStr.includes('tuk') || typeIdStr.includes('driver')) {
      categoryKey = 'transport';
    } else if (typeIdStr.includes('safari') || typeIdStr.includes('tour') || typeIdStr.includes('desert') || typeIdStr.includes('act')) {
      categoryKey = 'safari';
    } else if (typeIdStr.includes('hotel') || typeIdStr.includes('camp') || typeIdStr.includes('stay') || typeIdStr.includes('lodge')) {
      categoryKey = 'hotel';
    } else if (typeIdStr.includes('food') || typeIdStr.includes('eat') || typeIdStr.includes('rest') || typeIdStr.includes('cafe')) {
      categoryKey = 'dining';
    }

    const defaultPresets = CATEGORY_FEATURE_PRESETS[categoryKey] || CATEGORY_FEATURE_PRESETS.general;

    const data = {
      businessId: business.id,
      name: business.name,
      slug: business.slug,
      phone: business.phone || customData.basic?.phone || customData.sec_1_identity?.phone || '',
      whatsapp: customData.basic?.whatsapp || customData.sec_1_identity?.whatsapp || business.phone || '',
      type_name: business.type_name || 'Business',
      categoryKey,
      
      // Photos for showcase
      personalPhoto: showcase.personal_photo || customData.basic?.driver_photo || customData.sec_1_identity?.personal_photo || business.logo_url || '',
      servicePhoto1: showcase.service_photo_1 || customData.basic?.vehicle_photo_1 || (Array.isArray(customData.basic?.gallery) ? customData.basic.gallery[0] : '') || '',
      servicePhoto2: showcase.service_photo_2 || customData.basic?.vehicle_photo_2 || (Array.isArray(customData.basic?.gallery) ? customData.basic.gallery[1] : '') || '',
      
      // Selected features / highlights
      selectedFeaturesEn: showcase.features_en || defaultPresets.en,
      selectedFeaturesAr: showcase.features_ar || defaultPresets.ar,
      availablePresets: defaultPresets,
      
      // Custom notes / headline
      customNoteAr: showcase.custom_note_ar || '',
      customNoteEn: showcase.custom_note_en || '',
      
      minisiteUrl: `https://siwify.com/${business.slug}`,
    };

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load showcase data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
      businessId,
      personalPhoto,
      servicePhoto1,
      servicePhoto2,
      selectedFeaturesEn,
      selectedFeaturesAr,
      customNoteAr,
      customNoteEn,
      syncToMinisite = true,
    } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const business = await queryOne(`SELECT id, custom_data FROM businesses WHERE id = ? OR slug = ?`, [businessId, businessId]) as any;
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    let customData: Record<string, any> = {};
    try {
      customData = typeof business.custom_data === 'string'
        ? JSON.parse(business.custom_data)
        : business.custom_data || {};
    } catch {
      customData = {};
    }

    // Save WhatsApp showcase config
    customData.whatsapp_showcase = {
      personal_photo: personalPhoto || '',
      service_photo_1: servicePhoto1 || '',
      service_photo_2: servicePhoto2 || '',
      features_en: selectedFeaturesEn || [],
      features_ar: selectedFeaturesAr || [],
      custom_note_ar: customNoteAr || '',
      custom_note_en: customNoteEn || '',
      updated_at: new Date().toISOString(),
    };

    // If syncToMinisite is requested, synchronize into standard custom_data keys
    if (syncToMinisite) {
      if (!customData.basic) customData.basic = {};
      if (!customData.sec_1_identity) customData.sec_1_identity = {};

      if (personalPhoto) {
        customData.basic.driver_photo = personalPhoto;
        customData.basic.personal_photo = personalPhoto;
        customData.sec_1_identity.driver_photo = personalPhoto;
      }
      if (servicePhoto1) customData.basic.vehicle_photo_1 = servicePhoto1;
      if (servicePhoto2) customData.basic.vehicle_photo_2 = servicePhoto2;

      // Also append to gallery if not present
      const gallery = Array.isArray(customData.basic.gallery) ? [...customData.basic.gallery] : [];
      [servicePhoto1, servicePhoto2, personalPhoto].forEach((photo) => {
        if (photo && !gallery.includes(photo)) {
          gallery.push(photo);
        }
      });
      customData.basic.gallery = gallery;

      // Sync highlights
      customData.basic.highlights_ar = selectedFeaturesAr;
      customData.basic.highlights_en = selectedFeaturesEn;
    }

    await execute(
      `UPDATE businesses SET custom_data = ?, updated_at = NOW() WHERE id = ?`,
      [JSON.stringify(customData), business.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Showcase features & photos synchronized successfully!',
      whatsapp_showcase: customData.whatsapp_showcase,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save showcase' }, { status: 500 });
  }
}
