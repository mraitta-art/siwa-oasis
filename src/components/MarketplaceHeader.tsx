'use client';

import Link from 'next/link';

interface NavLink {
  href: string;
  label: string;
}

interface MarketplaceHeaderProps {
  title: string;
  adminPath: string;
  activePath?: string;
  navLinks?: NavLink[];
}

const DEFAULT_NAV_LINKS: NavLink[] = [
  { href: '/offers', label: 'Offers' },
  { href: '/packages', label: 'Packages' },
  { href: '/discounts', label: 'Discounts' },
  { href: '/investment-opportunities', label: 'Investments' },
];

export default function MarketplaceHeader({
  title,
  adminPath,
  activePath,
  navLinks = DEFAULT_NAV_LINKS,
}: MarketplaceHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#0f172a]/85 backdrop-blur-xl shadow-[0_12px_35px_rgba(15,23,42,0.18)]">
      <div className="page-shell flex flex-wrap items-center justify-between gap-4 py-4">
        <div>
          <p className="premium-kicker text-[10px] text-[#f5d56a]">Marketplace</p>
          <h1 className="text-xl font-black tracking-tight text-white">{title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {navLinks.map((link) => {
            const active = activePath === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-[#f5d56a] text-slate-900 shadow-[0_8px_24px_rgba(245,213,106,0.35)]'
                    : 'text-slate-200 hover:bg-white/5 hover:text-white'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            href={adminPath}
            className="rounded-full bg-[#f5d56a] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-900 transition hover:bg-[#f1c94b]"
          >
            Moderate
          </Link>
        </div>
      </div>
    </header>
  );
}
