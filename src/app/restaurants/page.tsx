import CategorySearchPage from '@/components/CategorySearchPage';

export const dynamic = 'force-dynamic';

export default function RestaurantsPage() {
  return (
    <CategorySearchPage
      category="restaurant"
      label="Restaurants"
      title="Taste the flavors of Siwa"
      description="Discover Siwan kitchens, desert cafes, traditional meals, and local dining experiences using the full restaurant search criteria."
      accent="#dc2626"
    />
  );
}
