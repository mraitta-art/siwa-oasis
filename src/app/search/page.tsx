'use client';
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/**
 * /search is no longer a standalone global search page.
 * Search is handled inside each category page via the site-builder search_bar component.
 * This route redirects to the appropriate category page based on the ?category= param.
 */

const CATEGORY_MAP: Record<string, string> = {
  accommodation: '/accommodations',
  accommodations: '/accommodations',
  activity: '/activities',
  activities: '/activities',
  food: '/food-beverage',
  'food-beverage': '/food-beverage',
  restaurant: '/restaurants',
  restaurants: '/restaurants',
  transportation: '/transportation',
  transport: '/transportation',
  wellness: '/crafts-wellness',
  crafts: '/crafts-wellness',
  'crafts-wellness': '/crafts-wellness',
  services: '/services',
  blog: '/blog',
  offers: '/offers',
  packages: '/packages',
  journeys: '/journeys',
};

function SearchRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const category = (params.get('category') || '').toLowerCase().trim();
  const q = params.get('q') || '';

  useEffect(() => {
    const destination = CATEGORY_MAP[category] || '/';
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    router.replace(`${destination}${qs}`);
  }, [router, category, q]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#070B12' }}
    >
      <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#070B12' }}>
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchRedirect />
    </Suspense>
  );
}
