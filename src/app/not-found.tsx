import Link from 'next/link';

/**
 * Global 404. Unknown slugs used to render a "this page is unavailable"
 * exploration screen with HTTP 200, which kept dead URLs alive in search.
 * This one is honest, bilingual, and routes the visitor somewhere useful.
 */
export default function NotFound() {
  // The sector hubs these used to point at were retired: they answered 200
  // with an empty grid and now 308 to the same category doors listed here, so
  // linking to them from a 404 would be a redirect chain on every click.
  const hubs = [
    { href: '/siwa', ar: 'دليل الأنشطة', en: 'Directory' },
    { href: '/siwa?category=accommodation', ar: 'الإقامة', en: 'Stays' },
    { href: '/siwa?category=adventure', ar: 'رحلات وسفاري', en: 'Trips' },
    { href: '/categories', ar: 'كل القطاعات', en: 'All categories' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F172A',
        color: '#FFFFFF',
        fontFamily: "'Cairo', 'Noto Sans Arabic', 'Inter', sans-serif",
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <div style={{ fontSize: '0.7rem', letterSpacing: '4px', opacity: 0.5, fontWeight: 900 }}>404</div>
        <h1 style={{ margin: '0.75rem 0 0.5rem', fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', fontWeight: 900 }}>
          هذه الصفحة غير موجودة
        </h1>
        <p style={{ margin: '0 0 0.35rem', opacity: 0.75, fontSize: '0.95rem' }}>This page could not be found.</p>
        <p style={{ margin: '0 0 2rem', opacity: 0.55, fontSize: '0.85rem', lineHeight: 1.7 }}>
          ربما تغيّر الرابط أو أن النشاط لم يُنشر بعد.
          <br />
          The link may have changed, or the business has not been published yet.
        </p>

        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {hubs.map((hub) => (
            <Link
              key={hub.href}
              href={hub.href}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: 10,
                border: '1px solid rgba(212,175,55,0.35)',
                color: '#F5E6AD',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
              }}
            >
              {hub.ar} · {hub.en}
            </Link>
          ))}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              background: '#D4AF37',
              color: '#0F172A',
              padding: '0.7rem 1.5rem',
              borderRadius: 10,
              fontWeight: 900,
              fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            سيوايفاي · Siwify
          </Link>
        </div>
      </div>
    </div>
  );
}
