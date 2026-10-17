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
        .category-investments { max-width: 1200px; margin: 0 auto; padding: 3rem 1rem 4rem; color: #f8fafc; border-top: 1px solid rgba(255, 255, 255, 0.06); }
        .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
        .eyebrow { margin: 0 0 0.4rem; color: #D4AF37; font-size: 0.68rem; font-weight: 850; letter-spacing: 2px; }
        h2 { margin: 0; font-size: 1.3rem; font-weight: 800; color: #f8fafc; }
        .section-heading > a { color: #D4AF37; font-size: 0.75rem; font-weight: 800; text-decoration: none; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 2px; }
        .investment-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
        .investment-card { display: flex; flex-direction: column; min-width: 0; border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 14px; background: #0f172a; padding: 1.25rem; box-shadow: 0 4px 24px rgba(0,0,0,0.3); transition: transform 0.2s, box-shadow 0.2s; }
        .investment-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.2); }
        .category { margin: 0 0 0.45rem; color: #D4AF37; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        h3 { margin: 0; font-size: 1rem; line-height: 1.4; color: #f8fafc; font-weight: 700; }
        .owner { margin: 0.45rem 0 0; color: rgba(248, 250, 252, 0.6); font-size: 0.75rem; }
        .owner strong { color: #D4AF37; }
        .terms { display: grid; gap: 0.3rem; margin: 0.8rem 0; color: #10b981; font-size: 0.73rem; }
        .providers { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: auto; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 0.7rem; }
        .providers > span:first-child { flex-basis: 100%; color: rgba(248, 250, 252, 0.4); font-size: 0.64rem; font-weight: 850; text-transform: uppercase; letter-spacing: 0.5px; }
        .providers a, .providers > span:not(:first-child) { border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; padding: 0.25rem 0.5rem; color: rgba(248, 250, 252, 0.75); font-size: 0.68rem; background: rgba(255, 255, 255, 0.04); text-decoration: none; }
        .owner-link { display: block; margin-top: 0.85rem; border-radius: 8px; background: linear-gradient(135deg, #D4AF37 0%, #b89327 100%); padding: 0.65rem; color: #000; font-size: 0.72rem; font-weight: 850; text-align: center; text-decoration: none; letter-spacing: 0.5px; transition: opacity 0.15s; }
        .owner-link:hover { opacity: 0.9; }
        .state { border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 12px; background: rgba(15, 23, 42, 0.4); padding: 2rem 1rem; color: rgba(248, 250, 252, 0.45); text-align: center; font-size: 0.85rem; }
        @media (max-width: 620px) { .section-heading { align-items: start; flex-direction: column; } }
      `}</style>
    </section>
  );
}
