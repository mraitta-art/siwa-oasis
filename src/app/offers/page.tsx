import SectionAggregationPage from '@/components/SectionAggregationPage';

export const dynamic = 'force-dynamic';

export default function MainSiteOffersPage() {
  return (
    <SectionAggregationPage
      sectionId="sec_8_connector"
      pageConfigId="website_offers"
      pageLabel="Special Offers & Deals"
      description="Flash sales, seasonal markdowns, and exclusive promotions from verified Siwa businesses. Book direct at 0% commission — prices you won't find anywhere else."
      accentColor="#dc2626"
      ctaLabel="View Offers"
      showPartnerCta
    />
  );
}
