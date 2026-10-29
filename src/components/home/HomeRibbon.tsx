import React from 'react';
import Link from 'next/link';

/**
 * The top announcement ribbon — a slim bar above the header that points a
 * first-time visitor at the thing we most want them to do (browse services).
 *
 * It is driven entirely by `site_settings`, so the dashboard owns it and there
 * is no migration: every field has a market-neutral default and the bar is on
 * unless an admin explicitly turns it off (`ribbon_enabled === false`).
 */
export interface RibbonSettings {
  ribbon_enabled?: boolean;
  ribbon_text?: string;
  ribbon_text_ar?: string;
  ribbon_link?: string;
  ribbon_link_label?: string;
  ribbon_link_label_ar?: string;
  ribbon_color?: string;
  ribbon_text_color?: string;
}

const DEFAULT_TEXT_EN = 'New \u2014 Siwify is now the marketplace for properties & tourism all over Egypt.';
const DEFAULT_TEXT_AR = 'جديد \u2014 سيوِيفاي الآن سوق العقارات والسياحة في كل أنحاء مصر.';

// Only local paths, fragments and absolute http(s) are safe to render as a link.
function safeHref(href: string | undefined, fallback: string): string {
  const value = (href ?? '').trim();
  if (!value) return fallback;
  const ok = (value.startsWith('/') && !value.startsWith('//')) || value.startsWith('#') || /^https:\/\//i.test(value);
  return ok ? value : fallback;
}

export default function HomeRibbon({ settings, ar }: { settings?: RibbonSettings | null; ar: boolean }) {
  if (settings?.ribbon_enabled === false) return null;

  const text = (ar ? settings?.ribbon_text_ar || settings?.ribbon_text : settings?.ribbon_text)
    || (ar ? DEFAULT_TEXT_AR : DEFAULT_TEXT_EN);

  const fallbackHref = ar ? '/categories' : '/en/categories';
  const href = safeHref(settings?.ribbon_link, fallbackHref);
  const label = (ar ? settings?.ribbon_link_label_ar || settings?.ribbon_link_label : settings?.ribbon_link_label)
    || (ar ? 'تصفّح التصنيفات' : 'Browse categories');

  // Colours come from the dashboard and end up in inline styles, so they are
  // trusted only when they look like colours; otherwise the brand defaults win.
  const isColor = (v?: string) => !!v && (/^#[0-9a-f]{3,8}$/i.test(v.trim()) || /^rgba?\([0-9.,\s%]+\)$/i.test(v!.trim()));
  const accent = isColor(settings?.ribbon_color) ? settings!.ribbon_color!.trim() : '#D4AF37';
  const textColor = isColor(settings?.ribbon_text_color) ? settings!.ribbon_text_color!.trim() : '#f8fafc';

  return (
    <aside
      dir={ar ? 'rtl' : 'ltr'}
      style={{
        background: 'linear-gradient(90deg, #0B1120 0%, #131c2e 50%, #0B1120 100%)',
        borderBottom: `1px solid ${accent}55`,
        color: textColor,
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0.55rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          textAlign: 'center',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: accent,
            boxShadow: `0 0 0 3px ${accent}33`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.2px', lineHeight: 1.5 }}>
          {text}
        </span>
        <Link
          href={href}
          style={{
            fontSize: '0.78rem',
            fontWeight: 900,
            color: '#0B1120',
            background: accent,
            textDecoration: 'none',
            padding: '0.32rem 0.8rem',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Link>
      </div>
    </aside>
  );
}
