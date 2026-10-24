export const VENDOR_AGREEMENT_VERSION = '2026-10-24-v1';
export const VENDOR_AGREEMENT_EFFECTIVE_DATE = '2026-10-24';

export const VENDOR_PLEDGE_ACKNOWLEDGMENT = {
  en: 'The free plan is provided in exchange for one visible link to my SiWiFy minisite from a profile I control — preferably the website field of my Google Maps business profile, and my Instagram, Facebook or TikTok profile. SiWiFy prepares the link and text for me, never asks for my passwords, and never posts on my behalf. If the link is not found within 30 days, my minisite stays online but Featured placement, priority ranking and the verified-partner badge pause until a link is detected again.',
  ar: 'تُقدَّم الخطة المجانية مقابل رابط ظاهر واحد لموقعي المصغر على SiWiFy من حساب أتحكم فيه، ويفضَّل حقل الموقع الإلكتروني في ملف نشاطي على خرائط جوجل، وحسابي على إنستغرام أو فيسبوك أو تيك توك. تُعِدّ SiWiFy الرابط والنص لي، ولا تطلب كلمات المرور ولا تنشر نيابة عني. وإذا لم يُعثر على الرابط خلال 30 يومًا، يبقى موقعي المصغر متاحًا، وتتوقف ميزة الظهور المميز والأولوية في الترتيب وشارة الشريك الموثّق حتى يُكتشف رابط مرة أخرى.',
} as const;

export const VENDOR_MINISITE_RESPONSIBILITY_ACKNOWLEDGMENT = {
  en: 'I confirm that I am authorized to manage this business minisite. The business is responsible for managing its information and keeping it accurate, and owns or has the required rights to the business data and content displayed here.',
  ar: 'أؤكد أنني مخول بإدارة الموقع المصغر لهذا النشاط. والنشاط مسؤول عن إدارة معلوماته والحفاظ على دقتها، كما أنه يملك بيانات ومحتوى النشاط المعروض هنا أو لديه الحقوق اللازمة لاستخدامهما.',
} as const;

export const VENDOR_AGREEMENT_SECTIONS = [
  {
    title: '1. Business authority and accurate information',
    titleAr: '١. صلاحية تمثيل النشاط ودقة المعلومات',
    body: 'You confirm that you are authorized to submit and manage this business listing. You are responsible for keeping the business name, contacts, services, prices, availability, offers, and other information accurate and current. You will promptly correct information that changes.',
    bodyAr: 'تؤكد أن لديك صلاحية تقديم هذا الملف التجاري وإدارته. وأنت مسؤول عن دقة وحداثة اسم النشاط وبيانات الاتصال والخدمات والأسعار والتوافر والعروض وسائر المعلومات، وتتعهد بتصحيح أي معلومات تتغير دون تأخير.',
  },
  {
    title: '2. Rights to submitted content',
    titleAr: '٢. حقوق المحتوى المقدّم',
    body: 'You retain ownership of content you provide. You grant SiWiFy a non-exclusive permission to host, reproduce, resize, format, and display that content as needed to operate your listing, minisite, and related SiWiFy pages, and to recommend your business within SiWiFy. You confirm that you have the rights and permissions needed for every photo, logo, video link, story, and other item you submit. This permission ends when the content is removed from SiWiFy, except where retention is required for security, legal, or record-keeping purposes.',
    bodyAr: 'تظل مالكًا للمحتوى الذي تقدمه. وتمنح SiWiFy إذنًا غير حصري لاستضافة هذا المحتوى ونسخه وتغيير حجمه وتنسيقه وعرضه بالقدر اللازم لتشغيل ملفك وموقعك المصغر وصفحات SiWiFy المرتبطة به، وللتوصية بنشاطك داخل SiWiFy. وتؤكد امتلاكك الحقوق والأذونات اللازمة لكل صورة أو شعار أو رابط فيديو أو قصة أو مادة أخرى تقدمها. ينتهي هذا الإذن عند إزالة المحتوى من SiWiFy، إلا إذا كان الاحتفاظ به لازمًا لأغراض الأمن أو القانون أو حفظ السجلات.',
  },
  {
    title: '3. Review, publication, and recommendations',
    titleAr: '٣. المراجعة والنشر والتوصيات',
    body: 'Submitting an application does not itself publish your listing. SiWiFy may review, request changes to, decline, hide, or remove content that is inaccurate, unauthorized, unsafe, or inconsistent with platform rules. Discovery and recommendations may consider relevance, completeness, quality, availability, and visitor feedback. SiWiFy does not guarantee search-engine rankings, impressions, inquiries, bookings, or revenue.',
    bodyAr: 'لا يؤدي تقديم الطلب وحده إلى نشر ملفك. ويجوز لـ SiWiFy مراجعة المحتوى أو طلب تعديله أو رفضه أو إخفاؤه أو إزالته إذا كان غير دقيق أو غير مصرح به أو غير آمن أو مخالفًا لقواعد المنصة. وقد تراعي نتائج الاكتشاف والتوصيات مدى الملاءمة واكتمال المعلومات والجودة والتوافر وآراء الزوار. لا تضمن SiWiFy ترتيبًا في محركات البحث أو مرات ظهور أو استفسارات أو حجوزات أو إيرادات.',
  },
  {
    title: '4. Free plan and SiWiFy attribution',
    titleAr: '٤. الخطة المجانية وظهور علامة SiWiFy',
    body: 'The free plan provides the features described during registration and in your vendor dashboard. Free minisites may display SiWiFy branding and may have plan or verification limits. SiWiFy attribution is removed only when an eligible paid plan is active and the change is reflected on the account. Paid features, fees, and any commission apply only as clearly disclosed and accepted separately.',
    bodyAr: 'توفر الخطة المجانية الميزات الموضحة أثناء التسجيل وفي لوحة البائع. وقد تعرض المواقع المصغرة المجانية علامة SiWiFy وتخضع لحدود الخطة أو التحقق. لا تُزال علامة SiWiFy إلا عند تفعيل خطة مدفوعة مؤهلة وانعكاس ذلك على الحساب. ولا تسري الميزات المدفوعة أو الرسوم أو أي عمولة إلا بعد الإفصاح عنها بوضوح وقبولها بشكل منفصل.',
  },
  {
    title: '5. Vendor responsibilities and visitor transactions',
    titleAr: '٥. مسؤوليات البائع وتعاملاته مع الزوار',
    body: 'You are responsible for delivering the services you advertise, honoring confirmed prices and terms, and complying with applicable laws and safety requirements. Do not publish misleading claims, unlawful material, personal information without permission, or content that infringes another person’s rights. SiWiFy is a discovery and communication platform and does not guarantee or independently verify every vendor statement or transaction.',
    bodyAr: 'أنت مسؤول عن تقديم الخدمات التي تعلن عنها والالتزام بالأسعار والشروط المؤكدة واتباع القوانين ومتطلبات السلامة المعمول بها. لا تنشر ادعاءات مضللة أو مواد غير قانونية أو معلومات شخصية دون إذن أو محتوى ينتهك حقوق الغير. SiWiFy منصة للاكتشاف والتواصل، ولا تضمن أو تتحقق بشكل مستقل من كل تصريح أو معاملة تخص البائع.',
  },
  {
    title: '6. Account review and ending participation',
    titleAr: '٦. مراجعة الحساب وإنهاء المشاركة',
    body: 'SiWiFy may pause publication or restrict an account while reviewing a complaint, verification issue, security concern, or suspected policy breach. You may request correction or removal of your listing through the vendor team. Ending participation does not cancel obligations already owed to customers or rights and duties that must continue by law.',
    bodyAr: 'يجوز لـ SiWiFy إيقاف النشر مؤقتًا أو تقييد الحساب أثناء مراجعة شكوى أو مشكلة تحقق أو مسألة أمنية أو اشتباه في مخالفة السياسات. ويمكنك طلب تصحيح ملفك أو إزالته عبر فريق البائعين. ولا ينهي إيقاف المشاركة الالتزامات القائمة تجاه العملاء أو الحقوق والواجبات التي يستمر سريانها بموجب القانون.',
  },
  {
    title: '7. Mutual visibility pledge (free plan)',
    titleAr: '٧. تعهد الظهور المتبادل (الخطة المجانية)',
    body: 'The free plan is provided in exchange for one visible link to your SiWiFy minisite from a profile you control — preferably the website field of your Google Maps business profile, and your Instagram, Facebook or TikTok profile. SiWiFy prepares the exact link and text and links you straight to the platform edit screen; it never asks for your passwords and never posts on your behalf. Where a platform lets SiWiFy read the value back, the link is verified automatically; otherwise a visit that reaches your minisite from that profile counts as evidence. You have 30 days to publish the link. If no link is found after that period, your minisite remains online and your content is untouched, but discovery benefits (Featured placement, priority ranking and the verified-partner badge) pause until a link is detected again. Booking platforms such as Booking.com, Airbnb or Expedia are excluded because their listing rules do not permit external links.',
    bodyAr: 'تُقدَّم الخطة المجانية مقابل رابط ظاهر واحد لموقعك المصغر على SiWiFy من حساب تتحكم فيه، ويفضَّل حقل الموقع الإلكتروني في ملف نشاطك على خرائط جوجل، وحسابك على إنستغرام أو فيسبوك أو تيك توك. تُعِدّ SiWiFy الرابط والنص بدقة وتنقلك مباشرة إلى شاشة التعديل في المنصة، ولا تطلب كلمات المرور ولا تنشر نيابة عنك. وحيث تتيح المنصة لـ SiWiFy قراءة القيمة، يُتحقق من الرابط تلقائيًا، وفي غير ذلك تُعدّ الزيارة التي تصل إلى موقعك المصغر من ذلك الحساب دليلًا على وجود الرابط. لديك 30 يومًا لنشر الرابط. وإذا لم يُعثر على رابط بعد تلك المدة، يبقى موقعك المصغر متاحًا ولا يُمس محتواك، لكن مزايا الاكتشاف (الظهور المميز والأولوية في الترتيب وشارة الشريك الموثّق) تتوقف حتى يُكتشف رابط مرة أخرى. وتُستثنى منصات الحجز مثل Booking.com وAirbnb وExpedia لأن قواعد ملفاتها لا تسمح بالروابط الخارجية.',
  },
] as const;

export type VendorAgreementLanguage = 'en' | 'ar';

export function getVendorAgreementText(language: VendorAgreementLanguage): string {
  return [
    `${language === 'ar' ? 'اتفاقية مشاركة البائعين في SiWiFy' : 'SiWiFy Vendor Participation Agreement'} ${VENDOR_AGREEMENT_VERSION}`,
    ...VENDOR_AGREEMENT_SECTIONS.flatMap(section => [
      language === 'ar' ? section.titleAr : section.title,
      language === 'ar' ? section.bodyAr : section.body,
    ]),
  ].join('\n\n');
}
