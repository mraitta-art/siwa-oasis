'use client';
export const dynamic = 'force-dynamic';

import JourneyPackageBuilder from '@/components/JourneyPackageBuilder';

export default function JourneyBuilderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#556B2F] via-[#6B8E23] to-[#556B2F] py-12 px-4">
      <JourneyPackageBuilder />
    </div>
  );
}
