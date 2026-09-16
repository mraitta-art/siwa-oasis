import CategorySearchPage from '@/components/CategorySearchPage';

export const dynamic = 'force-dynamic';

export default function TransportationPage() {
  return (
    <CategorySearchPage
      category="transportation"
      label="Transportation"
      title="Move around Siwa with ease"
      description="Compare local transfers, 4x4 desert transport, tuk-tuks, rentals, and guided mobility services using the full transportation search criteria."
      accent="#b45309"
    />
  );
}
