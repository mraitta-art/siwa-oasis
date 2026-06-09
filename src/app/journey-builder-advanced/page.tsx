import AdvancedJourneyBuilder from '@/components/AdvancedJourneyBuilder';

export const metadata = {
  title: 'Advanced Journey Builder | Siwa Oasis',
  description: 'Create detailed day-by-day itineraries with multiple activities per day at specific times.',
};

export default function AdvancedJourneyBuilderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#556B2F] via-[#6B8E23] to-[#556B2F] py-12 px-4">
      <AdvancedJourneyBuilder />
    </div>
  );
}
