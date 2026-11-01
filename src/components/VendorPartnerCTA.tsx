'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Partner CTA band on the platform landing pages and inside the CMS
 * (`partner_cta` section type).
 *
 * Every string in this component belongs to one language. Previously the
 * paragraph and both buttons were hardcoded English while the title and
 * subtitle were props, so the Arabic front door of the Egypt marketplace
 * rendered Arabic headline + English body + English buttons. That is what
 * this shape is designed to prevent.
 *
 * Language selection order:
 *   1. Explicit `ar` prop from the caller — the only reliable signal, because
 *      the caller knows the layout locale.
 *   2. Otherwise auto-detect from the title (Arabic Unicode range). This keeps
 *      existing CMS rows and seed scripts working without touching them.
 *   3. If neither yields a signal, default to English.
 *
 * Every string can still be overridden individually via props so a Siwa
 * category page can keep its vertical-specific copy while sharing the same
 * band component.
 */

interface Props {
  title?: string;
  subtitle?: string;
  body?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  /** Force the language. When omitted, the title is used to detect Arabic. */
  ar?: boolean;
}

// ─── Bilingual defaults ────────────────────────────────────────────────────
// Copy written for the Egypt-marketplace positioning (properties, location,
// tourism, accommodation, investment). The previous English defaults were
// Siwa-only ("organic dates, salt therapy, hand-embroidery") and did not fit
// the front door of a national marketplace.
const STR = {
  ar: {
    eyebrow: 'دعوة للشركاء',
    title: 'أصحاب الأنشطة في مصر؟',
    body:
      'سجّل نشاطك — عقار، موقع، إقامة، جولة سياحية أو فرصة استثمار — في دليل موثوق بالعربية والإنجليزية، على صفحة كاملة بنطاقك أو رابط خاص، وبدون أي عمولة على الحجوزات.',
    primary: 'سجّل نشاطك',
    secondary: 'الشروط والأحكام',
  },
  en: {
    eyebrow: 'Partner with SiWiFy',
    title: 'Own a business in Egypt?',
    body:
      'Register your business — property, location, accommodation, tour, or investment opportunity — on a verified bilingual directory, on your own domain or private link, with no commission on bookings.',
    primary: 'Register your business',
    secondary: 'Terms & statutes',
  },
} as const;

// Unicode property escape needs the `u` flag; feature-detect once so a legacy
// browser without it (unlikely on this site, but the try/catch costs nothing)
// does not throw at module load.
function looksArabic(text?: string | null): boolean {
  if (!text) return false;
  try {
    return /\p{Script=Arabic}/u.test(text);
  } catch {
    // Fallback for engines without Unicode property escapes: match the
    // Arabic block, Arabic Supplement, Arabic Extended-A and the Presentation
    // Forms used by some older CMS copy.
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  }
}

export default function VendorPartnerCTA({
  title,
  subtitle,
  body,
  primaryLabel,
  secondaryLabel,
  ar,
}: Props) {
  // Explicit prop wins. Otherwise the title decides; if there is no title
  // either, fall through to English.
  const useArabic = typeof ar === 'boolean' ? ar : looksArabic(title);
  const copy = useArabic ? STR.ar : STR.en;

  const resolvedTitle = title || copy.title;
  const resolvedSubtitle = subtitle || copy.eyebrow;
  const resolvedBody = body || copy.body;
  const resolvedPrimary = primaryLabel || copy.primary;
  const resolvedSecondary = secondaryLabel || copy.secondary;

  // Direction follows the resolved language so an Arabic block on an English
  // page (or the reverse) still reads right. The parent `<html dir>` already
  // sets this on a normal page; the inline `dir` is defensive for embedded
  // previews and admin tools that render this outside the document shell.
  const dir = useArabic ? 'rtl' : 'ltr';
  const lang = useArabic ? 'ar' : 'en';

  return (
    <div
      dir={dir}
      lang={lang}
      style={{ padding: '6rem 0', background: 'var(--bg)', borderTop: '1px solid var(--border-light)' }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>

        <div style={{
          position: 'relative',
          borderRadius: '40px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(255, 183, 0, 0.08) 0%, var(--bg-alt) 100%)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          padding: 'clamp(2.5rem, 8vw, 5rem)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '3rem',
          textAlign: useArabic ? 'right' : 'left',
        }}>
          {/* Visual absolute glows — mirrored so the wash sits on the leading edge */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            [useArabic ? 'right' : 'left']: '-50px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255,183,0,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Text Area */}
          <div style={{ flex: '1 1 500px', zIndex: 2 }}>
            <span style={{
              color: 'var(--gold)',
              fontWeight: 900,
              letterSpacing: useArabic ? '0' : '4px',
              fontSize: '0.75rem',
              textTransform: useArabic ? 'none' : 'uppercase',
              display: 'block',
              marginBottom: '1rem',
            }}>
              {resolvedSubtitle}
            </span>
            <h3 style={{
              color: 'var(--text)',
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 900,
              margin: '0 0 1.25rem 0',
              lineHeight: 1.15,
            }}>
              {resolvedTitle}
            </h3>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '1rem',
              lineHeight: 1.7,
              margin: 0,
              maxWidth: '650px',
            }}>
              {resolvedBody}
            </p>
          </div>

          {/* Buttons Area */}
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', zIndex: 2, alignItems: 'center' }}>
            <Link
              href="/be-a-partner"
              style={{
                padding: '1.25rem 2.5rem',
                background: 'var(--gold)',
                color: 'var(--dark)',
                textDecoration: 'none',
                borderRadius: '50px',
                fontWeight: 900,
                fontSize: '0.85rem',
                letterSpacing: useArabic ? '0' : '1px',
                boxShadow: '0 15px 30px rgba(255, 183, 0, 0.2)',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {resolvedPrimary}
            </Link>

            <Link
              href="/investment"
              style={{
                padding: '1.25rem 2.25rem',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                textDecoration: 'none',
                borderRadius: '50px',
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: useArabic ? '0' : '1px',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--bg-alt)';
                e.currentTarget.style.borderColor = 'var(--gold)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--card)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              {resolvedSecondary}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
