import CategorySearchPage from '@/components/CategorySearchPage';
import { BRAND_SECTORS, type BrandSectorSlug } from '@/lib/brand-sectors';

export default function BrandSectorPage({ slug }: { slug: BrandSectorSlug }) {
  const sector = BRAND_SECTORS[slug];
  return (
    <CategorySearchPage
      category={sector.category}
      sectionId={sector.sectionId}
      label={sector.label}
      title={sector.title}
      description={sector.description}
      accent={sector.accent}
    />
  );
}