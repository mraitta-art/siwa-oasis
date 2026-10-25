import BrandSectorPage from '@/components/BrandSectorPage';
import SectorArticle from '@/components/SectorArticle';
import { pathLocale } from '@/lib/site-locale';
import type { SectorHubSlug } from '@/lib/sector-content';

/**
 * A sector hub is half editorial (both languages) and half directory UI (English
 * only, and it is a client component so it has no server-rendered text at all).
 *
 * Under /ar the Arabic article comes first and the directory follows under a
 * label that says so, rather than sitting above an Arabic article while looking
 * Arabic itself. The directory keeps `dir="ltr"` so it does not inherit the
 * document's rtl.
 */
export default async function SectorHub({ slug }: { slug: SectorHubSlug }) {
  const ar = (await pathLocale()) === 'ar';

  if (!ar) {
    return (
      <>
        <BrandSectorPage slug={slug} />
        <SectorArticle slug={slug} />
      </>
    );
  }

  return (
    <>
      <SectorArticle slug={slug} />
      <section dir="ltr" lang="en" style={{ background: '#f8fafc', borderTop: '1px solid #eef2f7' }}>
        <div
          dir="rtl"
          lang="ar"
          style={{ maxWidth: 880, margin: '0 auto', padding: '1.6rem 1.1rem 0.2rem' }}
        >
          <h2 style={{ margin: '0 0 0.45rem', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
            دليل البحث والتصفية
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.75, color: '#64748b' }}>
            واجهة البحث أدناه بالإنجليزية حتى الآن. النتائج نفسها تعمل كما هي، وكل بطاقة تفتح صفحة النشاط.
          </p>
        </div>
        <BrandSectorPage slug={slug} />
      </section>
    </>
  );
}
