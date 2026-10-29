import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDeveloperBySlug, getDeveloperCorporate } from '@/lib/developers';
import { getDevelopmentsByDeveloperId, listRootPinnedSlugs } from '@/lib/developments';
import { getMarketBySlug } from '@/lib/markets';
import { compareDevelopments } from '@/lib/development-compare';
import ProjectComparisonTable from './ProjectComparisonTable';

/**
 * A developer's whole portfolio, presented.
 *
 * This is the body of the developer page with the routing decision taken out:
 * it is fed a slug and a language and answers with the portfolio. Two entry
 * points share it — the rule-based /developers/{slug} page, and an admin-chosen
 * root vanity (siwify.com/{slug}) resolved in the flat [slug] router. One source
 * of markup means the two can never drift.
 *
 * The differentiator it serves is the question a listing portal cannot answer:
 * "I like what this developer built — what else have they built, and how does it
 * compare?" Everything reuses the project-comparison engine.
 */

const STRINGS = {
  ar: {
    projects: 'مشروعات المطوّر',
    projectCount: (n: number) => `${n} مشروع`,
    portfolioLead: 'أبرز مشروعات هذا المطوّر جنبًا إلى جنب.',
    none: 'لا توجد مشروعات منشورة لهذا المطوّر بعد.',
    corporate: 'الموقع الرسمي للشركة',
    compareAll: 'قارن كل المشروعات',
    handover: 'التسليم',
    view: 'صفحة المشروع',
  },
  en: {
    projects: 'Developer projects',
    projectCount: (n: number) => `${n} project${n === 1 ? '' : 's'}`,
    portfolioLead: 'This developer\u2019s projects, side by side.',
    none: 'No published projects for this developer yet.',
    corporate: 'Official company site',
    compareAll: 'Compare all projects',
    handover: 'Handover',
    view: 'Project page',
  },
};

export default async function DeveloperPortfolio({ slug, ar }: { slug: string; ar: boolean }) {
  const t = STRINGS[ar ? 'ar' : 'en'];
  const localePrefix = ar ? '' : '/en';

  const developer = await getDeveloperBySlug(slug);
  if (!developer) notFound();

  // The brand's corporate home, when the admin linked one. Absent (or before
  // migration 20261109) simply means no band — the portfolio still renders.
  const corporate = await getDeveloperCorporate(developer.slug);

  const projects = await getDevelopmentsByDeveloperId(developer.id);

  // A project the admin pinned at the root is offered at its short address
  // (siwify.com/{slug}); everything else keeps the /{market}/{slug} rule.
  const pinnedSlugs = await listRootPinnedSlugs(projects.map((p) => p.id));
  const projectHref = (p: (typeof projects)[number]) =>
    pinnedSlugs.has(p.slug) ? `${localePrefix}/${p.slug}` : `${localePrefix}/${p.marketId}/${p.slug}`;

  // A developer spans markets, so each card prints its own location and the
  // header lists the markets the brand is actually present in. Resolve each
  // distinct market once — its display name and whether its door is open.
  const marketInfo = new Map<string, { label: string; active: boolean }>();
  await Promise.all(
    [...new Set(projects.map((p) => p.marketId))].map(async (id) => {
      const market = await getMarketBySlug(id);
      marketInfo.set(id, {
        label: ar ? market?.nameAr || id : market?.nameEn || id,
        active: Boolean(market?.active),
      });
    })
  );
  const presentMarkets = [...new Set(projects.map((p) => p.marketId))];

  // The comparison table is the point, but only when there is something to
  // compare; one project gets a plain card, and the engine caps at four anyway.
  const compareIds = projects.slice(0, 4).map((p) => p.id);
  const comparison = projects.length >= 2 ? await compareDevelopments(compareIds) : [];

  const name = ar ? developer.nameAr || developer.name : developer.name;
  const about = ar ? developer.aboutAr || developer.about : developer.about;

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#FFFFFF', color: '#0F172A' }}>
      <header style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          {developer.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={developer.logoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', background: '#F8FAFC' }} />
          ) : null}
          <div>
            <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900 }}>{name}</h1>
            <p style={{ margin: '0.3rem 0 0', color: '#64748B', fontSize: '0.9rem' }}>{t.projectCount(projects.length)}</p>
          </div>
        </div>
        {about ? <p style={{ margin: '1rem 0 0', color: '#334155', fontSize: '0.95rem', lineHeight: 1.7 }}>{about}</p> : null}
        {presentMarkets.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#94A3B8', letterSpacing: '0.5px' }}>
              {(ar ? 'متواجد في' : 'PRESENT IN').toUpperCase()}:
            </span>
            {presentMarkets.map((id) => {
              const info = marketInfo.get(id);
              const chip = (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.7rem',
                    borderRadius: 999,
                    background: info?.active ? '#EFF6FF' : '#F1F5F9',
                    color: info?.active ? '#0F4C81' : '#94A3B8',
                  }}
                >
                  {info?.label || id}
                </span>
              );
              // A dark market door 404s, so it is shown as a plain label, never a link.
              return info?.active ? (
                <Link key={id} href={`${localePrefix}/${id}`} style={{ textDecoration: 'none' }}>
                  {chip}
                </Link>
              ) : (
                <span key={id}>{chip}</span>
              );
            })}
          </div>
        )}
      </header>

      {corporate && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 0.5rem' }}>
          <Link
            href={`${localePrefix}${corporate.path}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              color: '#0F4C81',
              fontWeight: 900,
              fontSize: '0.85rem',
              border: '1px solid #E2E8F0',
              background: '#FCFDFE',
              borderRadius: 12,
              padding: '0.55rem 0.9rem',
            }}
          >
            <i className="fas fa-building-shield"></i>
            {t.corporate}: {ar ? corporate.nameAr || corporate.name : corporate.name} {ar ? '←' : '→'}
          </Link>
        </section>
      )}

      {projects.length === 0 ? (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>{t.none}</p>
        </section>
      ) : (
        <>
          {comparison.length >= 2 && (
            <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 1.5rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '0 0 1rem' }}>{t.portfolioLead}</h2>
              <ProjectComparisonTable projects={comparison} ar={ar} currency="EGP" />
            </section>
          )}

          <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0 }}>{t.projects}</h2>
              {projects.length >= 2 && (
                <Link
                  href={`${localePrefix}/compare/projects?ids=${compareIds.join(',')}`}
                  style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0F4C81', textDecoration: 'none' }}
                >
                  {t.compareAll} →
                </Link>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {projects.map((p) => {
                const title = ar ? p.nameAr || p.nameEn : p.nameEn || p.nameAr;
                return (
                  <Link
                    key={p.id}
                    href={projectHref(p)}
                    style={{
                      display: 'block',
                      border: '1px solid #E2E8F0',
                      borderRadius: 16,
                      padding: '1rem 1.1rem',
                      textDecoration: 'none',
                      color: '#0F172A',
                      background: '#FCFDFE',
                    }}
                  >
                    <div style={{ fontSize: '1rem', fontWeight: 900 }}>{title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.4rem' }}>
                      <i className="fas fa-location-dot" style={{ marginRight: 4, color: '#94A3B8' }}></i>
                      {marketInfo.get(p.marketId)?.label || p.marketId}
                      {p.deliveryYear ? ` · ${t.handover} ${p.deliveryYear}` : ''}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#0F4C81', fontWeight: 800, marginTop: '0.6rem' }}>{t.view} →</div>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
