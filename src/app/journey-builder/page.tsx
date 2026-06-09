import JourneyPackageBuilder from '@/components/JourneyPackageBuilder';

export const metadata = {
  title: 'Journey Package Builder | Siwa Oasis',
  description: 'Create your own custom tour packages by combining accommodations, tours, food, and experiences.',
};

export default function JourneyBuilderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#556B2F] via-[#6B8E23] to-[#556B2F] py-12 px-4">
      <JourneyPackageBuilder />
    </div>
  );
}
