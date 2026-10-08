'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import MarketplaceHeader from '@/components/MarketplaceHeader';

interface BusinessType {
  id: string;
  name: string;
  parent_id: string | null;
}

interface InvestmentOpportunity {
  business_id: string;
  business_name: string;
  business_slug: string | null;
  business_logo: string | null;
  owner_type?: 'platform' | 'vendor';
  type_name: string | null;
  currency?: string;
  providers?: Array<{ id: string; name: string; slug?: string | null; type_name?: string | null }>;
  opportunity_title: string;
  opportunity_type: string;
  investment_amount_min: number | null;
  investment_amount_max: number | null;
  expected_roi_percent: number | null;
  business_stage: string | null;
  investment_description: string | null;
  investment_highlights: string | null;
  target_investors: number | null;
  is_featured: boolean;
}

function formatAmount(value: number | null, currency: string): string {
  if (value === null || !Number.isFinite(Number(value))) return 'Contact for details';
  return `${currency} ${Number(value).toLocaleString()}`;
}

export default function InvestmentOpportunitiesPage({ brandName = 'Investment & Partnerships' }: { brandName?: string }) {
  const [parents, setParents] = useState<BusinessType[]>([]);
  const [children, setChildren] = useState<BusinessType[]>([]);
  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const [parentId, setParentId] = useState('');
  const [childId, setChildId] = useState('');
  const [search, setSearch] = useState('');
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/jana/website?id=website_investment-opportunities')
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        const config = Array.isArray(data) ? data[0] : data;
        const layout = [
          ...(config?.header_components || []),
          ...(config?.body_components || []),
          ...(config?.footer_components || []),
        ];
        if (!cancelled && layout.length > 0) setBuilderConfig({ ...config, layout });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const requestedType = new URLSearchParams(window.location.search).get('type');
    if (!requestedType) return;
    const parent = parents.find(type => type.id === requestedType);
    if (parent) {
      setParentId(parent.id);
      setChildId('');
      return;
    }
    const child = children.find(type => type.id === requestedType);
    if (child?.parent_id) {
      setParentId(child.parent_id);
      setChildId(child.id);
    }
  }, [parents, children]);

  useEffect(() => {
    let cancelled = false;
    async function loadTypes() {
      try {
        const parentResponse = await fetch('/api/business-types?is_parent=true');
        const parentData = parentResponse.ok ? await parentResponse.json() : [];
        const loadedParents: BusinessType[] = Array.isArray(parentData) ? parentData : [];
        const childResponse = loadedParents.length
          ? await fetch(`/api/business-types?parent_ids=${loadedParents.map(type => encodeURIComponent(type.id)).join(',')}`)
          : null;
        const childData = childResponse?.ok ? await childResponse.json() : [];
        if (!cancelled) {
          setParents(loadedParents);
          setChildren(Array.isArray(childData) ? childData : []);
        }
      } catch {
        if (!cancelled) setParents([]);
      }
    }
    loadTypes();
    return () => { cancelled = true; };
  }, []);

  const typeId = childId || parentId;

  useEffect(() => {
    let cancelled = false;
    async function loadOpportunities() {
      setLoading(true);
      setError('');
      const typeQuery = typeId ? `&type=${encodeURIComponent(typeId)}` : '';
      try {
        const response = await fetch(`/api/discovery/investments?limit=120${typeQuery}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Investment opportunities could not be loaded.');
        if (!cancelled) setOpportunities(Array.isArray(data.items) ? data.items : []);
      } catch (loadError) {
        if (!cancelled) {
          setOpportunities([]);
          setError(loadError instanceof Error ? loadError.message : 'Investment opportunities could not be loaded.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadOpportunities();
    return () => { cancelled = true; };
  }, [typeId]);

  const filteredOpportunities = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return opportunities;
    return opportunities.filter(item => [
      item.opportunity_title,
      item.business_name,
      item.type_name,
      item.opportunity_type,
      item.investment_description,
    ].some(value => String(value || '').toLowerCase().includes(query)));
  }, [opportunities, search]);

  return (
    <div className="investment-page">
      {builderConfig?.layout?.length ? (
        <DynamicHomepageRenderer layout={builderConfig.layout} settings={builderConfig.site_settings || null} pageId="website_investment-opportunities" />
      ) : (
        <MarketplaceHeader title={brandName} accentColor="#c08b3e" />
      )}
      <main>
        {!builderConfig?.layout?.length && <header className="investment-hero">
          <div className="hero-inner">
            <p className="eyebrow">SIWA OASIS · APPROVED OPPORTUNITIES</p>
            <h1>{brandName}</h1>
            <p>Explore approved investment opportunities from Siwify and businesses across every sector. Filter by parent category or child business type to narrow the results.</p>
          </div>
        </header>}

        <section className="investment-catalog" aria-label="Investment opportunities">
          <div className="filter-row">
            <label>
              <span>Parent business category</span>
              <select value={parentId} onChange={event => { setParentId(event.target.value); setChildId(''); }}>
                <option value="">All business categories</option>
                {parents.map(parent => <option key={parent.id} value={parent.id}>{parent.name}</option>)}
              </select>
            </label>
            <label>
              <span>Child business type</span>
              <select value={childId} disabled={!parentId} onChange={event => setChildId(event.target.value)}>
                <option value="">All types in category</option>
                {children.filter(child => child.parent_id === parentId).map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </label>
            <label className="search-field">
              <span>Search opportunities</span>
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Project, business, or investment type" />
            </label>
          </div>

          <div className="result-heading">
            <h2>Available opportunities</h2>
            {!loading && <span>{filteredOpportunities.length} listed</span>}
          </div>

          {loading ? (
            <div className="state" role="status">Loading approved opportunities…</div>
          ) : error ? (
            <div className="state error" role="alert">{error}</div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="state">No approved opportunities match these filters.</div>
          ) : (
            <div className="opportunity-grid">
              {filteredOpportunities.map(item => {
                const providers = item.providers || (item.owner_type === 'vendor' ? [{
                  id: item.business_id,
                  name: item.business_name,
                  slug: item.business_slug,
                  type_name: item.type_name,
                }] : []);
                const firstProviderSlug = providers.find(provider => provider.slug)?.slug;
                const businessHref = item.owner_type === 'platform'
                  ? (firstProviderSlug ? `/${firstProviderSlug}#investment-opportunity` : '/investment-opportunities')
                  : item.business_slug ? `/${item.business_slug}#investment-opportunity` : '/investment-opportunities';
                const logo = item.business_logo;
                return (
                  <article className="opportunity-card" key={item.business_id}>
                    <div className="card-top">
                      {logo ? <img src={logo} alt="" /> : <div className="logo-placeholder" aria-hidden="true">INVEST</div>}
                      <div className="category-labels">
                        {item.is_featured && <span className="featured">FEATURED</span>}
                        <span>{item.type_name || 'Siwa business'}</span>
                      </div>
                    </div>
                    <div className="card-content">
                      <p className="opportunity-type">{item.opportunity_type.replace(/_/g, ' ')}</p>
                      <h3>{item.opportunity_title}</h3>
                      <p className="business-name">Offered by {item.owner_type === 'platform' ? 'Siwify' : item.business_name}</p>
                      {item.investment_description && <p className="description">{item.investment_description}</p>}
                      <dl className="metrics">
                        <div><dt>Investment range</dt><dd>{formatAmount(item.investment_amount_min, item.currency || 'USD')} – {formatAmount(item.investment_amount_max, item.currency || 'USD')}</dd></div>
                        {item.expected_roi_percent !== null && <div><dt>Expected ROI</dt><dd>{item.expected_roi_percent}%</dd></div>}
                        {item.business_stage && <div><dt>Business stage</dt><dd>{item.business_stage}</dd></div>}
                      </dl>
                      {item.investment_highlights && <p className="highlights">{item.investment_highlights}</p>}
                      <div className="provider-area">
                        <span>Available at</span>
                        {providers.length > 0 ? providers.slice(0, 3).map(provider => provider.slug ? (
                          <Link href={`/${provider.slug}#investment-opportunity`} key={provider.id}>{provider.name}</Link>
                        ) : <span key={provider.id}>{provider.name}</span>) : <span>{item.owner_type === 'platform' ? 'Siwify direct' : item.business_name}</span>}
                        {providers.length > 3 && <span>+{providers.length - 3} more</span>}
                      </div>
                      <Link href={businessHref} className="view-link">View business &amp; request details</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .investment-page { min-height: 100vh; background: #f5f7f4; color: #18251d; }
        .investment-hero { padding: 3rem 1.25rem; color: #fff; background: linear-gradient(112deg, #173a31, #294b3e 65%, #565038); }
        .hero-inner, .investment-catalog { width: min(1200px, calc(100% - 2rem)); margin: 0 auto; }
        .eyebrow { margin: 0 0 0.6rem; color: #e6be69; font-size: 0.7rem; font-weight: 850; letter-spacing: 1.3px; }
        h1 { max-width: 760px; margin: 0; font-size: 2.3rem; line-height: 1.15; }
        .investment-hero p:last-child { max-width: 760px; margin: 0.8rem 0 0; color: #e0e9e0; line-height: 1.65; }
        .investment-catalog { padding: 1.8rem 0 4rem; }
        .filter-row { display: grid; grid-template-columns: minmax(190px, 0.8fr) minmax(190px, 0.8fr) minmax(240px, 1.4fr); gap: 0.75rem; align-items: end; }
        .filter-row label { display: grid; gap: 0.4rem; color: #526459; font-size: 0.74rem; font-weight: 750; }
        select, input { width: 100%; min-height: 44px; box-sizing: border-box; border: 1px solid #ccd7ce; border-radius: 5px; background: #fff; color: #17251d; padding: 0.65rem 0.75rem; font: inherit; font-size: 0.88rem; }
        select:disabled { background: #edf1ed; color: #87948a; }
        .result-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; margin: 1.8rem 0 1rem; border-bottom: 1px solid #dce5de; padding-bottom: 0.7rem; }
        .result-heading h2 { margin: 0; font-size: 1.15rem; }
        .result-heading span { color: #718076; font-size: 0.78rem; }
        .opportunity-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
        .opportunity-card { overflow: hidden; border: 1px solid #dce5de; border-radius: 6px; background: #fff; }
        .card-top { display: flex; align-items: center; gap: 0.8rem; min-height: 86px; padding: 0.9rem 1rem; background: #e5ede7; }
        .card-top img, .logo-placeholder { width: 56px; height: 56px; flex: 0 0 56px; border-radius: 4px; object-fit: cover; }
        .logo-placeholder { display: grid; place-items: center; background: #234b3c; color: #e8c775; font-size: 0.58rem; font-weight: 850; }
        .category-labels { display: grid; gap: 0.35rem; color: #355a45; font-size: 0.68rem; font-weight: 850; text-transform: uppercase; }
        .featured { color: #a05c1e; }
        .card-content { display: flex; flex-direction: column; padding: 1rem; }
        .opportunity-type { margin: 0 0 0.4rem; color: #a2702f; font-size: 0.66rem; font-weight: 850; text-transform: uppercase; }
        .card-content h3 { margin: 0; font-size: 1.08rem; line-height: 1.35; }
        .business-name { margin: 0.4rem 0 0; color: #365744; font-size: 0.82rem; font-weight: 750; }
        .description, .highlights { color: #596b60; font-size: 0.8rem; line-height: 1.55; }
        .metrics { display: grid; gap: 0.4rem; margin: 0.85rem 0; border-top: 1px solid #e8eee9; border-bottom: 1px solid #e8eee9; padding: 0.75rem 0; }
        .metrics div { display: flex; justify-content: space-between; gap: 0.8rem; }
        .metrics dt { color: #76847a; font-size: 0.7rem; }
        .metrics dd { margin: 0; color: #234b37; font-size: 0.74rem; font-weight: 800; text-align: right; }
        .highlights { margin: 0 0 0.85rem; }
        .provider-area { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; margin: 0 0 0.85rem; color: #617367; font-size: 0.66rem; }
        .provider-area > span:first-child { flex-basis: 100%; font-weight: 850; text-transform: uppercase; }
        .provider-area a, .provider-area > span:not(:first-child) { border: 1px solid #dbe7dd; border-radius: 3px; padding: 0.25rem 0.4rem; color: #2c5741; text-decoration: none; }
        .view-link { display: block; margin-top: auto; border-radius: 4px; background: #1b4335; color: #fff; padding: 0.7rem 0.8rem; text-align: center; text-decoration: none; font-size: 0.74rem; font-weight: 800; }
        .state { border: 1px dashed #c8d4ca; background: #fff; padding: 2rem 1rem; color: #617367; text-align: center; }
        .error { border-color: #e6b5ae; color: #983b31; }
        @media (max-width: 700px) {
          .filter-row { grid-template-columns: 1fr; }
          .investment-hero { padding: 2.2rem 1rem; }
          h1 { font-size: 1.9rem; }
          .hero-inner, .investment-catalog { width: min(100% - 1.25rem, 1200px); }
        }
      `}</style>
    </div>
  );
}