import CommercialMarketplacePage from '@/components/CommercialMarketplacePage';

export const dynamic = 'force-dynamic';

export default function MainSiteOffersPage() {
  return (
    <CommercialMarketplacePage
      title="Offers, Packages & Discounts"
      description="Discover Siwify-created deals and offers from local businesses, with participating providers clearly shown. Filter by business category or type."
      pageConfigId="website_offers"
      accentColor="#bb6742"
    />
  );
}
