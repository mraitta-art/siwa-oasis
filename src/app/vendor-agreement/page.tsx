import Link from 'next/link';
import {
  VENDOR_AGREEMENT_EFFECTIVE_DATE,
  VENDOR_AGREEMENT_SECTIONS,
  VENDOR_AGREEMENT_VERSION,
} from '@/lib/vendor-agreement';

export const metadata = {
  title: 'Vendor Participation Agreement | SiWiFy',
  description: 'Terms for participating as a vendor on SiWiFy.',
};

export default async function VendorAgreementPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const isArabic = lang === 'ar';
  const language = isArabic ? 'ar' : 'en';

  return (
    <main dir={isArabic ? 'rtl' : 'ltr'} lang={language} className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6">
      <article className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Link href={`/signup?lang=${language}`} className="text-sm font-bold text-slate-600 underline underline-offset-4 hover:text-slate-950">
            {isArabic ? 'العودة إلى تسجيل البائع' : 'Back to vendor registration'}
          </Link>
          <nav aria-label="Agreement language" className="flex items-center gap-3 text-sm font-bold">
            <Link href="/vendor-agreement?lang=en" lang="en" aria-current={!isArabic ? 'page' : undefined} className={!isArabic ? 'text-slate-950' : 'text-slate-500'}>English</Link>
            <Link href="/vendor-agreement?lang=ar" lang="ar" aria-current={isArabic ? 'page' : undefined} className={isArabic ? 'text-slate-950' : 'text-slate-500'}>العربية</Link>
          </nav>
        </div>
        <header className="mt-8 border-b border-slate-200 pb-6">
          <p className="text-xs font-bold uppercase text-slate-500">{isArabic ? 'شروط البائع · النسخة' : 'Vendor terms · Version'} <bdi dir="ltr">{VENDOR_AGREEMENT_VERSION}</bdi></p>
          <h1 className="mt-2 text-3xl font-black">{isArabic ? 'اتفاقية مشاركة البائعين في SiWiFy' : 'SiWiFy Vendor Participation Agreement'}</h1>
          <p className="mt-3 text-sm text-slate-600">{isArabic ? 'تاريخ السريان:' : 'Effective date:'} <bdi dir="ltr">{VENDOR_AGREEMENT_EFFECTIVE_DATE}</bdi></p>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            {isArabic
              ? 'يرجى مراجعة هذه الشروط قبل إرسال طلب البائع. تؤدي الموافقة إلى إرسال طلبك للمراجعة ولا تنشر ملفك تلقائياً.'
              : 'Please review these terms before submitting your vendor application. Acceptance submits your application for review; it does not automatically publish your listing.'}
          </p>
        </header>

        <div className="divide-y divide-slate-200">
          {VENDOR_AGREEMENT_SECTIONS.map(section => (
            <section key={section.title} className="py-6">
              <h2 className="text-lg font-extrabold">{isArabic ? section.titleAr : section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-700">{isArabic ? section.bodyAr : section.body}</p>
            </section>
          ))}
        </div>

        <aside className="border-t border-slate-200 py-6 text-xs leading-5 text-slate-500">
          {isArabic
            ? 'تُسجّل الموافقة مع نسخة الاتفاقية وبصمة محتواها. ويتطلب استخدام مواد البائع في إعلانات SiWiFy خارج المنصة إذناً اختيارياً منفصلاً.'
            : 'Acceptance is recorded with this agreement version and its content hash. Use of vendor materials in SiWiFy advertising outside the platform requires separate optional permission.'}
        </aside>
        <Link href={`/signup?lang=${language}`} className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-700">
          {isArabic ? 'العودة إلى التسجيل' : 'Return to registration'}
        </Link>
      </article>
    </main>
  );
}