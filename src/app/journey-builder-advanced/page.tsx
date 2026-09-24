import { Suspense } from 'react';
import Link from 'next/link';
import AdvancedJourneyBuilder from '@/components/AdvancedJourneyBuilder';

export const metadata = {
  title: 'Custom Journey & Expedition Studio | Siwify Oasis',
  description: 'Design bespoke day-by-day itineraries with exact timings, curated mastercraft workshops, desert safaris, and direct quotes from licensed Siwan operators.',
};

export default function AdvancedJourneyBuilderPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* ── 🏛️ SIWIFY PLATFORM NAVIGATION (LUXURY LIGHT) ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-3 text-slate-900 tracking-[0.25em] font-black text-sm sm:text-base hover:opacity-90 transition-opacity"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#f59e0b] flex items-center justify-center text-slate-950 shadow-md shadow-[#D4AF37]/30">
              <i className="fas fa-sun text-xs" />
            </span>
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#b45309] bg-clip-text text-transparent font-black">
              SIWIFY
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold tracking-wider text-slate-600 uppercase">
            <Link href="/journey-builder-advanced" className="text-[#b45309] transition-colors">
              Custom Studio
            </Link>
            <Link href="/journeys" className="hover:text-slate-900 transition-colors">
              Journeys &amp; Tours
            </Link>
            <Link href="/accommodations" className="hover:text-slate-900 transition-colors">
              Stays &amp; Lodges
            </Link>
            <Link href="/activities" className="hover:text-slate-900 transition-colors">
              Activities
            </Link>
            <Link href="/food-beverage" className="hover:text-slate-900 transition-colors">
              Dining
            </Link>
            <Link href="/crafts-wellness" className="hover:text-slate-900 transition-colors">
              Crafts &amp; Wellness
            </Link>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors hidden sm:inline-block px-3 py-1.5"
            >
              Partner Portal
            </Link>
            <Link
              href="/be-a-partner"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold tracking-wider transition-all shadow-sm"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT & ITINERARY STUDIO ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Suspense
          fallback={
            <div className="max-w-5xl mx-auto p-20 bg-white rounded-3xl border border-slate-200 text-center shadow-md">
              <div className="w-10 h-10 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-amber-700 font-bold tracking-[0.2em] text-xs uppercase">
                Loading Expedition Studio…
              </div>
            </div>
          }
        >
          <AdvancedJourneyBuilder />
        </Suspense>
      </main>

      {/* ── 🌍 GLOBAL LUXURY FOOTER ── */}
      <footer className="border-t border-slate-200/80 bg-white text-slate-600 py-16 px-4 sm:px-6 lg:px-8 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-black tracking-[0.25em] text-sm">
              <span className="w-6 h-6 rounded bg-[#D4AF37] flex items-center justify-center text-slate-950 text-xs font-black">
                S
              </span>
              SIWIFY
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              The gold standard of Siwa Oasis travel and cultural discovery. Verified local artisans, eco-lodges, and desert expeditions.
            </p>
          </div>

          {/* Nav Column 1 */}
          <div className="space-y-3">
            <div className="text-xs font-bold tracking-widest text-[#b45309] uppercase">
              Expeditions &amp; Stays
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/journey-builder-advanced" className="hover:text-slate-900 transition-colors">
                  Custom Itinerary Studio
                </Link>
              </li>
              <li>
                <Link href="/accommodations" className="hover:text-slate-900 transition-colors">
                  Eco-Lodges &amp; Salt Retreats
                </Link>
              </li>
              <li>
                <Link href="/activities" className="hover:text-slate-900 transition-colors">
                  4x4 Desert Safaris &amp; Sandboarding
                </Link>
              </li>
              <li>
                <Link href="/crafts-wellness" className="hover:text-slate-900 transition-colors">
                  Silver Guilds &amp; Salt Flotation
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Column 2 */}
          <div className="space-y-3">
            <div className="text-xs font-bold tracking-widest text-[#b45309] uppercase">
              Oasis Governance
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/be-a-partner" className="hover:text-slate-900 transition-colors">
                  Become a Verified Partner
                </Link>
              </li>
              <li>
                <Link href="/jana/packages" className="hover:text-slate-900 transition-colors">
                  Admin Marketplace Command
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-slate-900 transition-colors">
                  Siwa Cultural Chronicles
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Column 3 */}
          <div className="space-y-3">
            <div className="text-xs font-bold tracking-widest text-[#b45309] uppercase">
              Direct Inquiries
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Have questions or custom multi-group requirements? Connect directly with our concierge desk.
            </p>
            <div className="pt-1">
              <a
                href="https://wa.me/201000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                <i className="fab fa-whatsapp text-emerald-600" /> WhatsApp Concierge
              </a>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-10 mt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>© {new Date().getFullYear()} Siwify Oasis Platform. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-600">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
