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
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]">Marketplace</p>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm ${activePath === link.href ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'} transition-colors`}
              aria-current={activePath === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={adminPath}
            className="rounded-full bg-[#D4AF37] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black hover:bg-[#c49f31] transition"
          >
            Moderate
          </Link>
        </div>
      </div>
    </header>
  );
}
