/**
 * What a vendor gains — written for the person, not for the brochure.
 *
 * Every claim below maps to something the system actually switches on:
 * the free tier allows all nine components, so the honest difference is
 * quantity, branding, placement, leads and analytics — not "more sections".
 * Keep it that way: a promise the tier policy cannot deliver is a refund.
 */

export interface ValueItem {
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
}

export const VENDOR_VALUE_INTRO = {
  en: 'Everything below starts the moment you tap Accept. No card, no commission on your bookings, and your page stays yours.',
  ar: 'كل ما هو مكتوب هنا يبدأ بمجرد أن تضغط «موافق وتفعيل». بدون بطاقة بنكية، وبدون عمولة على حجوزاتك، والصفحة تبقى لك.',
};

export const VENDOR_VALUE_FREE: ValueItem[] = [
  {
    title: 'A page in your name on siwify.com',
    titleAr: 'صفحة باسمك على siwify.com',
    body: 'A permanent link you can send to any customer. It opens fast on a phone, works on weak networks, and needs no app.',
    bodyAr: 'رابط ثابت ترسله لأي زبون. يفتح بسرعة على الموبايل، ويعمل على الشبكة الضعيفة، ولا يحتاج تحميل أي تطبيق.',
  },
  {
    title: 'One tap to WhatsApp',
    titleAr: 'ضغطة واحدة إلى واتساب',
    body: 'The visitor taps and lands in a chat with you and a ready message. You pay no commission on the booking and we take no part of the price.',
    bodyAr: 'الزائر يضغط فيفتح محادثة معك برسالة جاهزة. لا تدفع أي عمولة على الحجز، ولا نأخذ أي نسبة من السعر.',
  },
  {
    title: 'The sections that answer a tourist',
    titleAr: 'الأقسام التي يجيب عليها السائح',
    body: 'Cover, photo gallery, services and prices, packages, questions, visitor reviews, and short stories. All of them are available on the free plan.',
    bodyAr: 'غلاف، معرض صور، الخدمات والأسعار، الباقات، الأسئلة الشائعة، آراء الزبائن، ومقالات قصيرة. كلها متاحة في الخطة المجانية.',
  },
  {
    title: 'Your photos and your video',
    titleAr: 'صورك وفيديوك',
    body: 'Upload photos, and embed a video from TikTok or YouTube. An embedded video does not use your storage — the video stays on the platform you already use.',
    bodyAr: 'ارفع صورك، وأضف فيديو من تيك توك أو يوتيوب. الفيديو المُضمَّن لا يستهلك مساحتك — يبقى الفيديو على المنصة التي تستخدمها بالفعل.',
  },
  {
    title: 'A QR code for the tuk-tuk or the shop',
    titleAr: 'رمز QR للتوك توك أو المحل',
    body: 'Print it and stick it where the tourist can see it. Every scan is counted, so you know whether the sign is working.',
    bodyAr: 'اطبعه والصقه في مكان يراه السائح. كل مسح يُحسب، فتعرف إن كانت اللافتة تعمل أم لا.',
  },
  {
    title: 'Real numbers, every week',
    titleAr: 'أرقام حقيقية كل أسبوع',
    body: 'Views, WhatsApp taps, calls and directions — and which platform brought the visitor: Instagram, Facebook, TikTok, Google or the QR. You will see it in your dashboard.',
    bodyAr: 'مشاهدات، ضغطات واتساب، اتصالات وطلبات اتجاهات — ومن أي منصة جاء الزائر: إنستغرام، فيسبوك، تيك توك، جوجل أو رمز QR. تراها في لوحة التحكم.',
  },
  {
    title: 'A ready sharing kit',
    titleAr: 'حزمة مشاركة جاهزة',
    body: 'Exact bio text for each platform within its character limit, a post, a story, a WhatsApp status, and a ready reply to a tourist. Every link carries a tag so you know what worked.',
    bodyAr: 'نص البايو لكل منصة داخل حدّها المسموح، ومنشور، واستوري، وحالة واتساب، ورد جاهز للسائح. وكل رابط عليه علامة تعرف منها ما نجح.',
  },
  {
    title: 'Your Google profile, prepared',
    titleAr: 'ملفك على جوجل، مجهّز',
    body: 'We prepare the description and the website field, and check automatically when the link appears. Google itself still verifies the profile — we cannot skip that, and we never create a listing without you.',
    bodyAr: 'نجهّز الوصف وحقل الموقع، ونتحقق تلقائيًا عندما يظهر الرابط. جوجل نفسها تتحقق من الملف — لا نستطيع تجاوز ذلك، ولا ننشئ ملفًا بدونك.',
  },
  {
    title: 'It stays yours',
    titleAr: 'تبقى ملكك',
    body: 'Your number, your content, your decisions. We never ask for a password, and we never post on your behalf.',
    bodyAr: 'رقمك، ومحتواك، وقرارك. لا نطلب كلمة مرور أبدًا، ولا ننشر نيابة عنك.',
  },
];

export const VENDOR_VALUE_UPGRADE: ValueItem[] = [
  {
    title: 'More of everything',
    titleAr: 'كميات أكبر',
    body: 'More photos, more hero slides, more storage and more uploaded videos. The trial gives you one of each big item so you can test it; a paid plan removes the queue.',
    bodyAr: 'صور أكثر، وشرائح هيرو أكثر، ومساحة تخزين أكبر، وفيديوهات مرفوعة أكثر. التجربة تمنحك واحدًا من كل بند كبير لتجربه، والباقة المدفوعة ترفع الحد.',
  },
  {
    title: 'Your identity, not our template',
    titleAr: 'هويتك بدل قالبنا',
    body: 'Your logo and your colours, and full control over the template instead of the SiWiFy default.',
    bodyAr: 'شعارك وألوانك، وتحكم كامل في القالب بدل قالب سيوايفاي الافتراضي.',
  },
  {
    title: 'A place on the homepage',
    titleAr: 'مكان في الصفحة الرئيسية',
    body: 'Editorial placement in the main site carousel — seen by visitors who do not know you yet. This is the difference between waiting and being found.',
    bodyAr: 'ظهور تحريري في كاروسيل الموقع الرئيسي — يراه زائر لا يعرفك بعد. هذا هو الفرق بين أن يبحثوا عنك وأن يجدوك.',
  },
  {
    title: 'Your own carousel',
    titleAr: 'كاروسيل خاص بك',
    body: 'A private carousel for your business on the premium plan, instead of one shared slide.',
    bodyAr: 'كاروسيل خاص بنشاطك في باقة premium، بدل شريحة واحدة مشتركة.',
  },
  {
    title: 'Journey requests and offers',
    titleAr: 'طلبات الرحلات والعروض',
    body: 'Receive real visitor journey requests and reply with an offer, instead of waiting for a message that may never come.',
    bodyAr: 'تستقبل طلبات رحلات حقيقية من زوار وترد عليها بعرض، بدل أن تنتظر رسالة قد لا تأتي.',
  },
  {
    title: 'Sell in the marketplace',
    titleAr: 'البيع في السوق',
    body: 'Publish offers, packages and discounts where visitors are already comparing options.',
    bodyAr: 'انشر عروضك وباقاتك وخصوماتك في المكان الذي يقارن فيه الزوار الخيارات بالفعل.',
  },
  {
    title: 'Deeper analytics',
    titleAr: 'تحليلات أعمق',
    body: 'Full performance access: what is viewed, what is ignored, and which source produces contacts rather than just visits.',
    bodyAr: 'وصول كامل للأداء: ما يُشاهد، وما يُتجاهل، وأي مصدر يجلب تواصلًا حقيقيًا وليس مجرد زيارة.',
  },
  {
    title: 'Editorial details',
    titleAr: 'تفاصيل تحريرية',
    body: 'Captions on gallery images and short stories inside a section — the details that make a page look managed rather than abandoned.',
    bodyAr: 'تعليقات على صور المعرض ومداخل قصيرة داخل القسم — التفاصيل التي تجعل الصفحة تبدو مُدارة لا متروكة.',
  },
  {
    title: 'SiWiFy attribution removed',
    titleAr: 'إزالة علامة سيوايفاي',
    body: 'The free plan shows SiWiFy branding on the page. It is removed when an eligible paid plan is active and reflected on your account.',
    bodyAr: 'الخطة المجانية تعرض علامة سيوايفاي على الصفحة. تُزال عند تفعيل باقة مدفوعة مؤهلة وظهور ذلك على حسابك.',
  },
];

export const VENDOR_VALUE_ASK: ValueItem[] = [
  {
    title: 'One link in a profile you own',
    titleAr: 'رابط واحد في حساب تملكه',
    body: 'Preferably your Google Maps website field, and your Instagram, Facebook or TikTok profile. We prepare the exact text and link and open the edit screen for you — no passwords, ever. You have 30 days. If the link is not found, your page stays online untouched; only the discovery benefits pause until it is detected.',
    bodyAr: 'ويفضَّل حقل الموقع في ملفك على خرائط جوجل، وحسابك على إنستغرام أو فيسبوك أو تيك توك. نجهّز النص والرابط ونفتح لك شاشة التعديل — بدون كلمات مرور أبدًا. لديك ٣٠ يومًا. ولو لم يوجد الرابط، تبقى صفحتك كما هي؛ فقط ميزات الظهور تتوقف مؤقتًا حتى يُكتشف.',
  },
  {
    title: 'Permission to reshare your public page',
    titleAr: 'إذن بإعادة نشر صفحتك العامة',
    body: 'Optional and revocable: we may reshare what already appears on your public page, with your business credited by name. We never touch your private accounts.',
    bodyAr: 'اختياري وقابل للسحب: يجوز لنا إعادة نشر ما يظهر على صفحتك العامة مع ذكر اسم نشاطك. لا نلمس حساباتك الخاصة إطلاقًا.',
  },
];

export const VENDOR_VALUE_NOTE = {
  en: 'Straight limits: we do not guarantee Google ranking, bookings or revenue, we do not verify every vendor claim, and we do not sell your data.',
  ar: 'حدود واضحة: لا نضمن ترتيبك في جوجل ولا عدد الحجوزات ولا الإيرادات، ولا نتحقق من كل تصريح يكتبه البائع، ولا نبيع بياناتك.',
};

/** Copy shaped for a WhatsApp message or a printed one-pager. */
export function buildVendorValueMessage(options: { businessName?: string; limit?: number }): string {
  const limit = options.limit || 6;
  const lines = [
    `ما تكسبه من سيوايفاي${options.businessName ? ` — ${options.businessName}` : ''}:`,
    ...VENDOR_VALUE_FREE.slice(0, limit).map((item, index) => `${index + 1}. ${item.titleAr}: ${item.bodyAr}`),
    '',
    'وعند الترقية:',
    ...VENDOR_VALUE_UPGRADE.slice(0, 4).map((item, index) => `${index + 1}. ${item.titleAr}: ${item.bodyAr}`),
    '',
    VENDOR_VALUE_ASK[0].bodyAr,
    '',
    VENDOR_VALUE_NOTE.ar,
  ];
  return lines.join('\n');
}
