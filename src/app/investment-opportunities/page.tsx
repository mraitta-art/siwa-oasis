import SectionAggregationPage from '@/components/SectionAggregationPage';

export const dynamic = 'force-dynamic';

export default function MainSiteInvestmentOpportunitiesPage() {
  return (
    <SectionAggregationPage
      sectionId="sec_7_investment"
      pageConfigId="website_investment-opportunities"
      pageLabel="Investment & Partnerships"
      description="Explore B2B commercial land, joint ventures, exclusive auctions, and investment-grade real estate opportunities in Siwa Oasis. Connect directly with property and project owners."
      accentColor="#7c3aed"
      ctaLabel="View Opportunity"
      showPartnerCta={false}
    />
  );
}
