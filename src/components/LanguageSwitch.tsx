'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * A one-tap jump to the same page in the other language.
 *
 * Arabic owns the bare address and English lives under `/en`, so the switch is
 * pure path arithmetic and needs no server round-trip: `/siwa` ⇄ `/en/siwa`,
 * `/` ⇄ `/en`. It reads the live path from the router, so the same header works
 * on every public page — home, market doors, listings and minisites alike — and
 * always points at the exact counterpart of the page you are looking at.
 */
export default function LanguageSwitch({
  labelAr = 'العربية',
  labelEn = 'English',
  color,
  borderColor,
}: {
  labelAr?: string;
  labelEn?: string;
  color?: string;
  borderColor?: string;
} = {}) {
  const pathname = usePathname() || '/';
  const isEnglish = pathname === '/en' || pathname.startsWith('/en/');

  // Arabic drops the /en prefix; English adds it.
  const target = isEnglish
    ? pathname.slice(3) || '/'
    : `/en${pathname === '/' ? '' : pathname}`;

  // Label the language you would land in, not the one you already read.
  const label = isEnglish ? labelAr : labelEn;

  return (
    <Link
      href={target}
      aria-label={label}
      title={label}
      style={{
        textDecoration: 'none',
        fontWeight: 800,
        fontSize: '0.76rem',
        letterSpacing: '0.3px',
        padding: '0.5rem 0.8rem',
        borderRadius: '999px',
        border: `1px solid ${borderColor || 'rgba(212, 175, 55, 0.35)'}`,
        color: color || 'inherit',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </Link>
  );
}
