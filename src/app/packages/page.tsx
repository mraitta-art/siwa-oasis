import SectionAggregationPage from '@/components/SectionAggregationPage';

export const dynamic = 'force-dynamic';

export default function PackagesPage() {
  return (
    <SectionAggregationPage
      sectionId="sec_5_experiences"
      pageConfigId="website_packages"
      pageLabel="Packages & Journeys"
      description="Explore curated multi-day safaris, desert itineraries, cultural programs, and bookable experiences from Siwa's best guides and lodges. 0% booking commission."
      accentColor="#16a34a"
      ctaLabel="View Packages"
      showPartnerCta
      topContent={
        <div style={{
          background: '#0f172a', borderBottom: '1px solid rgba(212,175,55,0.25)',
          color: '#fff', padding: '0.75rem clamp(1rem, 3vw, 2rem)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '0.75rem', fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#D4AF37', fontWeight: 800 }}>✨ Want a custom itinerary?</span>
            <span style={{ color: 'rgba(255,255,255,0.65)' }} className="hidden sm:inline">
              Mix & match salt lakes, 4x4 dunes, and eco-lodges with instant 15% bundle discounts!
            </span>
          </div>
          <a
            href="/customize-journey"
            style={{
              background: '#D4AF37', color: '#000',
              padding: '0.4rem 1.25rem', borderRadius: '50px',
              fontWeight: 800, textDecoration: 'none', fontSize: '0.78rem',
            }}
          >
            Customize Now →
          </a>
        </div>
      }
    />
  );
}
