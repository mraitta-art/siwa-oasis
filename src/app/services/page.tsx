'use client';

import { Suspense } from 'react';
import SectionAggregationPage from '@/components/SectionAggregationPage';

function ServicesAggregation() {
  return (
    <SectionAggregationPage
      sectionId="sec_6_guardian"
      pageConfigId="website_services"
      pageLabel="Services & Operations Hub"
      description="Explore check-in policies, operating hours, licensing, management structures, and service offerings from every registered Siwa business — all in one place."
      accentColor="#64748b"
      ctaLabel="View Services"
      showPartnerCta
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
