'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Compass, MapPin, Calendar, Users, Sparkles, Check, ChevronRight, 
  ArrowLeft, ArrowRight, ShieldCheck, Tag, HeartHandshake, Phone, 
  Clock, Share2, CheckCircle2, Award, Star, Sliders, ExternalLink
} from 'lucide-react';

interface Experience {
  id: string;
  title_en: string;
  title_ar: string;
  category: string;
  category_ar: string;
  duration: string;
  duration_ar: string;
  base_price_egp: number;
  highlight_en: string;
  highlight_ar: string;
  image: string;
  icon: string;
  partner_types: string[];
}

const EXPERIENCES_CATALOG: Experience[] = [
  {
    id: 'exp_salt_lakes',
    title_en: 'Salt Lakes Floating & Crystal Mineral Pools Therapy',
    title_ar: 'الطفو في بحيرات الملح وعيون المياه المعدنية العلاجية',
    category: 'Wellness & Nature',
    category_ar: 'استشفاء وطبيعة',
    duration: '3-4 Hours',
    duration_ar: '٣ - ٤ ساعات',
    base_price_egp: 450,
    highlight_en: 'Zero-gravity salt float + pure olive oil rinse in ancient palms',
    highlight_ar: 'طفو حر مضاد للجاذبية في أنقى بحيرات الملح مع غسيل بزيت الزيتون البكر',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
    icon: '🌊',
    partner_types: ['wellness', 'tours']
  },
  {
    id: 'exp_great_sand_sea',
    title_en: '4x4 Great Sand Sea Safari & Sunset Sandboarding',
    title_ar: 'سفاري بحر الرمال الأعظم بسيارات الدفع الرباعي والتزلج على الكثبان',
    category: 'Safari & Adventure',
    category_ar: 'سفاري ومغامرة',
    duration: 'Half Day / Sunset',
    duration_ar: 'نصف يوم حتى الغروب',
    base_price_egp: 1250,
    highlight_en: 'Giant dunes crossing, fossil ocean site, Bedouin tea & sandboarding',
    highlight_ar: 'عبور أضخم الكثبان الرملية، وادي الحيتان والمتحجرات، وشاي باللويزة على الرمال',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80',
    icon: '🚙',
    partner_types: ['safari', 'transport']
  },
  {
    id: 'exp_shali_amun_oracle',
    title_en: 'Ancient Fortress of Shali & Temple of the Oracle Walk',
    title_ar: 'جولة تاريخية في قلعة شالي القديمة ومعبد الوحي آمون',
    category: 'Heritage & History',
    category_ar: 'تراث وتاريخ',
    duration: '2.5 Hours',
    duration_ar: 'ساعتان ونصف',
    base_price_egp: 550,
    highlight_en: '13th-century Kershef salt-clay citadel & Alexander the Great footprint',
    highlight_ar: 'أطلال مدينة الكرشيف الطينية وقلعة شالي وخطى الإسكندر الأكبر التاريخية',
    image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800&q=80',
    icon: '🏛️',
    partner_types: ['tours', 'culture']
  },
  {
    id: 'exp_bir_wahed_hotspring',
    title_en: 'Bir Wahed Hot & Cold Sulfur Springs Retreat',
    title_ar: 'واحة بئر واحد الكبريتية الساخنة والباردة وسط الصحراء',
    category: 'Wellness & Desert',
    category_ar: 'استشفاء وصحراء',
    duration: '3 Hours',
    duration_ar: '٣ ساعات',
    base_price_egp: 700,
    highlight_en: 'Natural warm sulfur thermal spring surrounded by deep desert sands',
    highlight_ar: 'استحمام علاجي في مياه كبريتية دافئة تتدفق تلقائياً في قلب الرمال',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    icon: '♨️',
    partner_types: ['wellness', 'safari']
  },
  {
    id: 'exp_bedouin_camp_dinner',
    title_en: 'Bedouin Night Campfire, Mandi Dinner & Deep Stargazing',
    title_ar: 'سهرة بدوية أصيلة وعشاء مدمون تحت قبة النجوم والمجرات',
    category: 'Culinary & Culture',
    category_ar: 'مأكولات وأمسيات',
    duration: 'Evening (4-5 Hours)',
    duration_ar: 'أمسية (٤ - ٥ ساعات)',
    base_price_egp: 950,
    highlight_en: 'Traditional underground fire pit slow-roasted dinner & astronomy session',
    highlight_ar: 'عشاء المدمون السيوى المطهو تحت التراب ومراقبة النجوم بالتيليسكوب',
    image: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&q=80',
    icon: '🌌',
    partner_types: ['camp', 'restaurant']
  },
  {
    id: 'exp_olive_dates_workshop',
    title_en: 'Organic Olive Grove, Date Harvest & Siwan Herbal Workshop',
    title_ar: 'جولة مزارع الزيتون العضوي وجني التمور وصناعة الزيوت العطرية',
    category: 'Agritourism & Crafts',
    category_ar: 'سياحة زراعية وحرف',
    duration: '2 Hours',
    duration_ar: 'ساعتان',
    base_price_egp: 400,
    highlight_en: 'Cold-pressed extra virgin tasting & hands-on date confectionery making',
    highlight_ar: 'تذوق زيت الزيتون المعصور على البارد وتصنيع حبات التمر السيوية الفاخرة',
    image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=80',
    icon: '🌴',
    partner_types: ['agriculture', 'crafts']
  }
];

const ACCOMMODATIONS = [
  {
    id: 'ecolodge_premium',
    name_en: 'Authentic Kershef Mud-Brick Eco-Lodge',
    name_ar: 'إيكولودج كرشيف بيئي أصيل (طراز سيوة التاريخي)',
    desc_en: 'Salt-rock walls, beeswax candles, spring-fed pool, zero-noise sanctuary',
    desc_ar: 'جدران من أحجار الملح والطين، شموع عسل النحل، بركة ماء عذب، هدوء تام',
    price_per_night: 2200,
    badge_en: 'Signature Siwa Style',
    badge_ar: 'الطابع السيوى الفريد'
  },
  {
    id: 'desert_glamping',
    name_en: 'Luxury Desert Safari Glamping Camp',
    name_ar: 'مخيم سفاري فندقي فاخر وسط الكثبان',
    desc_en: 'Private Bedouin tent, private ensuite bathroom, private firepit under stars',
    desc_ar: 'خيمة بدوية مجهزة بحمام خاص، جلسة نار خاصة، إطلالة مفتوحة على المجرة',
    price_per_night: 1800,
    badge_en: 'Desert Under the Stars',
    badge_ar: 'سحر الصحراء'
  },
  {
    id: 'boutique_resort',
    name_en: 'Boutique Siwan Palm Garden Resort',
    name_ar: 'منتجع واحة النخيل البوتيكي الفاخر',
    desc_en: 'Modern amenities with oasis architecture, A/C, heated natural spring plunge pool',
    desc_ar: 'راحة فندقية متكاملة مع طابع معماري واحاتي، تكييف، ومسبح عيون طبيعية',
    price_per_night: 2600,
    badge_en: 'Maximum Comfort',
    badge_ar: 'أقصى درجات الراحة'
  },
  {
    id: 'own_stay',
    name_en: 'I have arranged my own accommodation',
    name_ar: 'لدي حجز إقامة مسبق (تنسيق الجولات والأنشطة فقط)',
    desc_en: 'We will coordinate all transfers and activities from your hotel/camp',
    desc_ar: 'سنقوم بالتنسيق التام لاستقبالك وانطلاقك من مقر إقامتك المختار',
    price_per_night: 0,
    badge_en: 'Activities Only',
    badge_ar: 'أنشطة فقط'
  }
];

const TRANSPORTS = [
  {
    id: 'private_4x4',
    name_en: 'Dedicated Private 4x4 Land Cruiser (Full Stay)',
    name_ar: 'سيارة لاندكروزر دفع رباعي 4x4 خاصة طوال فترة الرحلة',
    desc_en: 'Desert-certified driver, fuel, 24/7 flexibility across town & deep dunes',
    desc_ar: 'سائق محترف خبير بالدروب الصحراوية، شامل الوقود والتنقلات الكاملة',
    rate_per_day: 1400
  },
  {
    id: 'local_tuktuk_ecobuggy',
    name_en: 'Local Siwan Eco-Buggy & Town Shuttle',
    name_ar: 'عربة إيكو-بجي محلية وسيارات نقل بلدية لداخل الواحة',
    desc_en: 'Charming slow-paced commute through palm groves and ancient alleys',
    desc_ar: 'تنقل واحاتي هادئ وممتع بين أزقة شالي وحقول النخيل والمزارع',
    rate_per_day: 500
  },
  {
    id: 'cairo_transfer_4x4',
    name_en: 'VIP Cairo / Alex Roundtrip + Local 4x4 Package',
    name_ar: 'باقة الانتقال VIP من القاهرة / الإسكندرية + دفع رباعي بالواحة',
    desc_en: 'Door-to-door private high-end van transfer + desert 4x4 on arrival',
    desc_ar: 'توصيل خاص ذهاب وعودة من باب منزلك مع سيارة سفاري مخصصة في سيوة',
    rate_per_day: 2900
  }
];

const MEALS = [
  {
    id: 'mandi_lamb',
    name_en: 'Bedouin Lamb Under Sand (Mendhi)',
    name_ar: 'عشاء المدمون السيوى (لحم ضأن مطهو تحت الرمال)',
    desc_en: 'Slow-roasted succulent lamb, spiced rice, Siwan soups & salads cooked over underground embers',
    desc_ar: 'لحم ضأن طازج مطهو على الجمر تحت الأرض، أرز بالبهارات السيوية، شوربة وعسل تمر',
    price_per_person: 450,
  },
  {
    id: 'organic_vegan',
    name_en: 'Organic Siwan Vegan Feast',
    name_ar: 'وليمة سيوية نباتية عضوية من مزارع النخيل والزيتون',
    desc_en: 'Seasonal oasis vegetables, fresh pomegranate, olive oil delicacies, sun-dried dates and herbal bread',
    desc_ar: 'أطباق نباتية طازجة من مزارع سيوة، زيت زيتون بكر، تغميسات وخبز التنور السيوى الساخن',
    price_per_person: 280,
  },
  {
    id: 'breakfast_only',
    name_en: 'Breakfast Only / Flexible Dining',
    name_ar: 'إفطار واحاتي فقط وتناول وجبات حرة',
    desc_en: 'Traditional breakfast included; explore local cafes and oasis kitchens at your own pace',
    desc_ar: 'إفطار محلي شهي مع حرية استكشاف واختيار المطاعم والمطابخ الشعبية بنفسك',
    price_per_person: 0,
  }
];

export default function CustomizeJourneyPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [step, setStep] = useState<number>(1);

  // Form State
  const [durationDays, setDurationDays] = useState<number>(3);
  const [travelDates, setTravelDates] = useState<string>('');
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);

  const [selectedExps, setSelectedExps] = useState<string[]>([
    'exp_salt_lakes', 
    'exp_great_sand_sea', 
    'exp_shali_amun_oracle'
  ]);
  const [selectedStay, setSelectedStay] = useState<string>('ecolodge_premium');
  const [selectedTransport, setSelectedTransport] = useState<string>('private_4x4');
  const [selectedMeal, setSelectedMeal] = useState<string>('mandi_lamb');
  const [guideLang, setGuideLang] = useState<string>('ar');

  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);

  // Calculate Pricing & Dynamic Bundling Discounts
  const nightsCount = Math.max(1, durationDays - 1);
  const totalGuests = adultsCount + childrenCount;

  const expsSubtotal = selectedExps.reduce((sum, expId) => {
    const item = EXPERIENCES_CATALOG.find(e => e.id === expId);
    return sum + (item ? item.base_price_egp * adultsCount + (item.base_price_egp * 0.5 * childrenCount) : 0);
  }, 0);

  const stayItem = ACCOMMODATIONS.find(a => a.id === selectedStay);
  const staySubtotal = (stayItem ? stayItem.price_per_night * nightsCount : 0);

  const transportItem = TRANSPORTS.find(t => t.id === selectedTransport);
  const transportSubtotal = (transportItem ? transportItem.rate_per_day * durationDays : 0);

  const mealItem = MEALS.find(m => m.id === selectedMeal);
  const mealSubtotal = (mealItem ? mealItem.price_per_person * (adultsCount + childrenCount * 0.5) * durationDays : 0);

  const grossTotal = expsSubtotal + staySubtotal + transportSubtotal + mealSubtotal;

  // 15% Multi-Experience Bundle Discount if 3+ experiences selected
  const isBundleDiscountEligible = selectedExps.length >= 3;
  const bundleDiscountAmount = isBundleDiscountEligible ? Math.round(grossTotal * 0.15) : 0;
  const netTotal = grossTotal - bundleDiscountAmount;

  const toggleExp = (id: string) => {
    if (selectedExps.includes(id)) {
      if (selectedExps.length > 1) {
        setSelectedExps(selectedExps.filter(e => e !== id));
      }
    } else {
      setSelectedExps([...selectedExps, id]);
    }
  };

  const handleSubmitCustomJourney = async (mode: 'whatsapp' | 'dispatch') => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال اسمك ورقم الهاتف للتواصل' : 'Please enter your name and contact phone number');
      return;
    }

    setSubmitting(true);
    try {
      const chosenExpObjects = EXPERIENCES_CATALOG.filter(e => selectedExps.includes(e.id)).map(e => ({
        id: e.id,
        title: lang === 'ar' ? e.title_ar : e.title_en,
        category: e.category,
        price: e.base_price_egp
      }));

      const res = await fetch('/api/journeys/custom-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          duration_days: durationDays,
          travel_dates: travelDates,
          adults_count: adultsCount,
          children_count: childrenCount,
          selected_experiences: chosenExpObjects,
          accommodation_preference: stayItem ? (lang === 'ar' ? stayItem.name_ar : stayItem.name_en) : 'None',
          transport_preference: transportItem ? (lang === 'ar' ? transportItem.name_ar : transportItem.name_en) : 'None',
          meal_preference: mealItem ? (lang === 'ar' ? mealItem.name_ar : mealItem.name_en) : 'None',
          guide_language: guideLang === 'ar' ? 'العربية' : guideLang === 'en' ? 'English' : guideLang === 'it' ? 'Italian' : guideLang === 'fr' ? 'French' : 'German',
          special_notes: specialNotes,
          estimated_price: grossTotal,
          discount_amount: bundleDiscountAmount,
          final_price: netTotal,
          selected_business_ids: [] // Super admin + auto-matched providers
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDispatchResult(data);

        if (mode === 'whatsapp') {
          // Open direct WhatsApp chat with platform / concierge
          const cleanPhone = '201004155544'; // Siwify Official Concierge or Vendor
          const waUrl = `https://wa.me/${cleanPhone}?text=${data.whatsapp_summary_text}`;
          window.open(waUrl, '_blank');
        }
      } else {
        alert(data.error || 'Failed to submit journey');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating request');
    } finally {
      setSubmitting(false);
    }
  };

  const isRTL = lang === 'ar';

  return (
    <div className={`min-h-screen bg-[#070B12] text-slate-100 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-white/10 bg-[#0C121E]/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-gold font-bold text-lg hover:opacity-80 transition">
              <Compass className="text-[#D4AF37]" size={24} />
              <span>SiWiFy Oasis Engine</span>
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-xs sm:text-sm text-slate-300 font-medium">
              {isRTL ? 'مُهندس ومُخصّص رحلات سيوة التفاعلي' : 'Interactive Siwa Journey Tailor'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="px-3 py-1 text-xs font-semibold rounded-full border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition"
            >
              {lang === 'ar' ? 'English 🇬🇧' : 'العربية 🇪🇬'}
            </button>
            <Link 
              href="/packages"
              className="hidden sm:inline-flex text-xs text-slate-400 hover:text-white transition items-center gap-1"
            >
              <span>{isRTL ? 'الباقات الجاهزة' : 'Ready Packages'}</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#111A2E] to-[#070B12] py-10 px-4 border-b border-white/5">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold tracking-wide">
            <Sparkles size={14} />
            <span>
              {isRTL 
                ? 'خصم فوري 15% عند اختيار 3 تجارب أو أكثر • حجز مباشر من أهل سيوة بدون وسطاء' 
                : '15% Instant Multi-Experience Bundle Discount • 0% Middleman Direct Local Rates'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {isRTL ? 'صمّم رحلتك الاستثنائية في واحة سيوة' : 'Tailor Your Authentic Siwa Oasis Journey'}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            {isRTL 
              ? 'اختر مدة إقامتك، الأنشطة المفضلة، نمط الإقامة، وسيارة السفاري.. واحصل على عروض أسعار حصرية وموثوقة من شيوخ وخبراء سيوة المعتمدين.' 
              : 'Customize your duration, handpicked desert & mineral activities, eco-lodges, and 4x4 safaris with instant price transparency and direct local operator dispatch.'}
          </p>

          {/* Stepper Wizard Indicator */}
          <div className="pt-6 flex justify-center items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
            {[
              { num: 1, label_ar: 'المدة والضيوف', label_en: 'Duration & Guests' },
              { num: 2, label_ar: 'التجارب والأنشطة', label_en: 'Experiences' },
              { num: 3, label_ar: 'نمط الإقامة', label_en: 'Stay Vibe' },
              { num: 4, label_ar: 'التنقل والمرشد', label_en: 'Transport & Guide' },
              { num: 5, label_ar: 'التأكيد والخصومات', label_en: 'Review & Dispatch' }
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  step === s.num
                    ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 font-bold'
                    : step > s.num
                    ? 'bg-[#556B2F]/40 text-[#D4AF37] border border-[#556B2F]'
                    : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === s.num ? 'bg-black text-[#D4AF37]' : 'bg-white/10 text-white'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </span>
                <span>{isRTL ? s.label_ar : s.label_en}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left / Center: Interactive Step Panels */}
        <div className="lg:col-span-8 space-y-6">

          {/* SUCCESS MODAL / DISPATCH RESULT */}
          {dispatchResult && (
            <div className="bg-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl p-6 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {isRTL ? '🎉 تم إرسال طلب رحلتك وتجهيز خطة العمل بنجاح!' : '🎉 Custom Journey Request Dispatched Successfully!'}
              </h2>
              <div className="inline-block bg-black/50 px-4 py-2 rounded-xl border border-emerald-500/30 text-emerald-300 font-mono text-base font-bold">
                {isRTL ? 'رمز تتبع الرحلة: ' : 'Tracking Code: '} {dispatchResult.request_code}
              </div>
              <p className="text-slate-300 text-sm max-w-xl mx-auto">
                {isRTL 
                  ? 'تم إرسال متطلبات رحلتك إلى فريق العمل ومزودي الخدمات المعتمدين في سيوة. يمكنك أيضاً مشاركة تفاصيل الرحلة على واتساب مباشرة للحصول على رد فوري.'
                  : 'Your customized requirements have been logged and dispatched to verified local Siwan providers. You can also send the manifest via WhatsApp for instant confirmation.'}
              </p>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <a
                  href={`https://wa.me/201004155544?text=${dispatchResult.whatsapp_summary_text}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-xl bg-[#25D366] text-black font-bold flex items-center gap-2 hover:bg-[#20bd5a] transition shadow-lg"
                >
                  <Phone size={18} />
                  <span>{isRTL ? 'فتح تفاصيل الرحلة في واتساب' : 'Open Manifest on WhatsApp'}</span>
                </a>
                <Link
                  href={`/visitor/journey-request/${dispatchResult.id}`}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-2 transition"
                >
                  <ExternalLink size={18} />
                  <span>{isRTL ? 'عرض صفحة متابعة الطلب' : 'Track Request Status'}</span>
                </Link>
              </div>
            </div>
          )}

          {/* STEP 1: DURATION & GUESTS */}
          {step === 1 && (
            <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Calendar className="text-[#D4AF37]" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {isRTL ? '١. المدة المقترحة وموعد السفر' : '1. Trip Duration & Dates'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isRTL ? 'حدد عدد الأيام وعدد المسافرين لتخصيص خطة الإقامة والنقل' : 'Select how many days you want to spend and the group size'}
                  </p>
                </div>
              </div>

              {/* Duration presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {isRTL ? 'كم يوماً ترغب بقضائه في سيوة؟' : 'How long will your stay be?'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { days: 2, title_ar: 'يومان (عطلة سريعة)', title_en: '2 Days (Quick Escape)', desc_ar: 'أبرز المعالم والبحيرات', desc_en: 'Top lakes & fortress' },
                    { days: 3, title_ar: '٣ أيام (الكلاسيكية)', title_en: '3 Days (The Classic)', desc_ar: 'الرحلة المثالية المتوازنة', desc_en: 'Perfect balanced trip' },
                    { days: 4, title_ar: '٤ أيام (سفاري واستشفاء)', title_en: '4 Days (Safari & Rest)', desc_ar: 'بحر الرمال والعيون الدافئة', desc_en: 'Deep dunes & hot springs' },
                    { days: 5, title_ar: '٥+ أيام (المغامرة الكاملة)', title_en: '5+ Days (Full Odyssey)', desc_ar: 'استكشاف شامل للواحة', desc_en: 'Deep heritage & desert' },
                  ].map((d) => (
                    <button
                      key={d.days}
                      onClick={() => setDurationDays(d.days)}
                      className={`p-4 rounded-xl text-start border transition flex flex-col justify-between ${
                        durationDays === d.days
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-lg'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-bold text-base text-white">{isRTL ? d.title_ar : d.title_en}</div>
                      <div className="text-xs text-slate-400 mt-1">{isRTL ? d.desc_ar : d.desc_en}</div>
                      <div className="mt-3 text-xs font-semibold text-[#D4AF37]">
                        {d.days} {isRTL ? 'أيام / ' : 'Days / '} {d.days - 1} {isRTL ? 'ليالٍ' : 'Nights'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates & Guests */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    {isRTL ? 'التاريخ التقريبي للوصول' : 'Approximate Arrival Date'}
                  </label>
                  <input
                    type="date"
                    value={travelDates}
                    onChange={(e) => setTravelDates(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    {isRTL ? 'عدد البالغين (١٢+ سنة)' : 'Adults (12+ yrs)'}
                  </label>
                  <div className="flex items-center gap-3 bg-black/40 border border-white/20 rounded-xl p-1.5">
                    <button
                      onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-white">{adultsCount}</span>
                    <button
                      onClick={() => setAdultsCount(adultsCount + 1)}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    {isRTL ? 'عدد الأطفال (أقل من ١٢)' : 'Children (< 12 yrs)'}
                  </label>
                  <div className="flex items-center gap-3 bg-black/40 border border-white/20 rounded-xl p-1.5">
                    <button
                      onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-white">{childrenCount}</span>
                    <button
                      onClick={() => setChildrenCount(childrenCount + 1)}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#e5c158] transition flex items-center gap-2 shadow-lg"
                >
                  <span>{isRTL ? 'التالي: اختيار التجارب والأنشطة' : 'Next: Choose Experiences'}</span>
                  {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CORE EXPERIENCES & BUNDLING */}
          {step === 2 && (
            <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-[#D4AF37]" size={24} />
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {isRTL ? '٢. حدد أنشطتك وتجاربك المفضلة في سيوة' : '2. Select Your Siwa Experiences'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isRTL 
                        ? 'اختر ٣ تجارب أو أكثر لتفعيل خصم الحزمة الجماعية التلقائي (وفر 15%)' 
                        : 'Select 3+ experiences to activate the 15% Dynamic Multi-Experience Bundle Discount'}
                    </p>
                  </div>
                </div>

                {isBundleDiscountEligible && (
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold animate-pulse">
                    <Tag size={12} />
                    <span>{isRTL ? 'تم تفعيل خصم 15%' : '15% Discount Active!'}</span>
                  </div>
                )}
              </div>

              {/* Experiences Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXPERIENCES_CATALOG.map((exp) => {
                  const isSelected = selectedExps.includes(exp.id);
                  return (
                    <div
                      key={exp.id}
                      onClick={() => toggleExp(exp.id)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#142036] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10'
                          : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="text-3xl p-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center h-12 w-12 flex-shrink-0">
                          {exp.icon}
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">
                              {isRTL ? exp.category_ar : exp.category}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock size={12} />
                              {isRTL ? exp.duration_ar : exp.duration}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white leading-snug">
                            {isRTL ? exp.title_ar : exp.title_en}
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {isRTL ? exp.highlight_ar : exp.highlight_en}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="font-bold text-[#D4AF37] text-sm">{exp.base_price_egp} EGP</span>
                          <span className="text-slate-400 text-[10px]"> / {isRTL ? 'للفرد' : 'person'}</span>
                        </div>

                        <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                          isSelected
                            ? 'bg-[#D4AF37] text-black'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}>
                          {isSelected ? (
                            <>
                              <Check size={14} />
                              <span>{isRTL ? 'مضاف للرحلة' : 'Selected'}</span>
                            </>
                          ) : (
                            <span>{isRTL ? '+ إضافة' : '+ Add'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition flex items-center gap-2"
                >
                  {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                  <span>{isRTL ? 'السابق' : 'Back'}</span>
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#e5c158] transition flex items-center gap-2 shadow-lg"
                >
                  <span>{isRTL ? 'التالي: نمط الإقامة' : 'Next: Accommodation'}</span>
                  {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ACCOMMODATION STYLE */}
          {step === 3 && (
            <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <MapPin className="text-[#D4AF37]" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {isRTL ? '٣. نمط الإقامة والملاذ المفضل' : '3. Accommodation Style'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isRTL ? 'اختر نمط إقامتك لمدة ' + nightsCount + ' ليالٍ أو حدد خيار الإقامة المستقلة' : `Select your accommodation style for ${nightsCount} nights`}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {ACCOMMODATIONS.map((stay) => {
                  const isSelected = selectedStay === stay.id;
                  return (
                    <div
                      key={stay.id}
                      onClick={() => setSelectedStay(stay.id)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-[#142036] border-[#D4AF37] shadow-lg'
                          : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37]">
                            {isRTL ? stay.badge_ar : stay.badge_en}
                          </span>
                          <h3 className="text-sm font-bold text-white">
                            {isRTL ? stay.name_ar : stay.name_en}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400">
                          {isRTL ? stay.desc_ar : stay.desc_en}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
                        {stay.price_per_night > 0 ? (
                          <>
                            <span className="font-bold text-[#D4AF37] text-sm sm:text-base">
                              {stay.price_per_night * nightsCount} EGP
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({stay.price_per_night} EGP / {isRTL ? 'ليلة' : 'night'})
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-emerald-400 text-sm">0 EGP ({isRTL ? 'بدون تكلفة إقامة' : 'Free'})</span>
                        )}
                        <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#D4AF37] bg-[#D4AF37] text-black' : 'border-white/30'
                        }`}>
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition flex items-center gap-2"
                >
                  {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                  <span>{isRTL ? 'السابق' : 'Back'}</span>
                </button>

                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#e5c158] transition flex items-center gap-2 shadow-lg"
                >
                  <span>{isRTL ? 'التالي: النقل والمرشد' : 'Next: Transport & Guide'}</span>
                  {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: TRANSPORT & GUIDE */}
          {step === 4 && (
            <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Compass className="text-[#D4AF37]" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {isRTL ? '٤. وسيلة التنقل ولغة المرشد السياحي' : '4. Transportation & Guide Language'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isRTL ? 'اختر وسيلة المواصلات المناسبة ولغة المرشد السيوى المحلي' : 'Choose vehicle type and preferred guide language'}
                  </p>
                </div>
              </div>

              {/* Transports */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {isRTL ? 'مركبة التنقل المرافقة' : 'Vehicle Type'}
                </label>
                {TRANSPORTS.map((tr) => {
                  const isSelected = selectedTransport === tr.id;
                  return (
                    <div
                      key={tr.id}
                      onClick={() => setSelectedTransport(tr.id)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-[#142036] border-[#D4AF37] shadow-lg'
                          : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-white">
                          {isRTL ? tr.name_ar : tr.name_en}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {isRTL ? tr.desc_ar : tr.desc_en}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
                        <span className="font-bold text-[#D4AF37] text-sm sm:text-base">
                          {tr.rate_per_day * durationDays} EGP
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({tr.rate_per_day} EGP / {isRTL ? 'يوم' : 'day'})
                        </span>
                        <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#D4AF37] bg-[#D4AF37] text-black' : 'border-white/30'
                        }`}>
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Meals Selection */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {isRTL ? 'الضيافة والوجبات السيوية' : 'Siwan Meals & Dining Experience'}
                </label>
                <div className="space-y-3">
                  {MEALS.map((meal) => {
                    const isSelected = selectedMeal === meal.id;
                    const mealTotal = meal.price_per_person * (adultsCount + childrenCount * 0.5) * durationDays;
                    return (
                      <div
                        key={meal.id}
                        onClick={() => setSelectedMeal(meal.id)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelected
                            ? 'bg-[#142036] border-[#D4AF37] shadow-lg'
                            : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-white">
                            {isRTL ? meal.name_ar : meal.name_en}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {isRTL ? meal.desc_ar : meal.desc_en}
                          </p>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
                          {meal.price_per_person > 0 ? (
                            <>
                              <span className="font-bold text-[#D4AF37] text-sm sm:text-base">
                                {mealTotal} EGP
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({meal.price_per_person} EGP / {isRTL ? 'فرد / يوم' : 'person / day'})
                              </span>
                            </>
                          ) : (
                            <span className="font-bold text-emerald-400 text-sm">
                              {isRTL ? 'شامل الإفطار فقط' : 'Breakfast Only'}
                            </span>
                          )}
                          <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#D4AF37] bg-[#D4AF37] text-black' : 'border-white/30'
                          }`}>
                            {isSelected && <Check size={12} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guide Language */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {isRTL ? 'لغة المرشد السيوى المحلي' : 'Local Siwan Guide Language'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'ar', label: 'العربية (سيوية ومصرية)' },
                    { id: 'en', label: 'English Fluent' },
                    { id: 'fr', label: 'Français' },
                    { id: 'it', label: 'Italiano' },
                    { id: 'de', label: 'Deutsch' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setGuideLang(g.id)}
                      className={`p-3 rounded-xl text-xs font-semibold border transition text-center ${
                        guideLang === g.id
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white font-bold'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition flex items-center gap-2"
                >
                  {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                  <span>{isRTL ? 'السابق' : 'Back'}</span>
                </button>

                <button
                  onClick={() => setStep(5)}
                  className="px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#e5c158] transition flex items-center gap-2 shadow-lg"
                >
                  <span>{isRTL ? 'التالي: مراجعة العرض والتأكيد' : 'Next: Review & Confirm'}</span>
                  {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW, CONTACT & DISPATCH */}
          {step === 5 && (
            <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <HeartHandshake className="text-[#D4AF37]" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {isRTL ? '٥. بيانات التواصل والتأكيد المباشر' : '5. Contact Details & Instant Dispatch'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isRTL 
                      ? 'أدخل بياناتك ليتم إرسال الخطة إلى المشغلين المعتمدين وتوليد رابط واتساب الفوري' 
                      : 'Enter your contact info to dispatch requirements to verified operators and generate instant WhatsApp manifest'}
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {isRTL ? 'الاسم الكريم *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={isRTL ? 'مثال: أحمد عبد الله' : 'e.g. John Doe'}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {isRTL ? 'رقم الهاتف / الواتساب *' : 'Phone / WhatsApp Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+20 100 123 4567"
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">
                    {isRTL ? 'البريد الإلكتروني (اختياري)' : 'Email Address (Optional)'}
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">
                    {isRTL ? 'ملاحظات أو طلبات خاصة (وجبات نباتية، أوقات معينة، تصوير)' : 'Special Requests or Notes (Dietary, Photography, etc.)'}
                  </label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder={isRTL ? 'أية تفاصيل ترغب بإخبارنا بها...' : 'Any special requests...'}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    disabled={submitting}
                    onClick={() => handleSubmitCustomJourney('whatsapp')}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] text-black font-extrabold flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition shadow-lg shadow-[#25D366]/20"
                  >
                    <Phone size={18} />
                    <span>{isRTL ? '⚡ حجز فوري عبر واتساب' : '⚡ Instant WhatsApp Booking'}</span>
                  </button>

                  <button
                    disabled={submitting}
                    onClick={() => handleSubmitCustomJourney('dispatch')}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#D4AF37] text-black font-extrabold flex items-center justify-center gap-2 hover:bg-[#e5c158] transition shadow-lg shadow-[#D4AF37]/20"
                  >
                    <Share2 size={18} />
                    <span>
                      {submitting 
                        ? (isRTL ? 'جاري الإرسال...' : 'Dispatching...') 
                        : (isRTL ? '📋 طلب عروض من المشغلين المعتمدين' : '📋 Request Local Operator Quotes')}
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>
                    {isRTL 
                      ? 'جميع الحجوزات مشمولة بضمان الجودة والتسعير المباشر من واحة سيوة' 
                      : 'All custom journeys are backed by SiWiFy Quality Guarantee & Direct Local Pricing'}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right / Sidebar: Real-Time Pricing & Manifest Summary */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0D1524] border border-[#D4AF37]/30 rounded-2xl p-5 sticky top-20 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Tag className="text-[#D4AF37]" size={18} />
                <span>{isRTL ? 'ملخص الرحلة والتسعير' : 'Journey Manifest & Total'}</span>
              </h3>
              <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full text-slate-300">
                {durationDays} {isRTL ? 'أيام' : 'Days'} • {totalGuests} {isRTL ? 'ضيوف' : 'Guests'}
              </span>
            </div>

            {/* Selected Experiences List */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>{isRTL ? 'الأنشطة المختارة' : 'Selected Experiences'}</span>
                <span className="text-[#D4AF37] font-mono">{selectedExps.length}</span>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {selectedExps.map(expId => {
                  const item = EXPERIENCES_CATALOG.find(e => e.id === expId);
                  if (!item) return null;
                  return (
                    <div key={item.id} className="text-xs bg-white/5 p-2 rounded-lg flex items-center justify-between">
                      <span className="truncate max-w-[160px] text-slate-200">
                        {item.icon} {isRTL ? item.title_ar : item.title_en}
                      </span>
                      <span className="font-mono text-[#D4AF37]">
                        {item.base_price_egp * adultsCount} EGP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stay & Transport Summary */}
            <div className="space-y-1.5 border-t border-white/10 pt-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>{isRTL ? 'الإقامة (' + nightsCount + ' ليالٍ):' : `Stay (${nightsCount} nights):`}</span>
                <span className="font-mono text-white">{staySubtotal} EGP</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{isRTL ? 'التنقل والسيارة:' : 'Transport:'}</span>
                <span className="font-mono text-white">{transportSubtotal} EGP</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{isRTL ? 'الوجبات والضيافة:' : 'Meals & Dining:'}</span>
                <span className="font-mono text-white">{mealSubtotal} EGP</span>
              </div>
            </div>

            {/* Pricing Subtotal & Dynamic Discounts */}
            <div className="border-t border-white/10 pt-3 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>{isRTL ? 'المجموع الأساسي:' : 'Subtotal:'}</span>
                <span className="font-mono text-slate-300">{grossTotal} EGP</span>
              </div>

              {isBundleDiscountEligible ? (
                <div className="flex justify-between text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} />
                    <span>{isRTL ? 'خصم الحزمة المتعددة (15%):' : 'Multi-Bundle Discount (15%):'}</span>
                  </span>
                  <span className="font-mono">-{bundleDiscountAmount} EGP</span>
                </div>
              ) : (
                <div className="text-[11px] text-[#D4AF37]/80 bg-[#D4AF37]/5 p-2 rounded-lg border border-[#D4AF37]/20">
                  💡 {isRTL 
                    ? `أضف ${3 - selectedExps.length} تجربة إضافية للحصول على خصم 15% فوري على إجمالي الرحلة!`
                    : `Add ${3 - selectedExps.length} more experience(s) to unlock the 15% Bundle Discount!`}
                </div>
              )}

              <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">
                    {isRTL ? 'الإجمالي التقديري الصافي:' : 'Estimated Net Total:'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isRTL ? 'شامل الضرائب والخدمات' : 'Taxes & services included'}
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#D4AF37] font-mono">
                  {netTotal.toLocaleString()} <span className="text-xs text-slate-400 font-sans">EGP</span>
                </div>
              </div>
            </div>

            {/* Quick Step Navigation */}
            {step < 5 && (
              <button
                onClick={() => setStep(step + 1)}
                className="w-full py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#e5c158] transition flex items-center justify-center gap-2 shadow-lg"
              >
                <span>{isRTL ? 'متابعة الخطوة التالية' : 'Continue Next Step'}</span>
                {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </button>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
