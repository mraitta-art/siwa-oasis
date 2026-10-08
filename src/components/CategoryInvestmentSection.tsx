'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface InvestmentProvider {
  id: string;
  name: string;
  slug?: string | null;
}

interface CategoryInvestment {
  id: string;
  business_id: string;
  business_name: string;
  business_slug: string | null;
  owner_type?: 'platform' | 'vendor';
  type_name: string | null;
  opportunity_title: string;
  opportunity_type: string;
  investment_amount_min: number | null;
  investment_amount_max: number | null;
  expected_roi_percent: number | null;
  currency?: string;
  providers?: InvestmentProvider[];
}

function formatAmount(value: number | null, currency: string): string {
  return value === null ? 'By inquiry' : `${currency} ${Number(value).toLocaleString()}`;
}

export default function CategoryInvestmentSection({ typeId, label }: { typeId: string; label: string }) {
  const [items, setItems] = useState<CategoryInvestment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/discovery/investments?type=${encodeURIComponent(typeId)}&limit=12`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : { items: [] })
      .then(data => setItems(Array.isArray(data.items) ? data.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [typeId]);

  return (
    <section className="category-investments" aria-labelledby="category-investments-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">INVEST IN SIWA</p>
          <h2 id="category-investments-title">Investment &amp; partnerships · {label}</h2>
        </div>
        <Link href={`/investment-opportunities?type=${encodeURIComponent(typeId)}`}>All opportunities</Link>
      </div>
      {loading ? (
        <p className="state" role="status">Loading opportunities…</p>
      ) : items.length === 0 ? (
        <p className="state">No approved investment opportunities in this category yet.</p>
      ) : (
        <div className="investment-grid">
          {items.map(item => {
            const providers = item.providers || [];
            const ownerHref = item.business_slug ? `/${item.business_slug}#investment-opportunity` : '/investment-opportunities';
            return (
              <article className="investment-card" key={`${item.owner_type || 'vendor'}-${item.id}`}>
                <p className="category">{item.type_name || label} · {item.opportunity_type.replace(/_/g, ' ')}</p>
                <h3>{item.opportunity_title}</h3>
                <p className="owner">Offered by <strong>{item.owner_type === 'platform' ? 'Siwify' : item.business_name}</strong></p>
                <div className="terms">
                  <span>{formatAmount(item.investment_amount_min, item.currency || 'USD')} – {formatAmount(item.investment_amount_max, item.currency || 'USD')}</span>
                  {item.expected_roi_percent !== null && <strong>{item.expected_roi_percent}% expected ROI</strong>}
                </div>
                <div className="providers">
                  <span>Available at</span>
                  {providers.length > 0 ? providers.slice(0, 3).map(provider => provider.slug ? (
                    <Link key={provider.id} href={`/${provider.slug}#investment-opportunity`}>{provider.name}</Link>
                  ) : <span key={provider.id}>{provider.name}</span>) : (
                    <span>{item.owner_type === 'platform' ? 'Siwify direct' : item.business_name}</span>
                  )}
                  {providers.length > 3 && <span>+{providers.length - 3} more</span>}
                </div>
                <Link className="owner-link" href={ownerHref}>View opportunity</Link>
              </article>
            );
          })}
        </div>
      )}
      <style jsx>{`
        .category-investments { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem 3rem; color: #17251d; }
        .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
        .eyebrow { margin: 0 0 0.4rem; color: #9a6a24; font-size: 0.68rem; font-weight: 850; letter-spacing: 1px; }
        h2 { margin: 0; font-size: 1.3rem; }
        .section-heading > a { color: #28543c; font-size: 0.75rem; font-weight: 800; }
        .investment-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.8rem; }
        .investment-card { display: flex; flex-direction: column; min-width: 0; border: 1px solid #dce5de; border-radius: 6px; background: #fff; padding: 1rem; }
        .category { margin: 0 0 0.45rem; color: #92612a; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
        h3 { margin: 0; font-size: 1rem; line-height: 1.4; }
        .owner { margin: 0.45rem 0 0; color: #607165; font-size: 0.75rem; }
        .owner strong { color: #234b37; }
        .terms { display: grid; gap: 0.3rem; margin: 0.8rem 0; color: #355c43; font-size: 0.73rem; }
        .providers { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: auto; border-top: 1px solid #e8eee9; padding-top: 0.7rem; }
        .providers > span:first-child { flex-basis: 100%; color: #77867b; font-size: 0.64rem; font-weight: 850; text-transform: uppercase; }
        .providers a, .providers > span:not(:first-child) { border: 1px solid #dbe7dd; border-radius: 3px; padding: 0.25rem 0.4rem; color: #2c5741; font-size: 0.68rem; }
        .owner-link { display: block; margin-top: 0.75rem; border-radius: 4px; background: #1b4335; padding: 0.6rem; color: #fff; font-size: 0.72rem; font-weight: 800; text-align: center; text-decoration: none; }
        .state { border: 1px dashed #c8d4ca; padding: 1.5rem 1rem; color: #617367; text-align: center; }
        @media (max-width: 620px) { .section-heading { align-items: start; flex-direction: column; } }
      `}</style>
    </section>
  );
}
