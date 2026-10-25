import type { Metadata } from 'next';
import SectorHub from '@/components/SectorHub';
import { sectorMetadata } from '@/lib/sector-seo';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Promise<Metadata> {
  return sectorMetadata('siwa-go');
}

export default function SiwaGoPage() {
  return <SectorHub slug="siwa-go" />;
}
