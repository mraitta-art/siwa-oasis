import CategorySearchPage from '@/components/CategorySearchPage';

export const dynamic = 'force-dynamic';

export default function ProductionTradePage() {
  return (
    <CategorySearchPage
      category="production-trade"
      label="Production & Trade"
      title="Siwa Organic Dates, Olives & Pure Natural Products"
      description="Connect with certified Siwan date farms, cold-pressed olive oil mills, mineral salt producers, and agricultural export suppliers directly."
      accent="#16a34a"
    />
  );
}
