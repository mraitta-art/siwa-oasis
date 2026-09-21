import { Suspense } from 'react';
import Link from 'next/link';
import AdvancedJourneyBuilder from '@/components/AdvancedJourneyBuilder';

export const metadata = {
  title: 'Custom Journey & Expedition Builder | Siwa Oasis',
  description: 'Create detailed day-by-day itineraries with multiple activities per day at specific times.',
};

export default function AdvancedJourneyBuilderPage() {
  return (
    <div className="min-h-screen bg-[#070b12] text-white py-8 px-4 sm:px-6 lg:px-8">
      {/* Main Site Header Anchor */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/journeys"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#D4AF37] hover:text-[#f0c842] transition-colors"
          >
            ← Back to Journeys &amp; Expeditions
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-xs font-bold text-gray-300">Custom Itinerary Studio</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-extrabold text-gray-400 hover:text-white transition-colors"
          >
            🏠 Main Marketplace
          </Link>
          <Link
            href="/activities"
            className="text-xs font-extrabold text-gray-400 hover:text-white transition-colors"
          >
            🐪 Activities
          </Link>
          <Link
            href="/accommodations"
            className="text-xs font-extrabold text-gray-400 hover:text-white transition-colors"
          >
            🏨 Stays
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto p-12 bg-[#090e17] rounded-2xl border border-white/10 text-center">
            <div className="animate-pulse text-[#D4AF37] font-black tracking-widest text-sm">
              LOADING ITINERARY STUDIO…
            </div>
          </div>
        }
      >
        <AdvancedJourneyBuilder />
      </Suspense>
    </div>
  );
}
