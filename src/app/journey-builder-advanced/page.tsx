import { Suspense } from 'react';
import Link from 'next/link';
import AdvancedJourneyBuilder from '@/components/AdvancedJourneyBuilder';

export const metadata = {
  title: 'Custom Journey & Expedition Builder | Siwa Oasis',
  description: 'Create detailed day-by-day itineraries with multiple activities per day at specific times.',
};

export default function AdvancedJourneyBuilderPage() {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      {/* Main Site Header Navigation Bar */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4 text-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/journeys"
            className="inline-flex items-center gap-2 font-medium text-zinc-400 hover:text-white transition-colors"
          >
            ← Journeys &amp; Expeditions
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="font-medium text-[#D4AF37]">Custom Studio</span>
        </div>
        <div className="flex items-center gap-5 text-zinc-400 font-medium">
          <Link
            href="/"
            className="hover:text-white transition-colors"
          >
            Marketplace
          </Link>
          <Link
            href="/activities"
            className="hover:text-white transition-colors"
          >
            Activities
          </Link>
          <Link
            href="/accommodations"
            className="hover:text-white transition-colors"
          >
            Accommodations
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto p-16 bg-[#121824]/40 rounded-2xl border border-white/[0.08] text-center backdrop-blur-md">
            <div className="animate-pulse text-[#D4AF37] font-mono tracking-widest text-xs">
              INITIALIZING ITINERARY STUDIO…
            </div>
          </div>
        }
      >
        <AdvancedJourneyBuilder />
      </Suspense>
    </div>
  );
}
