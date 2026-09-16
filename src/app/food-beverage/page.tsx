import CategorySearchPage from '@/components/CategorySearchPage';

export const dynamic = 'force-dynamic';

export default function FoodBeveragePage() {
  return (
    <CategorySearchPage
      category="food"
      label="Food & Beverage"
      title="Discover Siwa's food and beverage businesses"
      description="Explore restaurants, traditional kitchens, cafes, bakeries, catering services, food trucks, dessert shops, and juice bars, then compare their business deals."
      accent="#b45309"
    />
  );
}