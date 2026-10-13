import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const TEMPLATES_CONFIG_KEY = 'whatsapp_message_templates';

export interface WhatsAppTemplateItem {
  id: string;
  name: string;
  categoryKey: string; // 'transport' | 'safari' | 'wellness' | 'tour_operator' | 'hotel' | 'dining' | 'crafts' | 'general'
  parentTypeId?: string; // e.g. 'logistics', 'adventure', 'wellness', 'accommodation', 'food', 'crafts'
  childTypeId?: string;  // e.g. 'tuk_tuk', '4x4_safari', 'sand_bath', etc.
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
  // 1. LOGISTICS & TRANSPORT -> Tuk-Tuk
  {
    id: 'transport_tuktuk_welcome',
    name: '🛺 سائقي التوك توك (ترحيب وتفعيل فوري)',
    categoryKey: 'transport',
    parentTypeId: 'logistics',
    childTypeId: 'tuk_tuk',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة اعتماد كباتن التوك توك في واحة سيوة',
    titleEn: 'Tuk-Tuk Captain Official Digital Card & Booking',
    contentAr: `أهلاً وسهلاً بيك يا كابتن *{name}*! 🛺🌴✨\nمعاك *جنا* من منصة *SiWiFy.com*، وبحب أقولك إننا جهزنالك كارت وصفحة شخصية مجانية تماماً ليك ولمركبتك في سيوة:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *خدماتك المجانية المتاحة فوراً على تليفونك:*\n1️⃣ موقعك وكارتك للحجز المباشر (مكسبك كامل في جيبك 0% عمولة): {minisiteUrl}\n2️⃣ تطبيق خفيف على موبايلك لمتابعة مشاويرك وأسعارك: {mobileDashboardUrl}\n3️⃣ صانع فيديوهات وستوري واتساب باسمك: {socialToolkitUrl}\n\n🔑 *لتأكيد اسمك واستلام صفحتك مجاناً:*\n👉 {claimUrl}\n\nلو محتاج أي مساعدة، رد عليا هنا وأنا معاك خطوة بخطوة يا كابتن! 🌿🤝`,
    contentEn: `Welcome Captain *{name}*! 🛺🌴✨\nThis is *Jana* from *SiWiFy.com*.\nWe built a 100% free digital card & booking minisite for you in Siwa:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Your Free Tools:*\n1️⃣ Direct Booking Card (0% Commission): {minisiteUrl}\n2️⃣ Mobile Command App: {mobileDashboardUrl}\n3️⃣ Video Reels & WhatsApp Story Maker: {socialToolkitUrl}\n\n🔑 *Claim your page for free:*\n👉 {claimUrl}\n\nReply here if you need any help! 🌿🤝`,
    includedFeatures: ['توك توك مرخص ونظيف', 'سائق سيوي محلي معتمد', 'جولات بحيرات الملح وغروب الفطناس', 'حجز مباشر بدون عمولة'],
  },

  // 2. LOGISTICS & TRANSPORT -> Airport & Long-Range Transfers
  {
    id: 'transport_transfers_welcome',
    name: '🚐 سيارات النقل والمطارات والليموزين',
    categoryKey: 'transport',
    parentTypeId: 'logistics',
    childTypeId: 'airport_transfer',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'اعتماد خدمات الليموزين والنقل السياحي للمطارات',
    titleEn: 'Airport & Long-Range Chauffeur Transfers Onboarding',
    contentAr: `مرحباً بك يا كابتن *{name}*! 🚐✨\nمعاك *جنا* من منصة *SiWiFy.com*، ويسرنا إبلاغك باعتماد وتوثيق سيارتك لخدمات النقل والليموزين في سيوة:\n🏷️ *{parentType} ➔ {childType}*\n\n📌 *المزايا المتاحة لك مجاناً وفورياً:* \n1️⃣ موقعك المصغر لتلقي حجوزات النقل المباشر من القاهرة والإسكندرية ومطروح (عمولة 0%): {minisiteUrl}\n2️⃣ تطبيق موبايل سهل لتحديث أسعار المشاوير والمسارات في أي وقت: {mobileDashboardUrl}\n3️⃣ صانع فيديوهات ريلز باسمك ولوجو خدمتك: {socialToolkitUrl}\n\n🔑 *لتأكيد بياناتك واستلام لوحة تحكمك مجاناً:* \n👉 {claimUrl}\n\nنتشرف بوجودك شريك نقل معتمد وموثوق لزوار سيوة! 🌿🤝`,
    contentEn: `Welcome Captain *{name}*! 🚐✨\nYour passenger transfer service is verified on *SiWiFy.com*:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Included Free:*\n1️⃣ Direct Booking Minisite: {minisiteUrl}\n2️⃣ Rates & Trips Mobile App: {mobileDashboardUrl}\n3️⃣ Social Reels Maker: {socialToolkitUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['توصيل مطار القاهرة والإسكندرية', 'سيارات مكيفة ومريحة', 'سائقين محترفين ومعتمدين', 'حجز مسبق مع التزام بالمواعيد'],
  },

  // 3. ADVENTURE & SAFARI -> 4x4 Great Sand Sea
  {
    id: 'adventure_safari_welcome',
    name: '🚙 كباتن سفاري 4x4 وبحر الرمال الأعظم',
    categoryKey: 'safari',
    parentTypeId: 'adventure',
    childTypeId: 'safari_4x4',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة ترحيب واعتماد كباتن سفاري 4x4 وبحر الرمال',
    titleEn: 'Desert 4x4 Safari & Sand Sea Onboarding',
    contentAr: `يا هلا بكابتن الصحراء والمغامرة *{name}*! 🚙🏜️✨\nمعاك *جنا* من منصة *SiWiFy.com*، ويسعدنا إعلامك باعتماد وتوثيق نشاطك وسيارات الدفع الرباعي في دليل سيوة للمغامرات:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *أدواتك المجانية الجاهزة فوراً لزيادة رحلاتك:*\n1️⃣ صفحة احترافية وموقع لعرض أسطول سياراتك وبرامج السفاري (حجز مباشر 0% عمولة): {minisiteUrl}\n2️⃣ تطبيق خفيف على تليفونك لمتابعة المواعيد ومجموعات السفاري: {mobileDashboardUrl}\n3️⃣ صانع فيديوهات ريلز وستوري لدروب الرمال وبئر واحد والغروب: {socialToolkitUrl}\n\n🔑 *لتأكيد اعتماد نشاطك وتفعيل صفحتك مجاناً:*\n👉 {claimUrl}\n\nجاهزين نملأ جدول رحلاتك وموسمك بأجمل ضيوف! رد عليا لو حابب تضيف صور سياراتك فوراً ⛺🌄`,
    contentEn: `Welcome Desert Captain *{name}*! 🚙🏜️✨\nYour 4x4 Desert Safari is verified on *SiWiFy.com*:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Free Included Tools:*\n1️⃣ Safari Minisite: {minisiteUrl}\n2️⃣ Mobile Trips Hub: {mobileDashboardUrl}\n3️⃣ Desert Reels Maker: {socialToolkitUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['دفع رباعي لاندكروزر مجهز', 'سفاري بحر الرمال والتزلج على الرمال', 'استراحة بئر المياه الساخنة وشاي بدوي', 'تصاريح الصحراء ودليل خبير'],
  },

  // 4. WELLNESS & HEALING -> Salt Lakes, Sand Baths & Sulfur Springs
  {
    id: 'wellness_healing_welcome',
    name: '🌿 مراكز الاستشفاء والعافية وبحيرات الملح',
    categoryKey: 'wellness',
    parentTypeId: 'wellness',
    childTypeId: 'sand_bath',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'اعتماد مراكز السياحة العلاجية والاستشفاء الطبيعي',
    titleEn: 'Health & Wellness Healing Centers Onboarding',
    contentAr: `مرحباً بإدارة وأطباء مركز *{name}* للاستشفاء والعافية! 🌿✨\nمعاكم *جنا* من منصة *SiWiFy.com*، ويسرنا إعلامكم بتوثيق مركزكم في دليل سيوة الرسمي للسياحة العلاجية والاستشفاء البيئي:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *خدماتكم الرقمية المتاحة مجاناً 100%:*\n1️⃣ صفحة حجز رسمية متخصصة لبرامج الاستشفاء وجلسات الطفو وحمامات الرمال (0% عمولة): {minisiteUrl}\n2️⃣ تطبيق موبايل لإدارة الحجوزات والمواعيد واستقبال طلبات الزوار: {mobileDashboardUrl}\n3️⃣ صانع فيديوهات تثقيفية وريلز عن فوائد ملح سيوة وعيون الكبريت: {socialToolkitUrl}\n\n🔑 *لتأكيد وتفعيل ملف المركز رسمياً:*\n👉 {claimUrl}\n\nنتشرف بالتعاون معكم لتقديم أرقى تجربة استشفائية لزوار الواحة من مصر ومختلف دول العالم! 💆‍♂️💧`,
    contentEn: `Welcome *{name}* to Siwa Oasis Healing Hub! 🌿✨\nYour wellness center is verified on *SiWiFy.com*:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Free Tools:*\n1️⃣ Direct Healing Minisite: {minisiteUrl}\n2️⃣ Mobile Command Dashboard: {mobileDashboardUrl}\n3️⃣ Wellness Reels Maker: {socialToolkitUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['جلسات طفو ببحيرات الملح الصخري', 'حمامات رمال جبل الدكرور الساخنة', 'عيون كبريتية طبيعية دافئة', 'مساج عضوي بزيت الزيتون السيوي'],
  },

  // 5. ACCOMMODATION -> Eco-Lodges, Camps & Authentic Hotels
  {
    id: 'accommodation_ecolodge_welcome',
    name: '🏨 الإيكولودج والفنادق والمخيمات البيئية',
    categoryKey: 'hotel',
    parentTypeId: 'accommodation',
    childTypeId: 'glamping_tent',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة اعتماد وتوثيق الفنادق والإيكولودج والمخيمات',
    titleEn: 'Eco-Lodges, Camps & Hotels Official Onboarding',
    contentAr: `تحياتنا لإدارة وضيافة *{name}* في واحة سيوة الساحرة! 🏨🌴✨\nمعاكم *جنا* من منصة *SiWiFy.com*، ويسعدنا توثيق واعتماد منشأتكم الفندقية في دليل إقامات سيوة المعتمد:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *باقة الأدوات الرقمية المجانية لمنشأتكم:*\n1️⃣ موقع مصغر احترافي لعرض الغرف والمخيمات واستقبال الحجوزات المباشرة بدون وسيط وبدون عمولة (0%): {minisiteUrl}\n2️⃣ لوحة تحكم موبايل لتحديث أسعار المواسم والصور وتوفر الغرف: {mobileDashboardUrl}\n3️⃣ صانع فيديوهات ريلز وستوري إنستغرام وتيك توك بهوية الفندق: {socialToolkitUrl}\n\n🔑 *لتأكيد ملكية المنشأة واستلام لوحة التحكم مجاناً:*\n👉 {claimUrl}\n\nنتمنى لكم موسماً سياحياً استثنائياً ونحن في خدمتكم دائماً! 🌿⭐`,
    contentEn: `Welcome *{name}* to Siwa Accommodations Directory! 🏨🌴✨\nYour lodge is verified on *SiWiFy.com*:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Free Tools:*\n1️⃣ Direct Booking Minisite (0% Commission): {minisiteUrl}\n2️⃣ Mobile Room Inventory App: {mobileDashboardUrl}\n3️⃣ Branded Reels Maker: {socialToolkitUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['عمارة كرجيف سيوية أصلية', 'إطلالات طبيعية على النخيل والجبل', 'إفطار سيوي طازج مشمول', 'غرف مجهزة ومكيفة بخدمات فندقية'],
  },

  // 6. FOOD & BEVERAGE -> Authentic Siwan Restaurants & Bedouin Dinners
  {
    id: 'food_dining_welcome',
    name: '🍲 المطاعم وجلسات العشاء البدوي (أبو مردم)',
    categoryKey: 'dining',
    parentTypeId: 'food',
    childTypeId: 'desert_dining_event',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'اعتماد مطاعم وجلسات المطبخ السيوي والبدوي',
    titleEn: 'Siwan Restaurants & Bedouin Camp Dining Onboarding',
    contentAr: `مرحباً بأصحاب الضيافة والنكهة الأصيلة في مطعم/جلسات *{name}*! 🍲🕯️✨\nمعاكم *جنا* من منصة *SiWiFy.com*، وبحب أبلغكم بتوثيق مطعمكم ومطبخكم في دليل الأكلات السيوية والبدوية:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *مزاياكم المجانية الفورية لجذب الضيوف:*\n1️⃣ منيو وموقع مصغر لعرض أكلات أبو مردم والطواجن وحجز الطاولات مباشرة (0% عمولة): {minisiteUrl}\n2️⃣ لوحة تحكم لتعديل أوقات العمل وأرقام الدليفري وأسعار الوجبات: {mobileDashboardUrl}\n3️⃣ صانع فيديوهات وريلز شهية ومغرية لأطباقكم السيوية: {socialToolkitUrl}\n\n🔑 *لتأكيد واستلام صفحة مطعمكم مجاناً:*\n👉 {claimUrl}\n\nألف هنا وشفا، ومتشوقين نوجّه كل زوار سيوة لمائدتكم العامرة! 🌿🔥`,
    contentEn: `Welcome *{name}* to Siwa Dining Guide! 🍲🌴✨\nYour restaurant is verified on *SiWiFy.com*:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Free Tools:*\n1️⃣ Menu & Table Booking Minisite: {minisiteUrl}\n2️⃣ Mobile Store Dashboard: {mobileDashboardUrl}\n3️⃣ Food Video Creator: {socialToolkitUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['طواجن سيوية ومشاوي على الحطب', 'جلسات نخيل بدوية ساحرة', 'مكونات عضوية طازجة من مزارع سيوة', 'ضيافة شاي لويزة وتمور فاخرة'],
  },

  // 7. CRAFTS & TRADING -> Siwan Dates, Olive Oil, Salt Lamps & Handmade Heritage
  {
    id: 'crafts_trade_welcome',
    name: '🏺 التمور وزيت الزيتون وأباجورات الملح والحرف',
    categoryKey: 'crafts',
    parentTypeId: 'crafts',
    childTypeId: 'date_olive',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة ترحيب بمصنعي وتجار خيرات ومنتجات سيوة',
    titleEn: 'Siwa Dates, Organic Olive Oil & Salt Crafts Onboarding',
    contentAr: `مرحباً بكم في متجر ومصنع *{name}* لخيرات ومنتجات واحة سيوة! 🏺🌴✨\nمعاكم *جنا* من منصة *SiWiFy.com*، ويسعدنا توثيق متجركم في دليل المنتجات التراثية والطبيعية الرسمي:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *أدواتكم المجانية لتسويق منتجاتكم للزوار والشحن للمحافظات:*\n1️⃣ كتالوج وموقع رقمي لعرض منتجات التمور السيوية، زيت الزيتون البكر، وأباجورات الملح (0% عمولة): {minisiteUrl}\n2️⃣ تطبيق موبايل لإضافة المنتجات، الأسعار، وعروض المواسم: {mobileDashboardUrl}\n3️⃣ صانع فيديوهات ريلز تسويقية احترافية لمنتجاتكم: {socialToolkitUrl}\n\n🔑 *لتأكيد ملكية المتجر وتفعيل الكتالوج مجاناً:*\n👉 {claimUrl}\n\nفخورون بخيرات أرض سيوة ونعمل معكم لتوصيلها لكل زائر ومحب للواحة! 🌿📦`,
    contentEn: `Welcome *{name}* to Siwa Heritage & Organic Products! 🏺🌴✨\nYour shop is verified on *SiWiFy.com*:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Free Tools:*\n1️⃣ Product Catalog Minisite: {minisiteUrl}\n2️⃣ Mobile Inventory Dashboard: {mobileDashboardUrl}\n3️⃣ Social Video Reels Maker: {socialToolkitUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['زيت زيتون سيوي عضوي معصور على البارد', 'تمور سيوية فاخرة نصف جافة ورطب', 'أباجورات وتحف ملح صخري أصلي', 'مشغولات يدوية وفضيات تراثية سيوية'],
  },

  // 8. TOUR OPERATORS -> Integrated Itineraries & Ground Logistics
  {
    id: 'tour_operator_onboarding',
    name: '🗺️ منظمي وشركات الرحلات والبرامج المتكاملة',
    categoryKey: 'tour_operator',
    parentTypeId: 'adventure',
    childTypeId: 'tour_operator',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'اعتماد شركات ومنظمي البرامج والرحلات الشاملة',
    titleEn: 'Tour Operators & Group Travel Programs Onboarding',
    contentAr: `مرحباً بشركة ومنظم رحلات *{name}* في واحة سيوة! 🗺️✨\nمعاكم *جنا* من منصة *SiWiFy.com*، وتم توثيق واعتماد نشاطكم لتنظيم البرامج والرحلات السياحية المتكاملة:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *مزاياكم الرقمية المتاحة لكم فوراً:*\n1️⃣ موقعكم المصغر لعرض باقات الرحلات والبرامج الشاملة (سفاري + إقامة + مزارات) بدون أي عمولة (0%): {minisiteUrl}\n2️⃣ لوحة تحكم موبايل لمتابعة البرامج وتحديث تفاصيل الباقات: {mobileDashboardUrl}\n3️⃣ صانع ريلز وفيديوهات ترويجية للرحلات الجماعية وبرامج الشركات: {socialToolkitUrl}\n\n🔑 *لتأكيد الحساب والاعتماد الرسمي:*\n👉 {claimUrl}\n\nنتمنى لكم مواسم زاخرة وأفواجاً سعيدة برحلاتكم في سيوة! 🌿🤝`,
    contentEn: `Welcome *{name}* to Siwa Oasis Tour Operations! 🗺️✨\nYour agency is verified on *SiWiFy.com*:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Free Tools:*\n1️⃣ Multi-Day Itinerary Minisite: {minisiteUrl}\n2️⃣ Mobile Program Dashboard: {mobileDashboardUrl}\n3️⃣ Tour Reels Creator: {socialToolkitUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['برامج سياحية متكاملة (سفاري + إقامة + مزارات)', 'تنظيم رحلات المجموعات والشركات', 'مرشدين محليين سيويين معتمدين', 'استخراج تصاريح الصحراء والدعم الميداني'],
  },

  // 9. ARTS, CULTURE & LOCAL GUIDES -> Authentic Siwan Guides & Heritage
  {
    id: 'guides_heritage_welcome',
    name: '🧭 المرشدين المحليين ورواة التراث السيوي',
    categoryKey: 'general',
    parentTypeId: 'arts_culture',
    childTypeId: 'local_guide_service',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'رسالة اعتماد المرشدين المحليين وحراس تراث الواحة',
    titleEn: 'Siwan Cultural Guides & Storytellers Onboarding',
    contentAr: `مرحباً بك يا أستاذ/كابتن *{name}*! 🧭🏛️✨\nمعاك *جنا* من منصة *SiWiFy.com*، وبحب أقولك إننا وثقنا خدمتك كمرشد ومرافق ثقافي معتمد لزوار سيوة:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *خدماتك المجانية المتاحة فوراً:*\n1️⃣ كارت وموقع شخصي لعرض مساراتك التاريخية لجبل الموتى وشالي ومعبد آمون (0% عمولة): {minisiteUrl}\n2️⃣ تطبيق موبايل لإدارة مواعيد الجولات واستقبال السياح مباشرة: {mobileDashboardUrl}\n3️⃣ صانع فيديوهات وقصص تراثية باسمك لإنستغرام وتيك توك: {socialToolkitUrl}\n\n🔑 *لتأكيد واستلام كارتك الشخصي مجاناً:*\n👉 {claimUrl}\n\nأنت صوت سيوة وتاريخها، ويسعدنا أن تكون في صدارة استقبال الضيوف! 🌿📜`,
    contentEn: `Welcome Guide *{name}*! 🧭🏛️✨\nYour cultural guiding service is verified on *SiWiFy.com*:\n🏷️ *{parentType} ➔ {childType}*\n\n🎁 *Free Tools:*\n1️⃣ Direct Guide Minisite: {minisiteUrl}\n2️⃣ Mobile Schedule App: {mobileDashboardUrl}\n3️⃣ Heritage Story Reels Maker: {socialToolkitUrl}\n\n🔑 Claim profile: {claimUrl}`,
    includedFeatures: ['مرشد محلي سيوي معتمد', 'معرفة عميقة بتاريخ شالي والآثار', 'جولات مشي ثقافية مخصصة', 'إتقان اللغات الأجنبية واللغة السيوية'],
  },

  // 10. CLIENT / TOURIST SHOWCASE PITCH
  {
    id: 'client_showcase_general',
    name: '🌟 بطاقة عرض الخدمة للزبائن والسياح',
    categoryKey: 'general',
    targetAudience: 'tourist_client',
    isHidden: false,
    titleAr: 'بطاقة عرض موثوقة ومباشرة للزبائن والسياح (0% عمولة)',
    titleEn: 'Direct Tourist Showcase & 0% Commission Booking Pitch',
    contentAr: `🌴 مرحباً بك في واحة سيوة الساحرة! ✨\n\nنقدم لك خدمة موثوقة ومعتمدة مباشرة مع: *{name}*\n🏷️ *{parentType} ➔ {childType}*\n\n📸 *معرض الصور والمركبة / الخدمة:*\n{photoLinks}\n\n✨ *المميزات والخدمات المشمولة:*\n{featureList}\n\n🌐 *للتفاصيل والاتصال والحجز المباشر (مكسبك 0% عمولة وسيطة):*\n{minisiteUrl}\n\nنتمنى لكم أوقاتاً ساحرة وتجربة لا تُنسى في سيوة! 🌿☀️`,
    contentEn: `🌴 Welcome to Magical Siwa Oasis! ✨\n\nHere is verified direct service details for: *{name}*\n🏷️ *{parentType} ➔ {childType}*\n\n📸 *Showcase & Photos:*\n{photoLinks}\n\n✨ *Included Features:*\n{featureList}\n\n🌐 *Direct Minisite (0% Commission):*\n{minisiteUrl}\n\nHave an unforgettable journey in Siwa! 🌿☀️`,
    includedFeatures: ['شريك معتمد وموثق على SiWiFy.com', 'حجز وتواصل مباشر 100% بدون وسيط', 'أسعار واضحة وعادلة', 'دعم محلي في واحة سيوة'],
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
