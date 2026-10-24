import type { Metadata } from 'next';
import BrandSectorPage from '@/components/BrandSectorPage';
import SectorArticle from '@/components/SectorArticle';
import { sectorMetadata } from '@/lib/sector-seo';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Promise<Metadata> {
  return sectorMetadata('siwa-go');
}

export default function SiwaGoPage() {
  return (
    <>
      <BrandSectorPage slug="siwa-go" />
      <SectorArticle slug="siwa-go" />
    </>
  );
}
