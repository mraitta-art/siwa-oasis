import type { Metadata } from 'next';
import BrandSectorPage from '@/components/BrandSectorPage';
import SectorArticle from '@/components/SectorArticle';
import { sectorMetadata } from '@/lib/sector-seo';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Promise<Metadata> {
  return sectorMetadata('siwa-stay');
}

export default function SiwaStayPage() {
  return (
    <>
      <BrandSectorPage slug="siwa-stay" />
      <SectorArticle slug="siwa-stay" />
    </>
  );
}
