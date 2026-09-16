import CategorySearchPage from '@/components/CategorySearchPage';

export const dynamic = 'force-dynamic';

export default function AccommodationsPage() {
  return (
    <CategorySearchPage
      category="accommodation"
      label="Accommodation"
      title="Find the perfect place to stay in Siwa"
      description="Search across eco-lodges, boutique hotels, heritage stays, camps, and desert retreats, then browse packages, offers, and discounts from each business."
      accent="#92400e"
    />
  );
}
