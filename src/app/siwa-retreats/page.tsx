import type { Metadata } from 'next';
import SectorHub from '@/components/SectorHub';
import { sectorMetadata } from '@/lib/sector-seo';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Promise<Metadata> {
  return sectorMetadata('siwa-retreats');
}

export default function SiwaRetreatsPage() {
  return <SectorHub slug="siwa-retreats" />;
}