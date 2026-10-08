'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DEFAULT_JOURNEY_CUSTOMIZER, type JourneyCustomizerCatalog } from '@/lib/journey-customizer-catalog';
import { 
  Compass, MapPin, Calendar, Sparkles, Check, 
  ArrowLeft, ArrowRight, ShieldCheck, Tag, HeartHandshake, Phone, 
  Clock, Share2, CheckCircle2, ExternalLink
} from 'lucide-react';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US').format(Math.round(value));

export default function CustomizeJourneyPage() {
  const [catalog, setCatalog] = useState<JourneyCustomizerCatalog>(DEFAULT_JOURNEY_CUSTOMIZER);
  const [lang, setLang] = useState<'ar' | 'en'>('en');
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
  const [guideLang, setGuideLang] = useState<string>('en');

  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [dispatchResult, setDispatchResult] = useState<any>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/journeys/customizer')
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!active || !data?.catalog) return;
        const nextCatalog = data.catalog as JourneyCustomizerCatalog;
        setCatalog(nextCatalog);
        const availableExperiences = nextCatalog.experiences.map(item => item.id);
        setSelectedExps(current => {
          const retained = current.filter(id => availableExperiences.includes(id));
          return retained.length ? retained : availableExperiences.slice(0, 3);
        });
        setSelectedStay(current => nextCatalog.accommodations.some(item => item.id === current) ? current : nextCatalog.accommodations[0]?.id || '');
        setSelectedTransport(current => nextCatalog.transports.some(item => item.id === current) ? current : nextCatalog.transports[0]?.id || '');
        setSelectedMeal(current => nextCatalog.meals.some(item => item.id === current) ? current : nextCatalog.meals[0]?.id || '');
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const nightsCount = Math.max(1, durationDays - 1);
  const totalGuests = adultsCount + childrenCount;

  const selectedExperienceDetails = useMemo(
    () => selectedExps
      .map(expId => catalog.experiences.find(e => e.id === expId))
      .filter(Boolean) as typeof catalog.experiences,
    [catalog.experiences, selectedExps]
  );

  const pricing = useMemo(() => {
    const expsSubtotal = selectedExperienceDetails.reduce((sum, item) => {
      return sum + (item.base_price_egp * adultsCount + (item.base_price_egp * 0.5 * childrenCount));
    }, 0);

    const stayItem = catalog.accommodations.find(a => a.id === selectedStay);
    const staySubtotal = stayItem ? stayItem.price_per_night * nightsCount : 0;

    const transportItem = catalog.transports.find(t => t.id === selectedTransport);
    const transportSubtotal = transportItem ? transportItem.rate_per_day * durationDays : 0;

    const mealItem = catalog.meals.find(m => m.id === selectedMeal);
    const mealSubtotal = mealItem ? mealItem.price_per_person * (adultsCount + childrenCount * 0.5) * durationDays : 0;

    const grossTotal = expsSubtotal + staySubtotal + transportSubtotal + mealSubtotal;
    const isBundleDiscountEligible = selectedExps.length >= 3;
    const bundleDiscountAmount = isBundleDiscountEligible ? Math.round(grossTotal * catalog.bundle_discount_percent / 100) : 0;
    const netTotal = grossTotal - bundleDiscountAmount;

    return {
      expsSubtotal,
      staySubtotal,
      transportSubtotal,
      mealSubtotal,
      grossTotal,
      isBundleDiscountEligible,
      bundleDiscountAmount,
      netTotal,
      stayItem,
      transportItem,
      mealItem,
    };
  }, [adultsCount, catalog.accommodations, catalog.bundle_discount_percent, catalog.experiences, catalog.meals, catalog.transports, childrenCount, durationDays, nightsCount, selectedExps.length, selectedMeal, selectedStay, selectedTransport, selectedExperienceDetails]);

  const {
    expsSubtotal,
    staySubtotal,
    transportSubtotal,
    mealSubtotal,
    grossTotal,
    isBundleDiscountEligible,
    bundleDiscountAmount,
    netTotal,
    stayItem,
    transportItem,
    mealItem,
  } = pricing;

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
      setSubmitError(lang === 'ar' ? 'يرجى إدخال اسمك ورقم الهاتف للتواصل.' : 'Enter your name and contact phone number.');
      return;
    }

    if (!/^\+?[\d\s().-]{7,20}$/.test(customerPhone.trim())) {
      setSubmitError(lang === 'ar' ? 'يرجى إدخال رقم هاتف صحيح مع مفتاح الدولة.' : 'Enter a valid phone number, including the country code.');
      return;
    }

    if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setSubmitError(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Enter a valid email address.');
      return;
    }

    setSubmitError('');
    const whatsappWindow = mode === 'whatsapp' ? window.open('about:blank', '_blank') : null;
    if (whatsappWindow) whatsappWindow.opener = null;

    setSubmitting(true);
    try {
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
          selected_experience_ids: selectedExps,
          accommodation_id: stayItem?.id || '',
          transport_id: transportItem?.id || '',
          meal_id: mealItem?.id || '',
          interface_language: lang,
          guide_language: guideLang === 'ar' ? 'العربية' : guideLang === 'en' ? 'English' : guideLang === 'it' ? 'Italian' : guideLang === 'fr' ? 'French' : 'German',
          special_notes: specialNotes,
          estimated_price: grossTotal,
          discount_amount: bundleDiscountAmount,
          final_price: netTotal
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDispatchResult(data);

        if (mode === 'whatsapp') {
          // Open direct WhatsApp chat with platform / concierge
          const cleanPhone = '201004155544'; // Siwify Official Concierge or Vendor
          const waUrl = `https://wa.me/${cleanPhone}?text=${data.whatsapp_summary_text}`;
          if (whatsappWindow) whatsappWindow.location.replace(waUrl);
        }
      } else {
        whatsappWindow?.close();
        setSubmitError(data.error || (lang === 'ar' ? 'تعذر إرسال طلب الرحلة. حاول مرة أخرى.' : 'Could not send your journey request. Please try again.'));
      }
    } catch (err: any) {
      whatsappWindow?.close();
      setSubmitError(err.message || (lang === 'ar' ? 'حدث خطأ أثناء إنشاء الطلب.' : 'There was an error creating your request.'));
    } finally {
      setSubmitting(false);
    }
  };

  const isRTL = lang === 'ar';
  const stepProgress = ((step - 1) / 4) * 100;
  const journeySteps = [
    { num: 1, label_ar: 'المدة والضيوف', label_en: 'Duration & guests' },
    { num: 2, label_ar: 'التجارب والأنشطة', label_en: 'Experiences' },
    { num: 3, label_ar: 'نمط الإقامة', label_en: 'Stay' },
    { num: 4, label_ar: 'التنقل والمرشد', label_en: 'Transport & guide' },
    { num: 5, label_ar: 'التأكيد والخصومات', label_en: 'Review & send' },
  ];

  return (
    <div className={`journey-shell min-h-screen bg-white text-slate-900 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-1.5 text-slate-900 font-extrabold text-sm transition hover:opacity-80 sm:gap-2 sm:text-lg">
              <i aria-hidden="true" className="fas fa-sun text-slate-700" style={{ fontSize: '1.05rem' }} />
              <span className="tracking-[0.1em] sm:tracking-[0.12em]">SIWIFY</span>
            </Link>
            <span className="hidden text-slate-300 sm:block">|</span>
            <span className="hidden truncate text-[10px] font-medium text-slate-600 sm:block sm:text-xs md:text-sm">
              {isRTL ? 'مُهندس ومُخصّص رحلات سيوة التفاعلي' : 'Interactive Siwa Journey Tailor'}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="min-h-8 rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[10px] font-bold text-slate-700 transition hover:bg-slate-100 sm:min-h-10 sm:px-3 sm:text-xs"
            >
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
            <Link 
              href="/packages"
              className="hidden items-center gap-1 text-[10px] text-slate-500 transition hover:text-slate-900 sm:inline-flex sm:text-xs"
            >
              <span>{isRTL ? 'الباقات' : 'Packages'}</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </div>

      <div className="relative isolate overflow-hidden border-b border-slate-200 bg-slate-50">
        <div className="relative mx-auto max-w-7xl px-4 py-9 sm:py-14">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700">
                <Sparkles size={14} className="text-slate-700" />
                <span>{isRTL ? 'رحلات محلية مصممة على إيقاعك' : 'Made for Siwa, made for you'}</span>
              </div>
              <h1 className="max-w-3xl text-3xl font-extrabold leading-[1.18] text-slate-900 sm:text-5xl">
                {isRTL ? 'صمّم رحلتك الاستثنائية في واحة سيوة' : 'Your Siwa journey, your way'}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {isRTL
                  ? 'اختر إيقاع رحلتك وتجاربها وإقامتك. سنجمع لك خطة واضحة وتقديراً فورياً من خبراء سيوة المحليين.'
                  : 'Choose your pace, experiences and stay. Build a clear plan with an instant estimate from trusted local Siwan hosts.'}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-slate-700" />{isRTL ? 'خبراء محليون موثوقون' : 'Trusted local hosts'}</span>
                <span className="inline-flex items-center gap-2"><Tag size={15} className="text-slate-700" />{isRTL ? `خصم ${catalog.bundle_discount_percent}٪ عند اختيار ٣ تجارب` : `Save ${catalog.bundle_discount_percent}% with 3+ experiences`}</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-slate-700" />{isRTL ? 'أسعار واضحة بالجنيه المصري' : 'Clear EGP estimates'}</span>
              </div>
            </div>
            <div className="hidden border-s border-slate-200 ps-6 lg:block">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                {isRTL ? 'رحلة على مقاسك' : 'A trip built around you'}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900">{catalog.bundle_discount_percent}%</span>
                <span className="max-w-32 text-sm leading-5 text-slate-600">
                  {isRTL ? 'خصم عند جمع ٣ تجارب أو أكثر' : 'off when you bundle 3 or more experiences'}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {isRTL ? 'تواصل مباشر مع مزودي الخدمات المحليين، بلا وسطاء.' : 'Direct connections to local operators, with no middlemen.'}
              </p>
            </div>
          </div>

          <div className="hidden md:grid grid-cols-5 gap-2 pt-9">
            {journeySteps.map((s) => (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                aria-current={step === s.num ? 'step' : undefined}
                className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 text-start text-xs font-bold transition ${
                  step === s.num
                    ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200'
                    : step > s.num
                    ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs ${step === s.num ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'}`}>
                  {step > s.num ? <Check size={15} /> : s.num}
                </span>
                <span className="leading-4">{isRTL ? s.label_ar : s.label_en}</span>
              </button>
            ))}
          </div>

          <div className="pt-5 md:hidden">
            <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold">
              <span className="text-slate-700">{isRTL ? journeySteps[step - 1].label_ar : journeySteps[step - 1].label_en}</span>
              <span className="shrink-0 text-slate-500">{step} / 5</span>
            </div>
            <div
              role="progressbar"
              aria-label={isRTL ? 'تقدم تخطيط الرحلة' : 'Journey planning progress'}
              aria-valuemin={1}
              aria-valuemax={5}
              aria-valuenow={step}
              className="h-1.5 overflow-hidden rounded-full bg-slate-200"
            >
              <div className="h-full rounded-full bg-slate-900 transition-all duration-300" style={{ width: `${stepProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="max-w-7xl mx-auto px-4 py-6 pb-32 sm:py-8 lg:pb-8 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
        
        {/* Left / Center: Interactive Step Panels */}
        <div className="lg:col-span-8 space-y-6">

          {/* SUCCESS MODAL / DISPATCH RESULT */}
          {dispatchResult && (
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6 text-center shadow-sm space-y-4 animate-fadeIn">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-2xl">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isRTL ? '🎉 تم إرسال طلب رحلتك وتجهيز خطة العمل بنجاح!' : '🎉 Custom Journey Request Dispatched Successfully!'}
              </h2>
              <div className="inline-block rounded-xl border border-slate-200 bg-white px-4 py-2 font-mono text-base font-bold text-slate-800">
                {isRTL ? 'رمز تتبع الرحلة: ' : 'Tracking Code: '} {dispatchResult.request_code}
              </div>
              <p className="mx-auto max-w-xl text-sm text-slate-600">
                {isRTL 
                  ? 'تم إرسال متطلبات رحلتك إلى فريق العمل ومزودي الخدمات المعتمدين في سيوة. يمكنك أيضاً مشاركة تفاصيل الرحلة على واتساب مباشرة للحصول على رد فوري.'
                  : 'Your customized requirements have been logged and dispatched to verified local Siwan providers. You can also send the manifest via WhatsApp for instant confirmation.'}
              </p>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <a
                  href={`https://wa.me/201004155544?text=${dispatchResult.whatsapp_summary_text}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-slate-700"
                >
                  <Phone size={18} />
                  <span>{isRTL ? 'فتح تفاصيل الرحلة في واتساب' : 'Open Manifest on WhatsApp'}</span>
                </a>
                <Link
                  href={`/visitor/journey-request/${dispatchResult.id}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-medium text-slate-800 transition hover:bg-slate-100"
                >
                  <ExternalLink size={18} />
                  <span>{isRTL ? 'عرض صفحة متابعة الطلب' : 'Track Request Status'}</span>
                </Link>
              </div>
            </div>
          )}

          {/* STEP 1: DURATION & GUESTS */}
          {step === 1 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <Calendar className="text-slate-700" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {isRTL ? '١. المدة المقترحة وموعد السفر' : '1. Trip Duration & Dates'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isRTL ? 'حدد عدد الأيام وعدد المسافرين لتخصيص خطة الإقامة والنقل' : 'Select how many days you want to spend and the group size'}
                  </p>
                </div>
              </div>

              {/* Duration presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {isRTL ? 'كم يوماً ترغب بقضائه في سيوة؟' : 'How long will your stay be?'}
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { days: 2, title_ar: 'يومان (عطلة سريعة)', title_en: '2 Days (Quick Escape)', desc_ar: 'أبرز المعالم والبحيرات', desc_en: 'Top lakes & fortress' },
                    { days: 3, title_ar: '٣ أيام (الكلاسيكية)', title_en: '3 Days (The Classic)', desc_ar: 'الرحلة المثالية المتوازنة', desc_en: 'Perfect balanced trip' },
                    { days: 4, title_ar: '٤ أيام (سفاري واستشفاء)', title_en: '4 Days (Safari & Rest)', desc_ar: 'بحر الرمال والعيون الدافئة', desc_en: 'Deep dunes & hot springs' },
                    { days: 5, title_ar: '٥+ أيام (المغامرة الكاملة)', title_en: '5+ Days (Full Odyssey)', desc_ar: 'استكشاف شامل للواحة', desc_en: 'Deep heritage & desert' },
                  ].map((d) => (
                    <button
                      key={d.days}
                      onClick={() => setDurationDays(d.days)}
                      className={`flex flex-col justify-between rounded-xl border p-4 text-start transition ${
                        durationDays === d.days
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-sm font-bold sm:text-base">{isRTL ? d.title_ar : d.title_en}</div>
                      <div className="mt-1 text-[11px] text-slate-500">{isRTL ? d.desc_ar : d.desc_en}</div>
                      <div className={`mt-3 text-[11px] font-semibold ${durationDays === d.days ? 'text-slate-200' : 'text-slate-600'}`}>
                        {d.days} {isRTL ? 'أيام / ' : 'Days / '} {d.days - 1} {isRTL ? 'ليالٍ' : 'Nights'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates & Guests */}
              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">
                    {isRTL ? 'التاريخ التقريبي للوصول' : 'Approximate Arrival Date'}
                  </label>
                  <input
                    type="date"
                    value={travelDates}
                    onChange={(e) => setTravelDates(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">
                    {isRTL ? 'عدد البالغين (١٢+ سنة)' : 'Adults (12+ yrs)'}
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                    <button
                      onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-sm font-bold text-slate-900">{adultsCount}</span>
                    <button
                      onClick={() => setAdultsCount(adultsCount + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">
                    {isRTL ? 'عدد الأطفال (أقل من ١٢)' : 'Children (< 12 yrs)'}
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                    <button
                      onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-sm font-bold text-slate-900">{childrenCount}</span>
                    <button
                      onClick={() => setChildrenCount(childrenCount + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                  <span>{isRTL ? 'التالي: اختيار التجارب والأنشطة' : 'Next: Choose Experiences'}</span>
                  {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CORE EXPERIENCES & BUNDLING */}
          {step === 2 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-slate-700" size={24} />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {isRTL ? '٢. حدد أنشطتك وتجاربك المفضلة في سيوة' : '2. Select Your Siwa Experiences'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {isRTL 
                        ? `اختر ٣ تجارب أو أكثر لتفعيل خصم الحزمة الجماعية التلقائي (وفر ${catalog.bundle_discount_percent}٪)`
                        : `Select 3+ experiences to activate the ${catalog.bundle_discount_percent}% Dynamic Multi-Experience Bundle Discount`}
                    </p>
                  </div>
                </div>

                {isBundleDiscountEligible && (
                  <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 sm:inline-flex">
                    <Tag size={12} />
                    <span>{isRTL ? `تم تفعيل خصم ${catalog.bundle_discount_percent}٪` : `${catalog.bundle_discount_percent}% Discount Active!`}</span>
                  </div>
                )}
              </div>

              {/* Experiences Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {catalog.experiences.map((exp) => {
                  const isSelected = selectedExps.includes(exp.id);
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => toggleExp(exp.id)}
                      aria-pressed={isSelected}
                      className={`group w-full overflow-hidden rounded-2xl border p-0 text-start transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative h-36 overflow-hidden sm:h-40">
                        <Image
                          src={exp.image}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 450px"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/10 to-slate-900/20" />
                        <div className="absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
                          <span className="max-w-[65%] rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-bold text-slate-700 backdrop-blur">
                            {isRTL ? exp.category_ar : exp.category}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                            <Clock size={12} />{isRTL ? exp.duration_ar : exp.duration}
                          </span>
                        </div>
                        <span className="absolute bottom-3 end-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-slate-900/40 text-lg text-white" aria-hidden="true">
                          {exp.icon}
                        </span>
                      </div>

                      <div className="flex min-h-36 flex-col p-4">
                        <h3 className="text-sm font-extrabold leading-6 text-slate-900">
                          {isRTL ? exp.title_ar : exp.title_en}
                        </h3>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {isRTL ? exp.highlight_ar : exp.highlight_en}
                        </p>
                        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                          <div className="text-xs">
                            <span className="text-sm font-extrabold text-slate-900">{formatCurrency(exp.base_price_egp)} EGP</span>
                            <span className="text-[10px] text-slate-500"> / {isRTL ? 'للفرد' : 'person'}</span>
                          </div>
                          <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                            isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                          }`}>
                            {isSelected ? <span className="inline-flex items-center gap-1"><Check size={13} />{isRTL ? 'تم الاختيار' : 'Added'}</span> : (isRTL ? '+ إضافة' : '+ Add')}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-200"
                >
                  {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                  <span>{isRTL ? 'السابق' : 'Back'}</span>
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                  <span>{isRTL ? 'التالي: نمط الإقامة' : 'Next: Accommodation'}</span>
                  {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ACCOMMODATION STYLE */}
          {step === 3 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <MapPin className="text-slate-700" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {isRTL ? '٣. نمط الإقامة والملاذ المفضل' : '3. Accommodation Style'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isRTL ? 'اختر نمط إقامتك لمدة ' + nightsCount + ' ليالٍ أو حدد خيار الإقامة المستقلة' : `Select your accommodation style for ${nightsCount} nights`}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {catalog.accommodations.map((stay) => {
                  const isSelected = selectedStay === stay.id;
                  return (
                    <div
                      key={stay.id}
                      onClick={() => setSelectedStay(stay.id)}
                      className={`flex cursor-pointer flex-col justify-between gap-4 rounded-xl border p-4 transition-all sm:flex-row sm:items-center ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {isRTL ? stay.badge_ar : stay.badge_en}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900">
                            {isRTL ? stay.name_ar : stay.name_en}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600">
                          {isRTL ? stay.desc_ar : stay.desc_en}
                        </p>
                      </div>

                      <div className="flex flex-shrink-0 items-center justify-between gap-1 border-t border-slate-200 pt-2 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                        {stay.price_per_night > 0 ? (
                          <>
                            <span className="text-sm font-bold text-slate-900 sm:text-base">
                              {stay.price_per_night * nightsCount} EGP
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ({stay.price_per_night} EGP / {isRTL ? 'ليلة' : 'night'})
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-slate-700">0 EGP ({isRTL ? 'بدون تكلفة إقامة' : 'Free'})</span>
                        )}
                        <div className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                          isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-200"
                >
                  {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                  <span>{isRTL ? 'السابق' : 'Back'}</span>
                </button>

                <button
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                  <span>{isRTL ? 'التالي: النقل والمرشد' : 'Next: Transport & Guide'}</span>
                  {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: TRANSPORT & GUIDE */}
          {step === 4 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <Compass className="text-slate-700" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {isRTL ? '٤. وسيلة التنقل ولغة المرشد السياحي' : '4. Transportation & Guide Language'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isRTL ? 'اختر وسيلة المواصلات المناسبة ولغة المرشد السيوى المحلي' : 'Choose vehicle type and preferred guide language'}
                  </p>
                </div>
              </div>

              {/* Transports */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {isRTL ? 'مركبة التنقل المرافقة' : 'Vehicle Type'}
                </label>
                {catalog.transports.map((tr) => {
                  const isSelected = selectedTransport === tr.id;
                  return (
                    <div
                      key={tr.id}
                      onClick={() => setSelectedTransport(tr.id)}
                      className={`flex cursor-pointer flex-col justify-between gap-4 rounded-xl border p-4 transition-all sm:flex-row sm:items-center ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-900">
                          {isRTL ? tr.name_ar : tr.name_en}
                        </h3>
                        <p className="text-xs text-slate-600">
                          {isRTL ? tr.desc_ar : tr.desc_en}
                        </p>
                      </div>

                      <div className="flex flex-shrink-0 items-center justify-between gap-1 border-t border-slate-200 pt-2 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                        <span className="text-sm font-bold text-slate-900 sm:text-base">
                          {tr.rate_per_day * durationDays} EGP
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({tr.rate_per_day} EGP / {isRTL ? 'يوم' : 'day'})
                        </span>
                        <div className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                          isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Meals Selection */}
              <div className="space-y-3 border-t border-slate-200 pt-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {isRTL ? 'الضيافة والوجبات السيوية' : 'Siwan Meals & Dining Experience'}
                </label>
                <div className="space-y-3">
                  {catalog.meals.map((meal) => {
                    const isSelected = selectedMeal === meal.id;
                    const mealTotal = meal.price_per_person * (adultsCount + childrenCount * 0.5) * durationDays;
                    return (
                      <div
                        key={meal.id}
                        onClick={() => setSelectedMeal(meal.id)}
                        className={`flex cursor-pointer flex-col justify-between gap-4 rounded-xl border p-4 transition-all sm:flex-row sm:items-center ${
                          isSelected
                            ? 'border-slate-900 bg-slate-50 shadow-sm'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-slate-900">
                            {isRTL ? meal.name_ar : meal.name_en}
                          </h3>
                          <p className="text-xs text-slate-600">
                            {isRTL ? meal.desc_ar : meal.desc_en}
                          </p>
                        </div>

                        <div className="flex flex-shrink-0 items-center justify-between gap-1 border-t border-slate-200 pt-2 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                          {meal.price_per_person > 0 ? (
                            <>
                              <span className="text-sm font-bold text-slate-900 sm:text-base">
                                {mealTotal} EGP
                              </span>
                              <span className="text-[10px] text-slate-500">
                                ({meal.price_per_person} EGP / {isRTL ? 'فرد / يوم' : 'person / day'})
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-slate-700">
                              {isRTL ? 'شامل الإفطار فقط' : 'Breakfast Only'}
                            </span>
                          )}
                          <div className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                            isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'
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
              <div className="space-y-2 border-t border-slate-200 pt-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {isRTL ? 'لغة المرشد السيوى المحلي' : 'Local Siwan Guide Language'}
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
                      className={`rounded-xl border p-3 text-center text-xs font-semibold transition ${
                        guideLang === g.id
                          ? 'border-slate-900 bg-slate-900 text-white font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-200"
                >
                  {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                  <span>{isRTL ? 'السابق' : 'Back'}</span>
                </button>

                <button
                  onClick={() => setStep(5)}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                  <span>{isRTL ? 'التالي: مراجعة العرض والتأكيد' : 'Next: Review & Confirm'}</span>
                  {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW, CONTACT & DISPATCH */}
          {step === 5 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <HeartHandshake className="text-slate-700" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {isRTL ? '٥. بيانات التواصل والتأكيد المباشر' : '5. Contact Details & Instant Dispatch'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isRTL 
                      ? 'أدخل بياناتك ليتم إرسال الخطة إلى المشغلين المعتمدين وتوليد رابط واتساب الفوري' 
                      : 'Enter your contact info to dispatch requirements to verified operators and generate instant WhatsApp manifest'}
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    {isRTL ? 'الاسم الكريم *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => { setCustomerName(e.target.value); setSubmitError(''); }}
                    placeholder={isRTL ? 'مثال: أحمد عبد الله' : 'e.g. John Doe'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    {isRTL ? 'رقم الهاتف / الواتساب *' : 'Phone / WhatsApp Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => { setCustomerPhone(e.target.value); setSubmitError(''); }}
                    placeholder="+20 100 123 4567"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600">
                    {isRTL ? 'البريد الإلكتروني (اختياري)' : 'Email Address (Optional)'}
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => { setCustomerEmail(e.target.value); setSubmitError(''); }}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600">
                    {isRTL ? 'ملاحظات أو طلبات خاصة (وجبات نباتية، أوقات معينة، تصوير)' : 'Special Requests or Notes (Dietary, Photography, etc.)'}
                  </label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder={isRTL ? 'أية تفاصيل ترغب بإخبارنا بها...' : 'Any special requests...'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                {submitError && (
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {submitError}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    disabled={submitting}
                    onClick={() => handleSubmitCustomJourney('whatsapp')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 font-extrabold text-white transition hover:bg-slate-700"
                  >
                    <Phone size={18} />
                    <span>{isRTL ? '⚡ حجز فوري عبر واتساب' : '⚡ Instant WhatsApp Booking'}</span>
                  </button>

                  <button
                    disabled={submitting}
                    onClick={() => handleSubmitCustomJourney('dispatch')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3.5 font-extrabold text-slate-900 transition hover:bg-slate-200"
                  >
                    <Share2 size={18} />
                    <span>
                      {submitting 
                        ? (isRTL ? 'جاري الإرسال...' : 'Dispatching...') 
                        : (isRTL ? '📋 طلب عروض من المشغلين المعتمدين' : '📋 Request Local Operator Quotes')}
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ShieldCheck size={14} className="text-slate-700" />
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
          <div className="sticky top-20 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Tag className="text-slate-700" size={18} />
                <span>{isRTL ? 'ملخص الرحلة والتسعير' : 'Journey Manifest & Total'}</span>
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                {durationDays} {isRTL ? 'أيام' : 'Days'} • {totalGuests} {isRTL ? 'ضيوف' : 'Guests'}
              </span>
            </div>

            {/* Selected Experiences List */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>{isRTL ? 'الأنشطة المختارة' : 'Selected Experiences'}</span>
                <span className="font-mono text-slate-700">{selectedExps.length}</span>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {selectedExps.map(expId => {
                  const item = catalog.experiences.find(e => e.id === expId);
                  if (!item) return null;
                  return (
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-xs">
                      <span className="max-w-[160px] truncate text-slate-700">
                        {item.icon} {isRTL ? item.title_ar : item.title_en}
                      </span>
                      <span className="font-mono text-slate-700">
                        {Math.round(item.base_price_egp * (adultsCount + childrenCount * 0.5))} EGP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stay & Transport Summary */}
            <div className="space-y-1.5 border-t border-slate-200 pt-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{isRTL ? 'الإقامة (' + nightsCount + ' ليالٍ):' : `Stay (${nightsCount} nights):`}</span>
                <span className="font-mono text-slate-800">{formatCurrency(staySubtotal)} EGP</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isRTL ? 'التنقل والسيارة:' : 'Transport:'}</span>
                <span className="font-mono text-slate-800">{formatCurrency(transportSubtotal)} EGP</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isRTL ? 'الوجبات والضيافة:' : 'Meals & Dining:'}</span>
                <span className="font-mono text-slate-800">{formatCurrency(mealSubtotal)} EGP</span>
              </div>
            </div>

            {/* Pricing Subtotal & Dynamic Discounts */}
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{isRTL ? 'المجموع الأساسي:' : 'Subtotal:'}</span>
                <span className="font-mono text-slate-800">{formatCurrency(grossTotal)} EGP</span>
              </div>

              {isBundleDiscountEligible ? (
                <div className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} />
                    <span>{isRTL ? `خصم الحزمة المتعددة (${catalog.bundle_discount_percent}٪):` : `Multi-Bundle Discount (${catalog.bundle_discount_percent}%):`}</span>
                  </span>
                  <span className="font-mono">-{formatCurrency(bundleDiscountAmount)} EGP</span>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-600">
                  💡 {isRTL 
                    ? `أضف ${3 - selectedExps.length} تجربة إضافية للحصول على خصم ${catalog.bundle_discount_percent}٪ فوري على إجمالي الرحلة!`
                    : `Add ${3 - selectedExps.length} more experience(s) to unlock the ${catalog.bundle_discount_percent}% Bundle Discount!`}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    {isRTL ? 'الإجمالي التقديري الصافي:' : 'Estimated Net Total:'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isRTL ? 'شامل الضرائب والخدمات' : 'Taxes & services included'}
                  </div>
                </div>
                <div className="text-xl font-extrabold font-mono text-slate-900 sm:text-2xl">
                  {formatCurrency(netTotal)} <span className="text-xs font-sans text-slate-500">EGP</span>
                </div>
              </div>
            </div>

            {/* Quick Step Navigation */}
            {step < 5 && (
              <button
                onClick={() => setStep(step + 1)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 font-bold text-white transition hover:bg-slate-700"
              >
                <span>{isRTL ? 'متابعة الخطوة التالية' : 'Continue Next Step'}</span>
                {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </button>
            )}

          </div>
        </div>

      </div>
      {!dispatchResult && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-12px_30px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pt-3">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-slate-400">
                {isRTL ? 'الإجمالي التقديري' : 'Estimated total'}
              </div>
              <div className="truncate text-lg font-extrabold leading-6 text-slate-900">
                {formatCurrency(netTotal)} <span className="text-[10px] font-semibold text-slate-400">EGP</span>
              </div>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => step < 5 ? setStep(step + 1) : handleSubmitCustomJourney('dispatch')}
              className="flex min-h-12 max-w-[62%] flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-extrabold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
            >
              <span>{step < 5 ? (isRTL ? 'متابعة التخطيط' : 'Continue planning') : (isRTL ? 'طلب عروض الأسعار' : 'Request quotes')}</span>
              {step < 5 && (isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />)}
              {step === 5 && submitting && <Clock size={15} className="animate-spin" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
