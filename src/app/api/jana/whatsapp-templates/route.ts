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
  // ── SPECIAL OUTREACH WORKFLOW CATEGORIES ─────────────────────────────────
  // 1. Minisite Prepared by Admin -> Accept & Mobile PWA Home Screen
  {
    id: 'minisite_ready_pwa_onboarding',
    name: '📱 1. تم تجهيز موقعك بالكامل — تفعيل وتثبيت على الشاشة الرئيسية (PWA)',
    categoryKey: 'minisite_ready',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'موقعك وتطبيقك جاهزان — تفعيل وتثبيت على الشاشة الرئيسية',
    titleEn: 'Your Minisite & Mobile App Are Ready — Instant Activation & Home Screen Setup',
    contentAr: `أهلاً وسهلاً بك يا غالي في *{name}*! 🌴✨
معك *جنا* من إدارة الشركاء في منصة *SiWiFy.com* (دليل سياحة وضيافة واحة سيوة).

🎉 *بشرى سارة: قمنا بتجهيز موقعك وكارتك الرقمي المتكامل نيابةً عنك بالكامل!*
🏷️ التصنيف المعتمد: *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🚀 *خطوات استلام موقعك وتشغيله على موبايلك في دقيقة واحدة:*
━━━━━━━━━━━━━━━━━━

1️⃣ *معاينة موقعك للحجز المباشر (عمولة 0%):*
🌐 {minisiteUrl}
• مكسبك بالكامل في جيبك مباشرة من الزوار بدون أي استقطاعات.

2️⃣ *قبول الشروط واعتماد حسابك فوراً:*
👉 {claimUrl}
• بمجرد الضغط والموافقة، يُفعّل حسابك وتصبح صفحتك مرئية رسمياً لجميع زوار سيوة.

3️⃣ *تشغيل التطبيق وتثبيته على شاشة موبايلك الرئيسية:*
📲 {mobileDashboardUrl}
💡 *طريقة التثبيت السهلة (Install to Home Screen):*
• افتح الرابط في متصفح موبايلك (Chrome أو Safari).
• اضغط على خيارات المتصفح (الثلاث نقاط أو زر المشاركة ⬆️).
• اختر *"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)*.
• سيظهر لك أيقونة تطبيق خاصة باسمك لمتابعة الحجوزات والأسعار مباشرة كأي تطبيق أصلي!

لو واجهتك أي صعوبة، أرسل لي رسالة هنا وسأقوم بمساعدتك فوراً! 🌿🤝`,
    contentEn: `Welcome *{name}*! 🌴✨
This is *Jana* from the Partner Success Team at *SiWiFy.com*.

🎉 *Great news: We have prepared your complete verified digital card & minisite for you!*
🏷️ Category: *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🚀 *Your 3 Simple Steps to Launch on Your Mobile:*
━━━━━━━━━━━━━━━━━━

1️⃣ *Preview your direct booking minisite (0% Commission):*
🌐 {minisiteUrl}

2️⃣ *Accept regulations and activate your verified profile:*
👉 {claimUrl}

3️⃣ *Add your Dashboard to your Mobile Home Screen:*
📲 {mobileDashboardUrl}
💡 *Quick Setup (PWA):*
• Open the link on Chrome / Safari.
• Tap browser options (3 dots or Share icon ⬆️).
• Tap *"Add to Home Screen"*.
• You'll have an app icon right on your phone screen to manage bookings anytime!

Reply here if you need any assistance — we're here for you! 🌿🤝`,
    includedFeatures: ['موقع كامل مجهز مسبقاً', 'تطبيق ويب تقدمي PWA', 'تثبيت على الشاشة الرئيسية', 'عمولة 0%'],
  },

  // 2. Fast Step-by-Step Self Registration
  {
    id: 'quick_self_registration_steps',
    name: '⚡ 2. تسجيل فوري وتفعيل حسابك بنفسك (خطوات سريعة)',
    categoryKey: 'quick_register',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'سجّل نشاطك بنفسك في خطوات سريعة ومجانية',
    titleEn: 'Quick Step-by-Step Registration Guide for Siwa Partners',
    contentAr: `مرحباً بك صاحب نشاط *{name}*! 🌴✨
معك *جنا* من منصة *SiWiFy.com*.

ندعوك للانضمام مجاناً إلى شبكة شركاء سيوة الرسمية لزيادة حجوزاتك ومبيعاتك في الموسم الحالي!

━━━━━━━━━━━━━━━━━━
⚡ *خطوات سريعة للتسجيل والتوثيق بنفسك (أقل من دقيقتين):*
━━━━━━━━━━━━━━━━━━

1️⃣ *ابدأ التسجيل وتأكيد هويتك:*
👉 {claimUrl}
• اكتب رقم تليفونك وكلمة سر من اختيارك لتأمين حسابك.

2️⃣ *استلم صفحتك وكارت الحجز المباشر فوراً:*
🌐 {minisiteUrl}
• يمكنك إرسال هذا الرابط لزبائنك على واتساب وإنستجرام للحجز المباشر.

3️⃣ *تحكم في خدماتك وأسعارك من تليفونك:*
📲 {mobileDashboardUrl}
• أدخل صورك وعدّل أسعارك وعروضك في أي لحظة.

سجّل الآن قبل اكتمال مقاعد الفئة المجانية في منطقتك! 🚀`,
    contentEn: `Welcome *{name}*! 🌴✨
Join the verified Siwa tourism directory on *SiWiFy.com* to multiply your direct bookings with zero commissions!

━━━━━━━━━━━━━━━━━━
⚡ *Fast Steps to Register & Claim (Under 2 Minutes):*
━━━━━━━━━━━━━━━━━━

1️⃣ *Claim your account:*
👉 {claimUrl}

2️⃣ *Share your direct booking link:*
🌐 {minisiteUrl}

3️⃣ *Manage from your mobile:*
📲 {mobileDashboardUrl}

We are excited to have you with us! 🌿☀️`,
    includedFeatures: ['تسجيل مباشر وفوري', 'لوحة تحكم للموبايل', '0% عمولة', 'دعم فني مباشر'],
  },

  // 3. Follow-up & Reminder
  {
    id: 'crm_followup_reminder',
    name: '⏰ 3. تذكير ومتابعة الشركاء (Follow-Up & Activation Reminder)',
    categoryKey: 'followup',
    targetAudience: 'inactive_reactivation',
    isHidden: false,
    titleAr: 'تذكير بموقعك وتطبيقك الجاهز للاستلام على SiWiFy',
    titleEn: 'Friendly Follow-Up: Your Minisite & Mobile App Are Awaiting You',
    contentAr: `أهلاً بك مجدداً *{name}*! 🌴✨
معك *جنا* من منصة *SiWiFy.com*.

نود تذكيرك بأن موقعك الرقمي وتطبيق الموبايل الخاص بنشاطك:
🏷️ *{parentType} ➔ {childType}*
جاهز تماماً بانتظار تفعيلك لتبدأ في استقبال طلبات الحجز المباشرة من سياح الواحة.

━━━━━━━━━━━━━━━━━━
🔑 *رابط التفعيل السريع واستلام الحساب:*
👉 {claimUrl}

📱 *معاينة صفحتك وتطبيقك:*
🌐 {minisiteUrl}
📲 {mobileDashboardUrl}

هل واجهتك أي مشكلة أثناء محاولة الدخول؟ رد عليّ في أي وقت وسأساعدك فوراً! 🌿🤝`,
    contentEn: `Hello again *{name}*! 🌴✨
This is *Jana* from *SiWiFy.com*.

A friendly reminder that your verified minisite & mobile dashboard under *{parentType} ➔ {childType}* is waiting for your activation:

👉 *Activate Now:* {claimUrl}
🌐 *Preview Minisite:* {minisiteUrl}

Let us know if you need any help getting set up! 🌿🤝`,
    includedFeatures: ['تذكير بالموقع المجهز', 'متابعة دورية', 'دعم فني فوري'],
  },

  // 1. LOGISTICS & TRANSPORT -> Tuk-Tuk
  {
    id: 'transport_tuktuk_welcome',
    name: '🛺 كباتن التوك توك (شرح المزايا وأهميتها)',
    categoryKey: 'transport',
    parentTypeId: 'logistics',
    childTypeId: 'tuk_tuk',
    targetAudience: 'new_unclaimed',
    isHidden: false,
    titleAr: 'اعتماد رسمي ومزايا كباتن التوك توك في سيوة',
    titleEn: 'Tuk-Tuk Captain Official Digital Card & Benefits',
    contentAr: `أهلاً وسهلاً بيك يا كابتن *{name}*! 🛺🌴✨
معاك *جنا* من إدارة الشركاء في *SiWiFy.com* (المنصة الرقمية الأولى لدليل وسياحة واحة سيوة).

يسعدنا إبلاغك باعتماد وتوثيق مركبتك رسمياً في دليل الواحة تحت تصنيف:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *مزايا برنامجك المجاني ولماذا هي مهمة جداً لزيادة دخلك؟*
━━━━━━━━━━━━━━━━━━

1️⃣ *موقعك وكارتك الرقمي للحجز المباشر (عمولة 0%):*
🔗 {minisiteUrl}
💡 *ليه دي مهمة ليك؟* لأن السائح أو الفندق لما يطلب توك توك مش محتاج وسيط ياخد منك نسبة! الرابط ده بتبعته لأي زبون على واتساب يشوف صورتك ورقمك وأسعارك ويحجز معاك فوراً، ومكسبك كامل في جيبك 100%.

2️⃣ *تطبيق خفيف على تليفونك لمتابعة مشاويرك وأسعارك:*
📲 {mobileDashboardUrl}
💡 *ليه دي مهمة ليك؟* تقدر من موبايلك في أي دقيقة تغيّر أسعار مشاوير بحيرات الملح أو فطناس، وتكتب مواعيد عملك بدون ما ترجع لحد.

3️⃣ *صانع فيديوهات واستوري واتساب احترافي باسمك:*
🎬 {socialToolkitUrl}
💡 *ليه دي مهمة ليك؟* بضغطة زر واحدة يصمملك فيديو ريلز واستوري باسمك ورقمك ترفعه على واتساب وتيك توك وتجيب لنفسك زباين جدد طول الموسم.

━━━━━━━━━━━━━━━━━━
🔑 *لتأكيد هويتك واستلام موقعك وتطبيقك مجاناً:*
👉 {claimUrl}

لو عندك أي استفسار أو محتاج مساعدة، رد عليا على نفس المحادثة دي وأنا في خدمتك خطوة بخطوة يا كابتن! 🌿🤝
*فريق نجاح الشركاء — SiWiFy.com*`,
    contentEn: `Welcome Captain *{name}*! 🛺🌴✨
This is *Jana* from *SiWiFy.com* (The Official Siwa Oasis Digital Platform).

Your tuk-tuk is officially verified under:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *Why your free tools are important for your business:*
━━━━━━━━━━━━━━━━━━
1️⃣ Direct Booking Minisite (0% Commission): {minisiteUrl}
• Why it matters: Guests book you directly with 0% middleman fees; keep 100% of your earnings.
2️⃣ Mobile Trips Dashboard: {mobileDashboardUrl}
• Why it matters: Update your tour rates and availability directly from your phone in seconds.
3️⃣ Branded Video Reels & WhatsApp Story Creator: {socialToolkitUrl}
• Why it matters: Promote your rides on TikTok & Instagram with your name & number in 1 click.

🔑 *Claim your official profile for free:*
👉 {claimUrl}

Reply here anytime — we're here to help you grow! 🌿🤝
*Partner Success Team — SiWiFy.com*`,
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
    titleAr: 'اعتماد خدمات الليموزين والنقل السياحي للمطارات (شرح المزايا)',
    titleEn: 'Airport & Long-Range Chauffeur Transfers Onboarding',
    contentAr: `مرحباً بك يا كابتن *{name}*! 🚐✨
معاك *جنا* من إدارة الشركاء في *SiWiFy.com* (دليل سياحة وانتقالات واحة سيوة).

يسرنا إبلاغك باعتماد وتوثيق سيارتك لخدمات النقل والليموزين رسمياً في دليل الواحة:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *مزايا برنامجك المجاني ولماذا هي مهمة جداً لزيادة دخلك؟*
━━━━━━━━━━━━━━━━━━

1️⃣ *موقعك المصغر لتلقي حجوزات النقل المباشر من المطارات (عمولة 0%):*
🔗 {minisiteUrl}
💡 *ليه دي مهمة ليك؟* مشاوير المطارات (القاهرة، الإسكندرية، برج العرب، مطروح) مبالغها كبيرة، والشركات والوسطاء بياخدوا منك 15% إلى 20%. مع موقعك على SiWiFy، المسافر أو الفندق بيحجز معاك مباشرة ومكسب المشوار كاملاً ليك بدون أي استقطاع.

2️⃣ *لوحة تحكم خفيفة على هاتفك لتعديل أسعار المسارات:*
📲 {mobileDashboardUrl}
💡 *ليه دي مهمة ليك؟* ترفع أسعار الذهاب والعودة، وتحدد نوع السيارة (ملاكي، هاي إس، باص سياحي)، وتغلق أو تفتح حجوزاتك حسب جدول سفرك بلمسة واحدة.

3️⃣ *صانع فيديوهات تسويقية واستوري واتساب باسمك ورقمك:*
🎬 {socialToolkitUrl}
💡 *ليه دي مهمة ليك؟* ينتج لك فيديوهات احترافية تظهر نظافة سيارتك والتزامك بالمواعيد وتكييف السيارة، لتبني ثقة فورية مع العائلات والمسافرين الأجانب.

━━━━━━━━━━━━━━━━━━
🔑 *لتأكيد بياناتك وتفعيل موقعك وتطبيقك مجاناً:*
👉 {claimUrl}

لو عندك أي استفسار، ردي عليا مباشرة على هذه المحادثة! 🌿🤝
*فريق نجاح الشركاء — SiWiFy.com*`,
    contentEn: `Welcome Captain *{name}*! 🚐✨
This is *Jana* from *SiWiFy.com* (Official Siwa Oasis Platform).

Your passenger transfer service is verified under:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *Why your free tools are vital for your transfer business:*
━━━━━━━━━━━━━━━━━━
1️⃣ Direct Airport Transfers Minisite (0% Commission): {minisiteUrl}
• Why it matters: Airport trips (Cairo, Alex, Borg El Arab) are high value. Save 15-20% broker fees and keep 100% directly.
2️⃣ Mobile Route & Price Manager: {mobileDashboardUrl}
• Why it matters: Update your rates per route and set vehicle availability instantly from your phone.
3️⃣ Branded Chauffeur Reels Maker: {socialToolkitUrl}
• Why it matters: Showcase your vehicle comfort and cleanliness to gain client trust instantly.

🔑 *Claim your official profile for free:*
👉 {claimUrl}

*Partner Success Team — SiWiFy.com*`,
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
    titleAr: 'اعتماد كباتن سفاري 4x4 وبحر الرمال (شرح المزايا)',
    titleEn: 'Desert 4x4 Safari & Sand Sea Onboarding',
    contentAr: `يا هلا بكابتن الصحراء والمغامرة *{name}*! 🚙🏜️✨
معاك *جنا* من إدارة المغامرات في *SiWiFy.com* (منصة سياحة واحة سيوة الأولى).

يسعدنا إعلامك باعتماد وتوثيق نشاطك وسيارات الدفع الرباعي رسمياً في دليل مغامرات سيوة:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *مزايا برنامجك المجاني ولماذا هي مهمة جداً لزيادة رحلاتك؟*
━━━━━━━━━━━━━━━━━━

1️⃣ *موقعك الرقمي المباشر لحجز رحلات السفاري (عمولة 0%):*
🔗 {minisiteUrl}
💡 *ليه دي مهمة ليك؟* رحلات بحر الرمال وبئر واحد والبحيرة الباردة هي العمود الفقري لسياحة سيوة! موقعك يعرض صور سياراتك والبرامج بوضوح، والسياح والفنادق يحجزون معك مباشرة بدون وسيط يقتطع من تعبك.

2️⃣ *تطبيق موبايل خفيف لإدارة جدول رحلاتك ومجموعاتك:*
📲 {mobileDashboardUrl}
💡 *ليه دي مهمة ليك؟* تتحكم في أسعار باقات السفاري (شاملة العشاء والتزلج أو الجولة السريعة)، وتحدد الأيام المتاحة والمحجوزة بسهولة وأنت في قلب الواحة.

3️⃣ *صانع فيديوهات ريلز وستوري سينمائية لدروب الرمال:*
🎬 {socialToolkitUrl}
💡 *ليه دي مهمة ليك؟* يصنع لك فيديوهات درامية للتزلج على الرمال والمشاهد البانورامية باسمك ورقمك ترفعها على تيك توك وإنستغرام لتجذب أفواجاً جديدة باستمرار.

━━━━━━━━━━━━━━━━━━
🔑 *لتأكيد اعتماد نشاطك وتفعيل صفحتك مجاناً:*
👉 {claimUrl}

جاهزون لملء جدول رحلاتك بأجمل ضيوف! ردي عليا لو حابب تضيف صور سياراتك فوراً ⛺🌄
*فريق نجاح الشركاء — SiWiFy.com*`,
    contentEn: `Welcome Desert Captain *{name}*! 🚙🏜️✨
This is *Jana* from *SiWiFy.com* (Official Siwa Oasis Platform).

Your 4x4 Desert Safari is officially verified under:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *Why your free tools are vital for your safari business:*
━━━━━━━━━━━
1️⃣ Safari Minisite & Showcase (0% Commission): {minisiteUrl}
• Why it matters: Showcase your 4x4 fleet, dune routes & Sand Sea packages; direct booking with zero broker commission.
2️⃣ Mobile Trips Hub: {mobileDashboardUrl}
• Why it matters: Update sunset tours, sandboarding packages and availability on your mobile anytime.
3️⃣ Desert Reels Maker: {socialToolkitUrl}
• Why it matters: Create viral TikTok & Instagram desert reels branded with your phone and name.

🔑 *Claim your official profile for free:*
👉 {claimUrl}

*Partner Success Team — SiWiFy.com*`,
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
    titleAr: 'اعتماد مراكز السياحة العلاجية والاستشفاء الطبيعي (شرح المزايا)',
    titleEn: 'Health & Wellness Healing Centers Onboarding',
    contentAr: `مرحباً بإدارة وأطباء مركز *{name}* للاستشفاء والعافية! 🌿💧✨
معاكم *جنا* من قسم السياحة العلاجية في *SiWiFy.com* (المنصة المعتمدة لواحة سيوة).

يسرنا إعلامكم بتوثيق مركزكم رسمياً في دليل سيوة للسياحة العلاجية والاستشفاء البيئي:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *مزايا برنامجكم المجاني ولماذا هي مهمة جداً لنجاح مركزكم؟*
━━━━━━━━━━━━━━━━━━

1️⃣ *موقعكم الرقمي المعتمد لجلسات الاستشفاء والطفو (عمولة 0%):*
🔗 {minisiteUrl}
💡 *ليه دي مهمة لكم؟* زوار السياحة العلاجية من مصر وأوروبا والخليج يبحثون عن ثقة ومصداقية طبية وبيئية. موقعكم يشرح فوائد حمامات الرمال وبحيرات الملح والعيون الكبريتية ويتيح الحجز المباشر معكم بدون أي وسطاء.

2️⃣ *لوحة تحكم موبايل لإدارة الحجوزات والمواعيد والأسعار:*
📲 {mobileDashboardUrl}
💡 *ليه دي مهمة لكم؟* تنظيم مواعيد الجلسات والبرامج العلاجية، وتحديد الطاقة الاستيعابية اليومية لتفادي التكدس وضمان راحة الضيوف.

3️⃣ *صانع فيديوهات ومحتوى تثقيفي احترافي بهوية المركز:*
🎬 {socialToolkitUrl}
💡 *ليه دي مهمة لكم؟* تصميم مقاطع ريلز تشرح الفوائد الصحية لملح سيوة والمساج العضوي بأسلوب علمي جذاب يجذب طالبي الاستشفاء الطبيعي.

━━━━━━━━━━━━━━━━━━
🔑 *لتأكيد وتفعيل ملف المركز رسمياً مجاناً:*
👉 {claimUrl}

نتشرف بالتعاون معكم لتقديم أرقى تجربة استشفائية لضيوف الواحة! 💆‍♂️🌿
*فريق نجاح الشركاء — SiWiFy.com*`,
    contentEn: `Welcome *{name}* to Siwa Oasis Healing Hub! 🌿✨
This is *Jana* from *SiWiFy.com* (Official Siwa Platform).

Your wellness center is officially verified under:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *Why your free tools are vital for your wellness center:*
━━━━━━━━━━━━━━━━━━
1️⃣ Direct Healing Minisite (0% Commission): {minisiteUrl}
• Why it matters: Health travelers seek credible medical details. Direct booking with 0% commission.
2️⃣ Mobile Appointments Dashboard: {mobileDashboardUrl}
• Why it matters: Manage session capacities, peak seasons, and program rates on your mobile.
3️⃣ Educational Wellness Reels Maker: {socialToolkitUrl}
• Why it matters: Professional videos explaining salt lakes and sand therapy benefits.

🔑 *Claim profile: {claimUrl}*

*Partner Success Team — SiWiFy.com*`,
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
    titleAr: 'اعتماد الفنادق والإيكولودج والمخيمات (شرح المزايا وتوفير العمولات)',
    titleEn: 'Eco-Lodges, Camps & Hotels Official Onboarding',
    contentAr: `تحياتنا لإدارة وضيافة *{name}* في واحة سيوة الساحرة! 🏨🌴✨
معاكم *جنا* من إدارة الإقامات والضيافة في *SiWiFy.com* (دليل سياحة وإقامات سيوة المعتمد).

يسعدنا توثيق واعتماد منشأتكم الفندقية في دليل إقامات سيوة الرسمي:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *مزايا برنامجكم المجاني ولماذا هي مهمة جداً لزيادة أرباحكم؟*
━━━━━━━━━━━━━━━━━━

1️⃣ *موقع مصغر احترافي لاستقبال الحجوزات المباشرة (عمولة 0%):*
🔗 {minisiteUrl}
💡 *ليه دي مهمة لكم؟* منصات الحجز العالمية (مثل Booking وAgoda) تقتطع عمولات ضخمة تتراوح بين 18% إلى 25% من كل ليلة! موقعكم على SiWiFy يتيح للنزيل الحجز المباشر عبر واتساب وتوفير آلاف الجنيهات لصالح منشأتكم مباشرة.

2️⃣ *لوحة تحكم موبايل لتحديث أسعار الغرف والمواسم:*
📲 {mobileDashboardUrl}
💡 *ليه دي مهمة لكم؟* تغيير أسعار المواسم، إضافة صور غرف جديدة، وتحديث حالة الغرف المتاحة بضغطة زر من مكتب الاستقبال أو الهاتف.

3️⃣ *صانع فيديوهات ريلز وستوري احترافية بهوية الفندق:*
🎬 {socialToolkitUrl}
💡 *ليه دي مهمة لكم؟* إنتاج فيديوهات تبرز جمال عمارة الكرشيف السيوية، والجلسات البدوية، والهدوء الليلي مع شعار الفندق لجذب رواد إنستغرام وتيك توك.

━━━━━━━━━━━━━━━━━━
🔑 *لتأكيد ملكية المنشأة واستلام لوحة التحكم مجاناً:*
👉 {claimUrl}

نتمنى لكم موسماً سياحياً استثنائياً ونحن في خدمتكم دائماً! 🌿⭐
*فريق نجاح الشركاء — SiWiFy.com*`,
    contentEn: `Welcome *{name}* to Siwa Accommodations Directory! 🏨🌴✨
This is *Jana* from *SiWiFy.com* (Official Siwa Platform).

Your lodge is officially verified under:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *Why your free tools are vital for your hotel/lodge:*
━━━━━━━━━━━━━━━━━━
1️⃣ Direct Booking Minisite (0% Commission): {minisiteUrl}
• Why it matters: Global OTAs charge 18-25% commissions. Receive direct guest bookings on WhatsApp and retain 100% of revenue.
2️⃣ Mobile Room Inventory App: {mobileDashboardUrl}
• Why it matters: Change seasonal rates, update room availability right from your mobile.
3️⃣ Branded Hotel Reels Maker: {socialToolkitUrl}
• Why it matters: Create stunning architectural videos showcasing your Karshif lodge.

🔑 *Claim profile: {claimUrl}*

*Partner Success Team — SiWiFy.com*`,
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
    titleAr: 'اعتماد مطاعم وجلسات المطبخ السيوي (شرح المزايا والمنيو الرقمي)',
    titleEn: 'Siwan Restaurants & Bedouin Camp Dining Onboarding',
    contentAr: `مرحباً بأصحاب الضيافة والنكهة الأصيلة في مطعم/جلسات *{name}*! 🍲🕯️✨
معاكم *جنا* من قسم المطاعم والضيافة في *SiWiFy.com* (دليل سياحة وضيافة واحة سيوة).

يسعدنا إبلاغكم بتوثيق مطعمكم ومطبخكم رسمياً في دليل الأكلات السيوية والبدوية:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *مزايا برنامجكم المجاني ولماذا هي مهمة جداً لزيادة رواد مطعمكم؟*
━━━━━━━━━━━━━━━━━━

1️⃣ *منيو وموقع رقمي لعرض الأكلات وحجز الطاولات (عمولة 0%):*
🔗 {minisiteUrl}
💡 *ليه دي مهمة لكم؟* السائح القادم لسيوة يبحث دائماً عن وجبة أبو مردم المدفونة، أو طاجن البط بالبلح، أو جلسة عشاء وسط النخيل. موقعكم يعرض المنيو والأسعار بالصور، ويستقبل طلبات الحجز المسبق عبر واتساب مباشرة بدون أي عمولة.

2️⃣ *لوحة تحكم موبايل لتحديث أوقات العمل وأرقام الدليفري:*
📲 {mobileDashboardUrl}
💡 *ليه دي مهمة لكم؟* تعديل أسعار الوجبات اليومية، وتحديث أوقات العمل، وإتاحة طلبات التوصيل للفنادق والمخيمات بسهولة.

3️⃣ *صانع فيديوهات ريلز شهية ومغرية للأطباق السيوية:*
🎬 {socialToolkitUrl}
💡 *ليه دي مهمة لكم؟* تصميم مقاطع فيديو تظهر خروج لحم أبو مردم من تحت الرمال مع الشاي السيوي باللويزة لتشويق الضيوف ودعوتهم لمائدتكم.

━━━━━━━━━━━━━━━━━━
🔑 *لتأكيد واستلام صفحة مطعمكم والمنيو الرقمي مجاناً:*
👉 {claimUrl}

ألف هنا وشفا، ومتشوقون لتوجيه زوار سيوة لمائدتكم العامرة! 🌿🔥
*فريق نجاح الشركاء — SiWiFy.com*`,
    contentEn: `Welcome *{name}* to Siwa Dining Guide! 🍲🌴✨
This is *Jana* from *SiWiFy.com* (Official Siwa Platform).

Your restaurant is verified under:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *Why your free tools are vital for your restaurant:*
━━━━━━━━━━━━━━━━━━
1️⃣ Digital Menu & Table Booking Minisite (0% Commission): {minisiteUrl}
• Why it matters: Travelers eagerly search for authentic Abu Mardam. Direct bookings without food app cuts.
2️⃣ Mobile Store Dashboard: {mobileDashboardUrl}
• Why it matters: Update daily menus, delivery contacts, and opening hours instantly.
3️⃣ Food Reels Maker: {socialToolkitUrl}
• Why it matters: Create mouth-watering videos of your traditional dishes and Bedouin tea.

🔑 *Claim profile: {claimUrl}*

*Partner Success Team — SiWiFy.com*`,
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
    titleAr: 'اعتماد مصنعي وتجار خيرات سيوة (شرح الكتالوج والشحن للمحافظات)',
    titleEn: 'Siwa Dates, Organic Olive Oil & Salt Crafts Onboarding',
    contentAr: `مرحباً بكم في متجر ومصنع *{name}* لخيرات ومنتجات واحة سيوة! 🏺🌴✨
معاكم *جنا* من قسم المنتجات التراثية في *SiWiFy.com* (دليل سيوة الرقمي الرسمي).

يسعدنا توثيق متجركم في دليل المنتجات التراثية والطبيعية الرسمي:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *مزايا برنامجكم المجاني ولماذا هي مهمة جداً لمبيعاتكم وشحن المحافظات؟*
━━━━━━━━━━━━━━━━━━

1️⃣ *كتالوج وموقع رقمي لعرض منتجاتكم واستقبال الطلبات (عمولة 0%):*
🔗 {minisiteUrl}
💡 *ليه دي مهمة لكم؟* الزوار يشترون تمور المجدول والصعيدي، وزيت الزيتون البكر المعصور على البارد، وأباجورات الملح الصخري. موقعكم يتيح لهم ولأصدقائهم بعد عودتهم لمحافظاتهم طلب شحنات إضافية عبر واتساب مباشرة دون وسيط تجاري.

2️⃣ *لوحة تحكم موبايل لتحديث قائمة الأسعار وعروض المواسم:*
📲 {mobileDashboardUrl}
💡 *ليه دي مهمة لكم؟* إضافة المنتجات الجديدة والمقاسات وباقات الهدايا وتعديل أسعار موسم الحصاد بسهولة من هاتفك.

3️⃣ *صانع فيديوهات ريلز ترويجية لمنتجاتكم بهويتكم:*
🎬 {socialToolkitUrl}
💡 *ليه دي مهمة لكم؟* إنتاج فيديوهات تبرز جودة زيت الزيتون المعصور على البارد وأصالة ملح سيوة العلاجي، جاهزة للنشر على شبكات التواصل لزيادة الطلبات.

━━━━━━━━━━━━━━━━━━
🔑 *لتأكيد ملكية المتجر وتفعيل الكتالوج مجاناً:*
👉 {claimUrl}

فخورون بخيرات أرض سيوة ونعمل معكم لتوصيلها لكل زائر ومحب للواحة! 🌿📦
*فريق نجاح الشركاء — SiWiFy.com*`,
    contentEn: `Welcome *{name}* to Siwa Heritage & Organic Products! 🏺🌴✨
This is *Jana* from *SiWiFy.com* (Official Siwa Platform).

Your shop is verified under:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *Why your free tools are vital for your shop:*
━━━━━━━━━━━━━━━━━━
1️⃣ Product Catalog Minisite (0% Commission): {minisiteUrl}
• Why it matters: Travelers buy dates, cold-pressed olive oil & salt lamps. Enable repeat shipping orders with 0% broker fee.
2️⃣ Mobile Inventory Dashboard: {mobileDashboardUrl}
• Why it matters: Update harvest prices, sizes and bundle deals directly from your phone.
3️⃣ Social Video Reels Maker: {socialToolkitUrl}
• Why it matters: Showcase cold-pressing, salt carving, and date packaging to social media shoppers.

🔑 *Claim profile: {claimUrl}*

*Partner Success Team — SiWiFy.com*`,
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
    titleAr: 'اعتماد شركات ومنظمي البرامج الشاملة (شرح باقات الرحلات)',
    titleEn: 'Tour Operators & Group Travel Programs Onboarding',
    contentAr: `مرحباً بشركة ومنظم رحلات *{name}* في واحة سيوة! 🗺️✨
معاكم *جنا* من إدارة العمليات السياحية في *SiWiFy.com* (دليل سياحة سيوة المعتمد).

تم توثيق واعتماد نشاطكم لتنظيم البرامج والرحلات السياحية المتكاملة في سيوة:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *مزايا برنامجكم المجاني ولماذا هي مهمة جداً لحجوزات الأفواج والشركات؟*
━━━━━━━━━━━━━━━━━━

1️⃣ *موقعكم المصغر لعرض باقات وبرامج الرحلات المتكاملة (عمولة 0%):*
🔗 {minisiteUrl}
💡 *ليه دي مهمة لكم؟* تنظيم برامج الـ 3 أيام و4 أيام (سفاري + مزارات + إقامة + نقل) يتطلب وضوحاً كاملاً في التفاصيل. موقعكم يعرض مسار كل يوم والتكلفة، ويجلب لكم حجوزات مباشرة من الأفراد والشركات بدون عمولات شركات الحجز.

2️⃣ *لوحة تحكم موبايل لمتابعة البرامج وتحديث تواريخ الأفواج:*
📲 {mobileDashboardUrl}
💡 *ليه دي مهمة لكم؟* تعديل تواريخ الرحلات القادمة، وتحديث الأسعار للباقات العائلية أو الفردية، وإيقاف الحجز عند اكتمال العدد بضغطة واحدة.

3️⃣ *صانع فيديوهات ريلز تسويقية احترافية للرحلات الجماعية:*
🎬 {socialToolkitUrl}
💡 *ليه دي مهمة لكم؟* تصميم مقاطع فيديو تلخص تجربة الرحلة الشاملة من بحيرات الملح وحتى غروب بحر الرمال مع لوجو شركتكم لجذب أفواج جديدة.

━━━━━━━━━━━━━━━━━━
🔑 *لتأكيد الحساب والاعتماد الرسمي مجاناً:*
👉 {claimUrl}

نتمنى لكم مواسم زاخرة وأفواجاً سعيدة برحلاتكم في سيوة! 🌿🤝
*فريق نجاح الشركاء — SiWiFy.com*`,
    contentEn: `Welcome *{name}* to Siwa Oasis Tour Operations! 🗺️✨
This is *Jana* from *SiWiFy.com* (Official Siwa Platform).

Your agency is verified under:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *Why your free tools are vital for your tour operations:*
━━━━━━━━━━━━━━━━━━
1️⃣ Multi-Day Itinerary Minisite (0% Commission): {minisiteUrl}
• Why it matters: Present full 3D/4D programs (safari, lodge, sights); receive direct group bookings without OTA cuts.
2️⃣ Mobile Program Dashboard: {mobileDashboardUrl}
• Why it matters: Update departure dates, group capacity, and seasonal rates directly on mobile.
3️⃣ Tour Reels Creator: {socialToolkitUrl}
• Why it matters: Produce high-energy reels highlighting group adventures with your company logo.

🔑 *Claim profile: {claimUrl}*

*Partner Success Team — SiWiFy.com*`,
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
    titleAr: 'اعتماد المرشدين المحليين ورواة التراث (شرح المزايا والكارت الشخصي)',
    titleEn: 'Siwan Cultural Guides & Storytellers Onboarding',
    contentAr: `مرحباً بك يا أستاذ/كابتن *{name}*! 🧭🏛️✨
معاك *جنا* من قسم التراث والثقافة في *SiWiFy.com* (دليل سياحة وتراث واحة سيوة).

يسعدنا إعلامك باعتماد وتوثيق خدمتك كمرشد ومرافق ثقافي معتمد لزوار سيوة:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *مزايا برنامجك المجاني ولماذا هي مهمة جداً لحجوزاتك وسمعتك المهنية؟*
━━━━━━━━━━━━━━━━━━

1️⃣ *كارت وموقع رقمي شخصي لعرض مساراتك وتاريخك (عمولة 0%):*
🔗 {minisiteUrl}
💡 *ليه دي مهمة ليك؟* السائح الأجنبي والمصري يقدر جداً المرشد المحلي الأصيل. موقعك يعرض خبرتك، واللغات التي تتحدثها، ومساراتك التاريخية لجبل الموتى، وقلعة شالي، ومعبد الوحي آمون، ويتيح للسائح الاتصال بك مباشرة بدون وسيط.

2️⃣ *لوحة تحكم موبايل لتنظيم مواعيد الجولات واستقبال السياح:*
📲 {mobileDashboardUrl}
💡 *ليه دي مهمة ليك؟* تسجل المواعيد المتاحة للجولات الصباحية والمسائية وتحدد تسعيرة الجولة بالساعة أو باليوم بسهولة تامة.

3️⃣ *صانع قصص وفيديوهات تراثية باسمك لإنستغرام وتيك توك:*
🎬 {socialToolkitUrl}
💡 *ليه دي مهمة ليك؟* إنتاج فيديوهات قصيرة تروي فيها أسرار تاريخ سيوة وعادات أهلها بأسلوبك، مما يجعلك المرشد الأول المطلوب بالاسم قبل وصول الضيوف للواحة.

━━━━━━━━━━━━━━━━━━
🔑 *لتأكيد واستلام كارتك الشخصي مجاناً:*
👉 {claimUrl}

أنت صوت سيوة وتاريخها، ويسعدنا أن تكون في صدارة استقبال الضيوف! 🌿📜
*فريق نجاح الشركاء — SiWiFy.com*`,
    contentEn: `Welcome Guide *{name}*! 🧭🏛️✨
This is *Jana* from *SiWiFy.com* (Official Siwa Platform).

Your cultural guiding service is verified under:
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
🎁 *Why your free tools are vital for your guiding career:*
━━━━━━━━━━━━━━━━━━
1️⃣ Direct Guide Minisite (0% Commission): {minisiteUrl}
• Why it matters: Travelers revere authentic local storytellers. Direct booking with 0% middleman fees.
2️⃣ Mobile Schedule App: {mobileDashboardUrl}
• Why it matters: Manage walking tour hours, hourly/daily rates from your phone.
3️⃣ Heritage Story Reels Maker: {socialToolkitUrl}
• Why it matters: Create bite-sized historical tales highlighting Siwa history with your contact card.

🔑 *Claim profile: {claimUrl}*

*Partner Success Team — SiWiFy.com*`,
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
    contentAr: `🌴 مرحباً بك في واحة سيوة الساحرة! ✨

نقدم لك خدمة موثوقة ومعتمدة رسمياً ومباشرة مع: *{name}*
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
✨ *لماذا الحجز عبر SiWiFy.com هو الأفضل لك؟*
━━━━━━━━━━━━━━━━━━
• ✅ *حجز مباشر 100% بدون أي عمولة وسيطة* (أفضل سعر مضمون مباشرة من الكابتن/المزود).
• ✅ *شركاء محليون معتمدون وموثقون* تم التحقق من هويتهم ومركباتهم.
• ✅ *تواصل فوري وسريع عبر واتساب* وتأكيد لحظي.

📸 *معرض الصور والمركبة / الخدمة:*
{photoLinks}

✨ *أبرز المميزات والخدمات المشمولة:*
{featureList}

🌐 *للتفاصيل والاتصال والحجز المباشر:*
🔗 {minisiteUrl}

نتمنى لكم أوقاتاً ساحرة وتجربة لا تُنسى في سيوة! 🌿☀️
*دليل وسياحة واحة سيوة — SiWiFy.com*`,
    contentEn: `🌴 Welcome to Magical Siwa Oasis! ✨

Here is verified direct service details for: *{name}*
🏷️ *{parentType} ➔ {childType}*

━━━━━━━━━━━━━━━━━━
✨ *Why booking through SiWiFy.com is your best choice:*
━━━━━━━━━━━━━━━━━━
• ✅ *100% Direct booking with ZERO middleman markup* (Best guaranteed local price).
• ✅ *Verified local Siwan partners & vehicles*.
• ✅ *Instant WhatsApp direct confirmation*.

📸 *Showcase & Photos:*
{photoLinks}

✨ *Included Features:*
{featureList}

🌐 *Direct Minisite (0% Commission):*
{minisiteUrl}

Have an unforgettable journey in Siwa! 🌿☀️
*Siwa Oasis Official Guide — SiWiFy.com*`,
    includedFeatures: ['شريك معتمد وموثق على SiWiFy.com', 'حجز وتواصل مباشر 100% بدون وسيط', 'أسعار واضحة وعادلة', 'دعم محلي في واحة سيوة'],
  },
];

export async function GET() {
  try {
    await requireAdmin();

    const config = await queryOne<{ config: string | WhatsAppTemplateItem[] }>(
      'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
      [TEMPLATES_CONFIG_KEY]
    );

    let templates: WhatsAppTemplateItem[] = DEFAULT_TEMPLATES;
    if (config?.config) {
      try {
        const parsed = typeof config.config === 'string' ? JSON.parse(config.config) : config.config;
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

    await execute(
      `INSERT INTO website_configs (type, config) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE config = VALUES(config)`,
      [TEMPLATES_CONFIG_KEY, jsonStr]
    );

    return NextResponse.json({ success: true, count: templates.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save templates' }, { status: 500 });
  }
}
