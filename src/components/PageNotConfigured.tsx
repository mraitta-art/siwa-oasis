'use client';

import Link from 'next/link';

interface PageNotConfiguredProps {
  pageName?: string;
  pageId?: string; // e.g. "accommodations" — used to deep-link into the builder
}

/**
 * Shown whenever a public page has no layout configured in the Jana site builder.
 * Admins see a link to configure the page; guests see a clean "coming soon" screen.
 */
export default function PageNotConfigured({ pageName, pageId }: PageNotConfiguredProps) {
  const builderUrl = pageId
    ? `/jana/website?page=${pageId}`
    : '/jana/website';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: '#070B12' }}
    >
      {/* Brand mark */}
      <div className="flex items-center gap-3 mb-10">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center text-black shadow-lg shadow-[#D4AF37]/20"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #8C6D1F)' }}
        >
          <i className="fas fa-sun text-sm" />
        </span>
        <span
          className="text-sm font-black tracking-[0.3em]"
          style={{ background: 'linear-gradient(90deg, #fff, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          SIWIFY
        </span>
      </div>

      {/* Icon */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}
      >
        <i className="fas fa-layer-group text-2xl" style={{ color: '#D4AF37' }} />
      </div>

      {/* Message */}
      <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
        {pageName ? `${pageName} — ` : ''}Page Not Configured
      </h1>
      <p className="text-sm text-zinc-400 max-w-sm leading-relaxed mb-8">
        This page has no layout yet. Use the Siwify Site Builder to add components and go live.
      </p>

      {/* CTA */}
      <Link
        href={builderUrl}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-black transition-all hover:brightness-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #D4AF37, #8C6D1F)' }}
      >
        <i className="fas fa-paint-brush text-xs" />
        Open Site Builder
      </Link>

      <Link href="/" className="mt-5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
        ← Back to homepage
      </Link>
    </div>
  );
}
