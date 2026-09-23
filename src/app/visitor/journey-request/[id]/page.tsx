'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Compass, Calendar, Users, MapPin, Tag, ShieldCheck, Phone, 
  ExternalLink, ArrowLeft, ArrowRight, CheckCircle2, Clock, AlertCircle 
} from 'lucide-react';

export default function VisitorTrackRequestPage() {
  const params = useParams();
  const requestId = params?.id as string;

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    if (!requestId) return;

    const fetchRequestData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/journeys/custom-dispatch?id=${encodeURIComponent(requestId)}`);
        if (!res.ok) throw new Error('Request not found or expired');
        const data = await res.json();
        setRequest(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load request');
      } finally {
        setLoading(false);
      }
    };

    fetchRequestData();
  }, [requestId]);

  const isRTL = lang === 'ar';

  return (
    <div className={`min-h-screen bg-[#070B12] text-slate-100 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <div className="border-b border-white/10 bg-[#0C121E]/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/customize-journey" className="flex items-center gap-2 text-gold font-bold text-base hover:opacity-80 transition">
            <Compass className="text-[#D4AF37]" size={20} />
            <span>SiWiFy Oasis Engine</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="px-3 py-1 text-xs font-semibold rounded-full border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition"
            >
              {lang === 'ar' ? 'English 🇬🇧' : 'العربية 🇪🇬'}
            </button>
            <Link 
              href="/customize-journey"
              className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <span>{isRTL ? 'تخصيص رحلة جديدة' : 'New Journey'}</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400">{isRTL ? 'جاري تحميل تفاصيل الطلب...' : 'Loading request manifest...'}</p>
          </div>
        ) : error || !request ? (
          <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">
              {isRTL ? 'لم يتم العثور على الطلب المطلوب' : 'Request Not Found'}
            </h2>
            <p className="text-sm text-slate-300">
              {error || (isRTL ? 'تأكد من صحة رمز الطلب في الرابط.' : 'Please verify the request ID in the link.')}
            </p>
            <Link
              href="/customize-journey"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#e5c158] transition"
            >
              {isRTL ? 'صمّم رحلة سيوة الآن' : 'Create a Journey Now'}
            </Link>
          </div>
        ) : (
          <>
            {/* Header & Status Card */}
            <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                    {isRTL ? 'تفاصيل رحلة سيوة المخصصة' : 'Custom Siwa Journey Manifest'}
                  </div>
                  <h1 className="text-2xl font-extrabold text-white mt-1">
                    {request.customer_name}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-black/50 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono text-[#D4AF37]">
                    {request.request_code}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    request.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    request.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {request.status}
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">{isRTL ? 'المدة' : 'Duration'}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{request.duration_days} {isRTL ? 'أيام' : 'Days'}</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">{isRTL ? 'المسافرون' : 'Guests'}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{request.adults_count} {isRTL ? 'بالغين' : 'Adults'}</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">{isRTL ? 'تاريخ الوصول' : 'Travel Date'}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{request.travel_dates || (isRTL ? 'مرن' : 'Flexible')}</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">{isRTL ? 'السعر التقديري' : 'Est. Price'}</div>
                  <div className="text-sm font-bold text-[#D4AF37] font-mono mt-0.5">{request.final_price ? `${request.final_price} EGP` : 'Custom'}</div>
                </div>
              </div>
            </div>

            {/* Selected Experiences & Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Experiences */}
              <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-3">
                  <Tag className="text-[#D4AF37]" size={18} />
                  <span>{isRTL ? 'الأنشطة والتجارب المجدولة' : 'Selected Experiences'}</span>
                </h3>

                <div className="space-y-2">
                  {Array.isArray(request.selected_experiences) && request.selected_experiences.length > 0 ? (
                    request.selected_experiences.map((exp: any, i: number) => (
                      <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-200">
                          {typeof exp === 'object' ? (exp.title || exp.name) : exp}
                        </span>
                        {exp.price && (
                          <span className="font-mono text-[#D4AF37] font-bold">{exp.price} EGP</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">{isRTL ? 'لا توجد أنشطة محددة' : 'No specific experiences selected'}</p>
                  )}
                </div>
              </div>

              {/* Stays & Transport */}
              <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-3">
                  <MapPin className="text-[#D4AF37]" size={18} />
                  <span>{isRTL ? 'الإقامة والتنقل' : 'Stay & Transport'}</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">{isRTL ? 'نمط الإقامة' : 'Accommodation Style'}</div>
                    <div className="text-sm font-bold text-white mt-1">{request.accommodation_preference}</div>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">{isRTL ? 'وسيلة التنقل' : 'Transportation'}</div>
                    <div className="text-sm font-bold text-white mt-1">{request.transport_preference}</div>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">{isRTL ? 'لغة المرشد' : 'Guide Language'}</div>
                    <div className="text-sm font-bold text-white mt-1">{request.guide_language}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dispatched Vendors & Quotes */}
            <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-3">
                <ShieldCheck className="text-[#D4AF37]" size={18} />
                <span>{isRTL ? 'المشغلون المحليون وتحديثات الأسعار' : 'Dispatched Local Operators & Quotes'}</span>
              </h3>

              {Array.isArray(request.dispatches) && request.dispatches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {request.dispatches.map((disp: any) => (
                    <div key={disp.id} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{disp.business_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300">
                          {disp.vendor_status}
                        </span>
                      </div>
                      {disp.quoted_price && (
                        <div className="text-xs text-[#D4AF37] font-bold">
                          {isRTL ? 'عرض السعر المقدم: ' : 'Submitted Quote: '} {disp.quoted_price} EGP
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 bg-white/5 rounded-xl border border-white/5">
                  {isRTL 
                    ? 'طلبك قيد المراجعة والمطابقة التلقائية مع المشغلين المعتمدين في سيوة.' 
                    : 'Your request is being matched with certified Siwa operators.'}
                </div>
              )}
            </div>

            {/* Direct WhatsApp Concierge CTA */}
            <div className="p-6 bg-gradient-to-r from-emerald-950/50 via-[#0D1524] to-[#0D1524] border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-white text-sm">
                  {isRTL ? 'هل لديك أسئلة إضافية أو ترغب بتعديل الخطة؟' : 'Need instant support or itinerary adjustments?'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {isRTL ? 'تواصل مباشرة مع كونسيرج سيوة على واتساب' : 'Chat directly with the Siwa Concierge team on WhatsApp'}
                </p>
              </div>

              <a
                href={`https://wa.me/201004155544?text=Hi%20Siwify,%20inquiring%20about%20Journey%20${request.request_code}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-[#25D366] text-black font-bold text-xs flex items-center gap-2 hover:bg-[#20bd5a] transition shadow-lg whitespace-nowrap"
              >
                <Phone size={16} />
                <span>{isRTL ? 'محادثة كونسيرج سيوة' : 'Chat on WhatsApp'}</span>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
