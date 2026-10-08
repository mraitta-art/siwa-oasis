'use client';

import { Suspense } from 'react';
import CategorySearchPage from '@/components/CategorySearchPage';

function ServicesAggregation() {
  return (
    <CategorySearchPage
      category="services"
      sectionId="sec_6_guardian"
      label="Services & Operations"
      title="Services across Siwa businesses"
      description="Find operators and service providers for accommodation, dining, journeys, tours, transport, production, and local operations."
      accent="#64748b"
    />
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#D4AF37', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '3px', animation: 'pulse 1.5s ease-in-out infinite' }}>
          LOADING SERVICES…
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>
    }>
      <ServicesAggregation />
    </Suspense>
  );
}
