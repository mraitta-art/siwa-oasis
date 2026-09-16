import CategorySearchPage from '@/components/CategorySearchPage';

export const dynamic = 'force-dynamic';

export default function ActivitiesPage() {
  return (
    <CategorySearchPage
      category="activity"
      label="Activities"
      title="Experience the oasis your way"
      description="Find desert adventures, cultural experiences, wellness activities, and memorable things to do using the full activity search criteria."
      accent="#16a34a"
    />
  );
}
