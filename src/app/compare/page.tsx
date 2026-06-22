'use client';

import { Suspense, useState } from 'react';
import ComparisonTable from '@/components/ComparisonTable';
import { useSearchParams } from 'next/navigation';

function ComparisonPageContent() {
  const searchParams = useSearchParams();
  const businessIdsParam = searchParams.get('businesses');
  const sectionsParam = searchParams.get('sections');

  const businessIds = businessIdsParam ? businessIdsParam.split(',').filter(Boolean) : [];
  const sectionIds = sectionsParam ? sectionsParam.split(',').filter(Boolean) : undefined;

  if (businessIds.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Businesses to Compare</h2>
          <p className="text-gray-600 mb-6">
            Select multiple businesses from search results to compare them side-by-side.
          </p>
          <a
            href="/search/vibe-search"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-8 rounded-lg transition"
          >
            Go to Search →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ComparisonTable
        businessIds={businessIds}
        sectionIds={sectionIds}
      />
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Compare Businesses</h1>
          <p className="text-amber-100 mb-4">
            Side-by-side comparison to help you choose the best option
          </p>
          <div className="bg-amber-600 bg-opacity-50 rounded-lg p-3 text-sm">
            <p className="font-semibold mb-2">📋 Comparison Rules:</p>
            <ul className="text-amber-50 space-y-1 text-xs">
              <li>✓ <strong>Same Business Type:</strong> Compare all sections (Pricing, Hours, Team, etc.)</li>
              <li>✓ <strong>Different Types:</strong> Compare universal sections only (Vibe, Experience, Investment Opportunity)</li>
              <li>✓ Select 2-10 businesses to compare</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Content */}
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading comparison...</p>
            </div>
          </div>
        }
      >
        <ComparisonPageContent />
      </Suspense>
    </div>
  );
}
