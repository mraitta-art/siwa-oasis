/**
 * Vendor Interface — Bilingual Translation Dictionary
 * Covers all UI chrome: nav, buttons, labels, gallery, form elements.
 * Field DATA entered by vendor is never translated here.
 */

export type Lang = 'en' | 'ar';

const strings = {
  en: {
    // ── Layout / Sidebar ─────────────────────────────────────────
    vendorHub:          'VENDOR HUB',
    activeBusiness:     'Active Business:',
    switchBusiness:     'Switch',
    premiumTier:        'Premium Tier',
    trialTier:          'Trial',
    freeTier:           'Free',

    // Nav groups
    navDashboard:       'DASHBOARD',
    navBusinessProfile: 'BUSINESS PROFILE',
    navMinisiteBuilder: 'MINISITE BUILDER',
    navMarketplace:     'MARKETPLACE',
    navVendorTiers:     'VENDOR TIERS',

    // Nav items
    overview:           'Overview',
    analytics:          'Analytics',
    editInformation:    'Edit Information',
    mediaGallery:       'Media Gallery',
    designStudio:       'Design Studio',
    publishSettings:    'Publish Settings',
    marketplaceReqs:    'Marketplace Requests',
    myOffers:           'My Submitted Offers',
    myVendorTier:       'My Vendor Tier',
    requestUpgrade:     'Request Upgrade',

    // Header bar
    viewLiveMinisite:   'View Live Minisite',
    mediaUsage:         'Media',

    // ── Vendor Studio page ────────────────────────────────────────
    siwaStudio:         'SIWA STUDIO',
    swiftDataEntry:     'SWIFT DATA ENTRY',
    completion:         'COMPLETION',
    preview:            'PREVIEW',
    publish:            'PUBLISH',
    saving:             'SAVING...',
    saved:              'SAVED',

    // Studio tabs
    tabCore:            'CORE IDENTITY',
    tabCommon:          'UNIVERSAL DNA',
    tabUnique:          'UNIQUE TYPOLOGY',

    // Section sidebar
    coreSections:       'CORE SECTIONS',
    universalSections:  'UNIVERSAL SECTIONS',
    typologySections:   'TYPOLOGY SECTIONS',
    completed:          'COMPLETED',
    pctFilled:          '% FILLED',

    // Section canvas
    fillDetails:        'Fill in the details for this section. Changes will be saved globally.',

    // Loading
    preparingStudio:    'PREPARING SWIFT STUDIO',

    // ── DynamicForm ───────────────────────────────────────────────
    // Origin badges
    badgeUnique:        'UNIQUE',
    badgeUniversal:     'UNIVERSAL',
    badgeInherited:     'INHERITED',

    // Feature badges
    badgePremium:       'PREMIUM',
    upgradeToUnlock:    'UPGRADE TO UNLOCK',
    trialEndingSoon:    'TRIAL ENDING SOON',
    trialExpiresIn:     'Your premium access expires in',
    hours:              'hours.',
    upgradeNow:         'UPGRADE NOW',

    // Rich text / Narrative editor
    masterStoryteller:  'MASTER STORYTELLER',
    words:              'WORDS',
    clickExpand:        'CLICK TO EXPAND NARRATIVE CANVAS',
    openEditor:         'OPEN EDITOR',
    cinematicNarrative: 'CINEMATIC NARRATIVE STUDIO',
    zenMode:            'ZEN MODE',
    aiMagic:            'AI MAGIC',
    generating:         'GENERATING...',

    // Image/Camera upload
    insertImageDevice:  'Insert Image (Device)',
    insertImageCamera:  'Insert Image (Camera)',

    // Gallery manager
    galleryAssets:      'GALLERY ASSETS',
    images:             'IMAGES',
    clickExpandGallery: 'CLICK TO EXPAND CINEMATIC MANAGER',
    manageMedia:        'MANAGE MEDIA',
    processing:         'PROCESSING...',
    slot:               'SLOT',
    slideSettings:      'SLIDE SETTINGS',
    displayMode:        'Display Mode',
    showCaption:        'Show Caption',
    imageUrlExternal:   'IMAGE URL (EXTERNAL)',
    pasteImageLink:     'Paste image link here...',
    caption:            'CAPTION / ALT TEXT',
    writeCaption:       'Write a descriptive caption...',
    minisiteHero:       'MINISITE HERO',
    mainSiteHero:       'MAIN SITE HERO',
    addMoreMedia:       'ADD MORE MEDIA',
    addViaCamera:       'ADD VIA CAMERA',
    dragDrop:           'Click or drag media files here',
    supportedFormats:   'Images & Videos supported',

    // Video / YouTube
    cinematicPreview:   'CINEMATIC PREVIEW',
    readyToStream:      'READY TO STREAM',
    noVideoLink:        'NO VIDEO LINK',
    upgradeForYoutube:  'UPGRADE FOR YOUTUBE',
    pasteYouTube:       'Paste YouTube URL or ID...',
    youtubeLocked:      'YouTube locked for this tier',

    // Map
    enterCoords:        'ENTER COORDINATES TO PREVIEW',
    openInMaps:         'OPEN IN GOOGLE MAPS',
    coordsPlaceholder:  'Latitude, Longitude (e.g. 29.2023, 25.5244)',

    // Star rating
    outOf:              '/ 5',

    // Boolean toggle
    enabled:            'ENABLED / ACTIVE',
    disabled:           'DISABLED / INACTIVE',

    // Select / multiselect
    selectOption:       '— Select an option —',
    adminDefinedOpts:   'Options defined by admin • Admin-locked choices',
    adminToggle:        'Options defined by admin • Click to toggle selections',

    // File size error
    fileTooLarge:       'File too large for your current tier',
    yourLimit:          'Your limit is',
    reduceOrUpgrade:    'Please reduce size or upgrade.',
    filesExceedLimit:   'files exceed your',
    mbLimit:            'MB limit.',

    // Media synchronized
    mediaSynced:        'Media Synchronized',
    assetsAdded:        'assets added',
    mediaUploadFailed:  'Media Upload Failed',

    // Language toggle
    langToggle:         'عربي',
  },

  ar: {
    // ── Layout / Sidebar ─────────────────────────────────────────
    vendorHub:          'مركز البائع',
    activeBusiness:     'النشاط التجاري:',
    switchBusiness:     'تغيير',
    premiumTier:        'الباقة المميزة',
    trialTier:          'تجريبي',
    freeTier:           'مجاني',

    // Nav groups
    navDashboard:       'لوحة التحكم',
    navBusinessProfile: 'الملف التجاري',
    navMinisiteBuilder: 'بناء الموقع',
    navMarketplace:     'السوق',
    navVendorTiers:     'باقات البائع',

    // Nav items
    overview:           'نظرة عامة',
    analytics:          'التحليلات',
    editInformation:    'تعديل المعلومات',
    mediaGallery:       'معرض الوسائط',
    designStudio:       'استوديو التصميم',
    publishSettings:    'إعدادات النشر',
    marketplaceReqs:    'طلبات السوق',
    myOffers:           'عروضي المقدمة',
    myVendorTier:       'باقتي',
    requestUpgrade:     'طلب ترقية',

    // Header bar
    viewLiveMinisite:   'عرض الموقع المباشر',
    mediaUsage:         'الوسائط',

    // ── Vendor Studio page ────────────────────────────────────────
    siwaStudio:         'استوديو سيوة',
    swiftDataEntry:     'إدخال البيانات السريع',
    completion:         'نسبة الاكتمال',
    preview:            'معاينة',
    publish:            'نشر',
    saving:             'جاري الحفظ...',
    saved:              'تم الحفظ',

    // Studio tabs
    tabCore:            'الهوية الأساسية',
    tabCommon:          'الحمض النووي العام',
    tabUnique:          'النمط الفريد',

    // Section sidebar
    coreSections:       'الأقسام الأساسية',
    universalSections:  'الأقسام العامة',
    typologySections:   'أقسام النمط',
    completed:          'مكتمل',
    pctFilled:          '% مكتمل',

    // Section canvas
    fillDetails:        'أدخل تفاصيل هذا القسم. سيتم حفظ التغييرات تلقائيًا.',

    // Loading
    preparingStudio:    'جاري تحضير الاستوديو',

    // ── DynamicForm ───────────────────────────────────────────────
    // Origin badges
    badgeUnique:        'فريد',
    badgeUniversal:     'عام',
    badgeInherited:     'موروث',

    // Feature badges
    badgePremium:       'مميز',
    upgradeToUnlock:    'ترقية للفتح',
    trialEndingSoon:    'تنتهي التجربة قريبًا',
    trialExpiresIn:     'تنتهي صلاحية وصولك المميز خلال',
    hours:              'ساعة.',
    upgradeNow:         'ترقية الآن',

    // Rich text / Narrative editor
    masterStoryteller:  'محرر القصص',
    words:              'كلمة',
    clickExpand:        'انقر لفتح محرر النصوص',
    openEditor:         'فتح المحرر',
    cinematicNarrative: 'استوديو السرد السينمائي',
    zenMode:            'وضع التركيز',
    aiMagic:            'السحر الذكي',
    generating:         'جاري التوليد...',

    // Image/Camera upload
    insertImageDevice:  'إدراج صورة (الجهاز)',
    insertImageCamera:  'إدراج صورة (الكاميرا)',

    // Gallery manager
    galleryAssets:      'الصور والوسائط',
    images:             'صورة',
    clickExpandGallery: 'انقر لإدارة الوسائط',
    manageMedia:        'إدارة الوسائط',
    processing:         'جاري المعالجة...',
    slot:               'خانة',
    slideSettings:      'إعدادات الشريحة',
    displayMode:        'وضع العرض',
    showCaption:        'إظهار التعليق',
    imageUrlExternal:   'رابط الصورة الخارجي',
    pasteImageLink:     'الصق رابط الصورة هنا...',
    caption:            'التعليق / النص البديل',
    writeCaption:       'اكتب تعليقاً وصفياً...',
    minisiteHero:       'صورة الموقع الرئيسية',
    mainSiteHero:       'صورة الصفحة الرئيسية',
    addMoreMedia:       'إضافة المزيد من الوسائط',
    addViaCamera:       'التقاط بالكاميرا',
    dragDrop:           'انقر أو اسحب الملفات هنا',
    supportedFormats:   'يدعم الصور والفيديو',

    // Video / YouTube
    cinematicPreview:   'معاينة الفيديو',
    readyToStream:      'جاهز للبث',
    noVideoLink:        'لا يوجد رابط فيديو',
    upgradeForYoutube:  'ترقية لليوتيوب',
    pasteYouTube:       'الصق رابط يوتيوب أو المعرف...',
    youtubeLocked:      'يوتيوب غير متاح في هذه الباقة',

    // Map
    enterCoords:        'أدخل الإحداثيات للمعاينة',
    openInMaps:         'فتح في خرائط جوجل',
    coordsPlaceholder:  'خط العرض، خط الطول (مثال: 29.2023، 25.5244)',

    // Star rating
    outOf:              'من 5',

    // Boolean toggle
    enabled:            'مفعّل / نشط',
    disabled:           'معطّل / غير نشط',

    // Select / multiselect
    selectOption:       '— اختر خياراً —',
    adminDefinedOpts:   'خيارات محددة من الإدارة • مقفلة',
    adminToggle:        'خيارات محددة من الإدارة • انقر للتحديد',

    // File size error
    fileTooLarge:       'الملف كبير جدًا لباقتك الحالية',
    yourLimit:          'حدك هو',
    reduceOrUpgrade:    'يرجى تقليل الحجم أو الترقية.',
    filesExceedLimit:   'ملف/ملفات تتجاوز حد',
    mbLimit:            'ميجابايت.',

    // Media synchronized
    mediaSynced:        'تمت مزامنة الوسائط',
    assetsAdded:        'ملف مضاف',
    mediaUploadFailed:  'فشل رفع الوسائط',

    // Language toggle
    langToggle:         'English',
  },
} as const;

export type StringKey = keyof typeof strings.en;
export type Translations = typeof strings.en;

export function getStrings(lang: Lang): Translations {
  return strings[lang] as Translations;
}

export default strings;
