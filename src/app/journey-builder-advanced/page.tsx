import { Suspense } from 'react';
import Link from 'next/link';
import AdvancedJourneyBuilder from '@/components/AdvancedJourneyBuilder';

export const metadata = {
  title: 'Custom Journey & Expedition Studio | Siwify Oasis',
  description: 'Design bespoke day-by-day itineraries with exact timings, curated mastercraft workshops, desert safaris, and direct quotes from licensed Siwan operators.',
};

export default function AdvancedJourneyBuilderPage() {
  return (
    <div className="min-h-screen bg-[#070B12] text-zinc-100 flex flex-col font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* ── 🏛️ SIWIFY PLATFORM NAVIGATION ── */}
      <header className="sticky top-0 z-50 bg-[#070B12]/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-3 text-white tracking-[0.25em] font-black text-sm sm:text-base hover:opacity-90 transition-opacity"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] flex items-center justify-center text-black shadow-md shadow-[#D4AF37]/20">
              <i className="fas fa-sun text-xs" />
            </span>
            <span className="bg-gradient-to-r from-white via-zinc-200 to-[#D4AF37] bg-clip-text text-transparent font-black">
              SIWIFY
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wider text-zinc-300 uppercase">
            <Link href="/journeys" className="text-[#D4AF37] transition-colors">
              Journeys &amp; Expeditions
            </Link>
            <Link href="/accommodations" className="hover:text-white transition-colors">
              Stays &amp; Lodges
            </Link>
            <Link href="/activities" className="hover:text-white transition-colors">
              Activities
            </Link>
            <Link href="/food-beverage" className="hover:text-white transition-colors">
              Dining
            </Link>
            <Link href="/crafts-wellness" className="hover:text-white transition-colors">
              Crafts &amp; Wellness
            </Link>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors hidden sm:inline-block px-3 py-1.5"
            >
              Partner Portal
            </Link>
            <Link
              href="/be-a-partner"
              className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10 text-xs font-semibold tracking-wider transition-all"
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
            <div className="max-w-5xl mx-auto p-20 bg-[#0F172A]/40 rounded-3xl border border-white/[0.08] text-center backdrop-blur-xl">
              <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-[#D4AF37] font-semibold tracking-[0.2em] text-xs uppercase">
                Loading Expedition Studio…
              </div>
            </div>
          }
        >
          <AdvancedJourneyBuilder />
        </Suspense>
      </main>

      {/* ── 🌍 GLOBAL CINEMATIC FOOTER ── */}
      <footer className="border-t border-white/[0.08] bg-[#05080E] text-zinc-400 py-16 px-4 sm:px-6 lg:px-8 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 text-white font-black tracking-[0.25em] text-sm">
              <span className="w-6 h-6 rounded bg-[#D4AF37] flex items-center justify-center text-black text-xs font-black">
                S
              </span>
              SIWIFY
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              The gold standard of Siwa Oasis travel and cultural discovery. Verified local artisans, eco-lodges, and desert expeditions.
            </p>
          </div>

          {/* Nav Column 1 */}
          <div className="space-y-3">
            <div className="text-xs font-semibold tracking-widest text-[#D4AF37] uppercase">
              Expeditions &amp; Stays
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/journeys" className="hover:text-white transition-colors">
                  Custom Itinerary Studio
                </Link>
              </li>
              <li>
                <Link href="/accommodations" className="hover:text-white transition-colors">
                  Eco-Lodges &amp; Salt Retreats
                </Link>
              </li>
              <li>
                <Link href="/activities" className="hover:text-white transition-colors">
                  4x4 Desert Safaris &amp; Sandboarding
                </Link>
              </li>
              <li>
                <Link href="/crafts-wellness" className="hover:text-white transition-colors">
                  Silver Guilds &amp; Salt Flotation
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Column 2 */}
          <div className="space-y-3">
            <div className="text-xs font-semibold tracking-widest text-[#D4AF37] uppercase">
              Oasis Governance
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/be-a-partner" className="hover:text-white transition-colors">
                  Become a Verified Partner
                </Link>
              </li>
              <li>
                <Link href="/investment-opportunities" className="hover:text-white transition-colors">
                  Heritage Investment Deals
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Siwa Cultural Chronicles
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Operator Management Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-3">
            <div className="text-xs font-semibold tracking-widest text-[#D4AF37] uppercase">
              Assistance
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Direct operator dispatch and concierge matching available 7 days a week.
            </p>
            <div className="text-xs text-zinc-400 font-mono pt-2">
              © {new Date().getFullYear()} SIWIFY • ALL RIGHTS RESERVED.
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
