import Link from 'next/link';
import type { MarketDeveloper } from '@/lib/developers';

/**
 * "These brands build here" — a strip of developer cards.
 *
 * One piece of markup serves both the market door and the zone page; each caller
 * supplies its own accurate list (market-level or zone-level) and the theme that
 * matches the page it sits on. The links always use the rule address
 * /developers/{slug}, never a vanity — a market page has no business guessing
 * which brand an admin chose to pin at the root.
 */

const STRINGS = {
  ar: {
    heading: 'المطوّرون هنا',
    projects: (n: number) => `${n} مشروع`,
  },
  en: {
    heading: 'Developers building here',
    projects: (n: number) => `${n} project${n === 1 ? '' : 's'}`,
  },
};

export default function DeveloperGrid({
  developers,
  ar,
  localePrefix,
  theme = 'light',
}: {
  developers: MarketDeveloper[];
  ar: boolean;
  localePrefix: string;
  theme?: 'dark' | 'light';
}) {
  if (!developers || developers.length === 0) return null;
  const t = STRINGS[ar ? 'ar' : 'en'];
  const dark = theme === 'dark';

  const titleColor = dark ? 'rgba(255,255,255,0.92)' : '#0F172A';
  const labelColor = dark ? 'rgba(255,255,255,0.45)' : '#94A3B8';
  const cardBorder = dark ? 'rgba(255,255,255,0.14)' : '#E2E8F0';
  const cardBg = dark ? 'rgba(255,255,255,0.04)' : '#FCFDFE';
  const subColor = dark ? 'rgba(255,255,255,0.6)' : '#64748B';

  return (
    <section
      dir={ar ? 'rtl' : 'ltr'}
      style={{ maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem 2rem' }}
    >
      <div
        style={{
          fontSize: '0.66rem',
          letterSpacing: '3px',
          fontWeight: 900,
          color: labelColor,
          marginBottom: '0.75rem',
        }}
      >
        {t.heading.toUpperCase()}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {developers.map((d) => {
          const name = ar ? d.nameAr || d.name : d.name;
          return (
            <Link
              key={d.id}
              href={`${localePrefix}/developers/${d.slug}`}
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                border: `1px solid ${cardBorder}`,
                borderRadius: 14,
                padding: '0.7rem 0.85rem',
                background: cardBg,
                color: titleColor,
              }}
            >
              {d.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.logoUrl}
                  alt=""
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    objectFit: 'contain',
                    background: dark ? 'rgba(255,255,255,0.9)' : '#F8FAFC',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: dark ? 'rgba(255,255,255,0.1)' : '#F1F5F9',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i className="fas fa-building" style={{ color: subColor }}></i>
                </span>
              )}
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {name}
                </span>
                <span style={{ display: 'block', fontSize: '0.72rem', color: subColor }}>
                  {t.projects(d.projects)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
