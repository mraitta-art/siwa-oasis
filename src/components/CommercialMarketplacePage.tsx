'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import MarketplaceHeader from '@/components/MarketplaceHeader';

type DealKind = 'package' | 'offer' | 'discount';

interface Provider {
  id: string;
  name: string;
  slug?: string | null;
  type_name?: string | null;
}

interface ProgramActivity {
  id?: string;
  kind?: string;
  title: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  provider_name?: string;
  provider_slug?: string;
}

interface ProgramDay {
  day: number;
  title: string;
  description?: string;
  activities?: ProgramActivity[];
}

interface CommercialItem {
  id: string;
  title: string;
  kind: DealKind;
  ownerName: string;
  isPlatformOffer: boolean;
  typeName: string | null;
  description: string;
  price: number | null;
  originalPrice: number | null;
  currency: string;
  discount: string | null;
  image: string | null;
  providers: Provider[];
  businessSlug: string | null;
  validUntil: string | null;
  source: string;
  categorySpecs: { business_type_id?: string; values?: Record<string, unknown> };
  itinerary: ProgramDay[];
}

interface BusinessType {
  id: string;
  name: string;
  parent_id: string | null;
  is_parent: boolean;
}

interface CommercialMarketplacePageProps {
  initialKind?: 'all' | 'package';
  title: string;
  description: string;
  pageConfigId?: string;
  accentColor?: string;
  topContent?: React.ReactNode;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeKind(value: unknown): DealKind {
  const kind = String(value || '').toLowerCase();
  if (kind === 'discount' || kind === 'discount_offer') return 'discount';
  if (['package', 'experience_package', 'tour', 'activity', 'program', 'retreat', 'room_bundle', 'journey', 'service'].includes(kind)) return 'package';
  return 'offer';
}

function mapOffer(item: any, index: number): CommercialItem {
  const isPlatformOffer = item.owner_type === 'platform';
  const providers = Array.isArray(item.providers)
    ? item.providers.filter((provider: any) => provider?.name).map((provider: any, providerIndex: number) => ({
        id: String(provider.id || `${item.id || index}-${providerIndex}`),
        name: String(provider.name),
        slug: provider.slug || null,
        type_name: provider.type_name || null,
      }))
    : [];
  if (providers.length === 0 && item.business_name && !isPlatformOffer) {
    providers.push({
      id: String(item.business_id || item.id || index),
      name: String(item.business_name),
      slug: item.business_slug || null,
      type_name: item.type_name || null,
    });
  }

  return {
    id: String(item.id || item.product_id || item.promotion_id || `${item.business_id || 'deal'}-${index}`),
    title: String(item.title || item.offer_title || item.package_name || 'Special offer'),
    kind: normalizeKind(item.type || item.item_type),
    ownerName: isPlatformOffer ? 'Siwify' : String(item.business_name || 'Siwa business'),
    isPlatformOffer,
    typeName: item.target_type_name || item.type_name || item.business_type_name || null,
    description: String(item.description || item.offer_description || ''),
    price: toNumber(item.price),
    originalPrice: toNumber(item.original_price),
    currency: String(item.currency || 'EGP'),
    discount: item.discount === null || item.discount === undefined ? null : String(item.discount),
    image: item.image || item.business_logo || null,
    providers,
    businessSlug: item.business_slug || null,
    validUntil: item.valid_until || null,
    source: String(item.source || 'vendor_offer'),
    categorySpecs: item.category_specs && typeof item.category_specs === 'object' ? item.category_specs : {},
    itinerary: Array.isArray(item.itinerary) ? item.itinerary : [],
  };
}

function mapDiscount(item: any, index: number): CommercialItem {
  const isPlatformOffer = item.owner_type === 'platform';
  const provider = item.business_name && !isPlatformOffer
    ? [{ id: String(item.business_id || index), name: String(item.business_name), slug: item.business_slug || null, type_name: item.type_name || null }]
    : [];
  return {
    id: String(item.id || item.discount_id || `${item.business_id || 'discount'}-${index}`),
    title: String(item.discount_name || 'Special discount'),
    kind: 'discount',
    ownerName: isPlatformOffer ? 'Siwify' : String(item.business_name || 'Siwa business'),
    isPlatformOffer,
    typeName: item.target_type_name || item.type_name || null,
    description: String(item.description || item.discount_description || ''),
    price: null,
    originalPrice: null,
    currency: String(item.currency || 'EGP'),
    discount: item.discount_value === null || item.discount_value === undefined
      ? null
      : `${item.discount_value}${item.discount_type === 'percent' ? '%' : ''}`,
    image: item.image || item.business_logo || null,
    providers: Array.isArray(item.providers) && item.providers.length > 0 ? item.providers : provider,
    businessSlug: item.business_slug || null,
    validUntil: item.valid_until || null,
    source: String(item.source || 'vendor_discount'),
    categorySpecs: {},
    itinerary: [],
  };
}

function formatPrice(value: number | null, currency: string): string | null {
  if (value === null) return null;
  return `${currency} ${value.toLocaleString()}`;
}

export default function CommercialMarketplacePage({
  initialKind = 'all',
  title,
  description,
  pageConfigId,
  accentColor = '#b58a38',
  topContent,
}: CommercialMarketplacePageProps) {
  const [parents, setParents] = useState<BusinessType[]>([]);
  const [children, setChildren] = useState<BusinessType[]>([]);
  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const [parentId, setParentId] = useState('');
  const [childId, setChildId] = useState('');
  const [activeKind, setActiveKind] = useState<'all' | DealKind>(initialKind);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<CommercialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<CommercialItem | null>(null);

  useEffect(() => {
    if (!pageConfigId) return;
    let cancelled = false;
    fetch(`/api/jana/website?id=${encodeURIComponent(pageConfigId)}`)
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
  }, [pageConfigId]);

  useEffect(() => {
    let cancelled = false;
    async function loadTypes() {
      try {
        const parentResponse = await fetch('/api/business-types?is_parent=true');
        const parentData = parentResponse.ok ? await parentResponse.json() : [];
        const loadedParents: BusinessType[] = Array.isArray(parentData) ? parentData : [];
        const childResponse = loadedParents.length > 0
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

  const selectedTypeId = childId || parentId;

  useEffect(() => {
    let cancelled = false;
    async function loadItems() {
      setLoading(true);
      setError('');
      const typeQuery = selectedTypeId ? `&type=${encodeURIComponent(selectedTypeId)}` : '';
      try {
        const offersResponse = await fetch(`/api/discovery/offers?limit=120${typeQuery}`);
        const offersData = await offersResponse.json().catch(() => ({}));
        if (!offersResponse.ok) throw new Error('The marketplace feed could not be loaded.');
        const offers = Array.isArray(offersData?.offers) ? offersData.offers : [];
        if (cancelled) return;
        setItems(offers.map(mapOffer));
        setLoading(false);

        const discountController = new AbortController();
        const timeoutId = window.setTimeout(() => discountController.abort(), 12000);
        try {
          const discountsResponse = await fetch(`/api/discovery/discounts?limit=120${typeQuery}`, { signal: discountController.signal });
          if (!discountsResponse.ok) return;
          const discountsData = await discountsResponse.json().catch(() => ({}));
          const discounts = Array.isArray(discountsData?.items) ? discountsData.items : [];
          if (!cancelled) setItems(current => [...current, ...discounts.map(mapDiscount)]);
        } catch {
          // The main offer feed stays usable if the optional legacy discount feed is unavailable.
        } finally {
          window.clearTimeout(timeoutId);
        }
      } catch (loadError) {
        if (!cancelled) {
          setItems([]);
          setError(loadError instanceof Error ? loadError.message : 'The marketplace feed could not be loaded.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadItems();
    return () => { cancelled = true; };
  }, [selectedTypeId]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(item => {
      if (activeKind !== 'all' && item.kind !== activeKind) return false;
      if (!query) return true;
      return [item.title, item.description, item.ownerName, item.typeName, ...item.providers.map(provider => provider.name)]
        .some(value => String(value || '').toLowerCase().includes(query));
    });
  }, [activeKind, items, search]);

  const counts = useMemo(() => ({
    all: items.length,
    package: items.filter(item => item.kind === 'package').length,
    offer: items.filter(item => item.kind === 'offer').length,
    discount: items.filter(item => item.kind === 'discount').length,
  }), [items]);

  const tabs: Array<{ id: 'all' | DealKind; label: string }> = [
    { id: 'all', label: 'All deals' },
    { id: 'package', label: 'Packages & experiences' },
    { id: 'offer', label: 'Offers' },
    { id: 'discount', label: 'Discounts' },
  ];

  return (
    <div className="commercial-page">
      {builderConfig?.layout?.length ? (
        <DynamicHomepageRenderer layout={builderConfig.layout} settings={builderConfig.site_settings || null} pageId={pageConfigId || title} />
      ) : (
        <MarketplaceHeader title={title} accentColor={accentColor} />
      )}
      <main>
        {!builderConfig?.layout?.length && <section className="commercial-hero">
          <div className="hero-inner">
            <p className="eyebrow">SIWIFY MARKETPLACE</p>
            <h1>{title}</h1>
            <p className="hero-copy">{description}</p>
          </div>
        </section>}

        {topContent}

        <section className="catalog" aria-label="Marketplace listings">
          <div className="filter-row">
            <label className="filter-field">
              <span>Business category</span>
              <select value={parentId} onChange={event => { setParentId(event.target.value); setChildId(''); }}>
                <option value="">All business types</option>
                {parents.map(parent => <option key={parent.id} value={parent.id}>{parent.name}</option>)}
              </select>
            </label>
            <label className="filter-field" aria-disabled={!parentId}>
              <span>Business type</span>
              <select value={childId} disabled={!parentId} onChange={event => setChildId(event.target.value)}>
                <option value="">All types in category</option>
                {children.filter(child => child.parent_id === parentId).map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </label>
            <label className="search-field">
              <span className="sr-only">Search offers and packages</span>
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search offers, packages, or providers" />
            </label>
          </div>

          <div className="tabs" role="tablist" aria-label="Deal type">
            {tabs.map(tab => (
              <button key={tab.id} type="button" role="tab" aria-selected={activeKind === tab.id} onClick={() => setActiveKind(tab.id)}>
                {tab.label}<span>{counts[tab.id]}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="state-message" role="status">Loading marketplace…</div>
          ) : error ? (
            <div className="state-message error-message" role="alert">{error}</div>
          ) : visibleItems.length === 0 ? (
            <div className="state-message">No published listings match these filters.</div>
          ) : (
            <div className="deal-grid">
              {visibleItems.map(item => {
                const price = formatPrice(item.price, item.currency);
                const oldPrice = formatPrice(item.originalPrice, item.currency);
                return (
                  <article className="deal-card" key={`${item.source}-${item.id}`}>
                    {item.image ? (
                      <img className="deal-image" src={item.image} alt="" loading="lazy" />
                    ) : (
                      <div className="deal-image image-placeholder"><span>{item.kind === 'package' ? 'PACKAGE' : item.kind.toUpperCase()}</span></div>
                    )}
                    <div className="deal-content">
                      <div className="deal-topline">
                        <span className={`kind-label kind-${item.kind}`}>{item.kind === 'package' ? 'PACKAGE' : item.kind.toUpperCase()}</span>
                        {item.discount && <span className="discount-label">{item.discount}</span>}
                      </div>
                      <h2>{item.title}</h2>
                      {item.typeName && <p className="type-label">{item.typeName}</p>}
                      <p className="owner-line">Offered by <strong>{item.ownerName}</strong></p>
                      <p className="description">{item.description || 'Explore details and participating providers.'}</p>
                      <div className="provider-area">
                        <span className="provider-heading">Available at</span>
                        {item.providers.length > 0 ? (
                          <div className="provider-list">
                            {item.providers.slice(0, 3).map(provider => provider.slug ? (
                              <Link href={`/p/${provider.slug}`} key={provider.id}>{provider.name}</Link>
                            ) : (
                              <span key={provider.id}>{provider.name}</span>
                            ))}
                            {item.providers.length > 3 && <span>+{item.providers.length - 3} more</span>}
                          </div>
                        ) : (
                          <span className="provider-empty">Siwify direct</span>
                        )}
                      </div>
                      <div className="card-bottom">
                        <div className="price-block">
                          {oldPrice && oldPrice !== price && <del>{oldPrice}</del>}
                          {price && <strong>{price}</strong>}
                        </div>
                        <button type="button" onClick={() => setSelectedItem(item)}>Details</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {selectedItem && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedItem(null)}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={event => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Close details" onClick={() => setSelectedItem(null)}>×</button>
            <p className="eyebrow">{selectedItem.kind.toUpperCase()} · OFFERED BY {selectedItem.ownerName.toUpperCase()}</p>
            <h2 id="detail-title">{selectedItem.title}</h2>
            {selectedItem.description && <p>{selectedItem.description}</p>}
            {selectedItem.discount && <p className="modal-discount">Discount: {selectedItem.discount}</p>}
            {selectedItem.itinerary.length > 0 && (
              <div className="program-itinerary">
                <h3>Program schedule</h3>
                {selectedItem.itinerary.map((day, dayIndex) => (
                  <section key={`${day.day}-${dayIndex}`}>
                    <h4>{day.title || `Day ${day.day || dayIndex + 1}`}</h4>
                    {day.description && <p>{day.description}</p>}
                    {(day.activities || []).map((activity, activityIndex) => (
                      <article key={activity.id || `${dayIndex}-${activityIndex}`}>
                        <div className="activity-heading">
                          <span>{activity.kind?.replace(/_/g, ' ') || 'Activity'}</span>
                          <strong>{activity.title}</strong>
                          {(activity.start_time || activity.end_time) && <time>{activity.start_time || ''}{activity.end_time ? `–${activity.end_time}` : ''}</time>}
                        </div>
                        {activity.description && <p>{activity.description}</p>}
                        {activity.provider_slug && <Link href={`/p/${activity.provider_slug}`}>Provider minisite: {activity.provider_name || 'View provider'}</Link>}
                      </article>
                    ))}
                  </section>
                ))}
              </div>
            )}
            {Object.entries(selectedItem.categorySpecs.values || {}).filter(([, value]) => value !== null && value !== undefined && value !== '').length > 0 && (
              <div className="specification-list">
                <h3>Specifications</h3>
                <dl>
                  {Object.entries(selectedItem.categorySpecs.values || {}).filter(([, value]) => value !== null && value !== undefined && value !== '').map(([key, value]) => (
                    <div key={key}>
                      <dt>{key.split(':').pop()?.replace(/[_-]/g, ' ')}</dt>
                      <dd>{Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {selectedItem.providers.length > 0 && (
              <div className="modal-providers">
                <h3>Available at</h3>
                {selectedItem.providers.map(provider => (
                  <div key={provider.id}>
                    {provider.slug ? <Link href={`/p/${provider.slug}`}>{provider.name}</Link> : provider.name}
                    {provider.type_name && <span>{provider.type_name}</span>}
                  </div>
                ))}
              </div>
            )}
            {selectedItem.validUntil && <p className="validity">Valid until {new Date(selectedItem.validUntil).toLocaleDateString()}</p>}
          </section>
        </div>
      )}

      <style jsx>{`
        .commercial-page { min-height: 100vh; background: #f5f7f4; color: #17251d; }
        .commercial-hero { background: linear-gradient(112deg, #173a31 0%, #294b3e 65%, #43624d 100%); color: #fff; padding: 3rem 1.25rem 2.7rem; }
        .hero-inner, .catalog { width: min(1200px, calc(100% - 2rem)); margin: 0 auto; }
        .eyebrow { margin: 0 0 0.65rem; color: #e6be69; font-size: 0.7rem; font-weight: 800; letter-spacing: 1.4px; }
        h1 { max-width: 760px; margin: 0; font-size: 2.35rem; line-height: 1.12; font-weight: 850; }
        .hero-copy { max-width: 700px; margin: 0.9rem 0 0; color: #e0e9e0; font-size: 1rem; line-height: 1.65; }
        .catalog { padding: 1.75rem 0 4rem; }
        .filter-row { display: grid; grid-template-columns: minmax(180px, 0.8fr) minmax(180px, 0.8fr) minmax(240px, 1.4fr); gap: 0.75rem; align-items: end; }
        .filter-field, .search-field { display: grid; gap: 0.4rem; color: #496052; font-size: 0.74rem; font-weight: 750; }
        select, input { width: 100%; min-height: 44px; box-sizing: border-box; border: 1px solid #ccd7ce; border-radius: 5px; background: #fff; color: #17251d; padding: 0.65rem 0.75rem; font: inherit; font-size: 0.88rem; }
        select:disabled { background: #edf1ed; color: #87948a; }
        .tabs { display: flex; overflow-x: auto; gap: 0.25rem; margin: 1.5rem 0 1.1rem; border-bottom: 1px solid #d9e1db; }
        .tabs button { flex: 0 0 auto; display: flex; gap: 0.55rem; align-items: center; border: 0; border-bottom: 3px solid transparent; background: transparent; color: #596c60; padding: 0.8rem 0.9rem; font-weight: 750; cursor: pointer; }
        .tabs button[aria-selected="true"] { border-bottom-color: ${accentColor}; color: #18392e; }
        .tabs span { color: #758579; font-size: 0.72rem; }
        .deal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
        .deal-card { display: flex; min-width: 0; flex-direction: column; overflow: hidden; border: 1px solid #dce5de; border-radius: 6px; background: #fff; }
        .deal-image { width: 100%; height: 170px; object-fit: cover; background: #dce7df; }
        .image-placeholder { display: grid; place-items: center; color: #496752; background: repeating-linear-gradient(135deg, #dce7df 0, #dce7df 14px, #eaf0eb 14px, #eaf0eb 28px); font-size: 0.7rem; font-weight: 850; letter-spacing: 1px; }
        .deal-content { display: flex; flex: 1; flex-direction: column; padding: 1rem; }
        .deal-topline { display: flex; justify-content: space-between; gap: 0.5rem; align-items: center; }
        .kind-label, .discount-label { font-size: 0.67rem; font-weight: 850; letter-spacing: 0.5px; }
        .kind-package { color: #27634d; }
        .kind-offer { color: #a15a23; }
        .kind-discount, .discount-label { color: #b33d35; }
        h2 { margin: 0.55rem 0 0; font-size: 1.08rem; line-height: 1.35; }
        .type-label { margin: 0.25rem 0 0; color: #6f7e73; font-size: 0.72rem; }
        .owner-line { margin: 0.55rem 0 0; color: #597064; font-size: 0.75rem; }
        .owner-line strong { color: #1d4737; }
        .description { min-height: 2.5em; margin: 0.7rem 0 0.85rem; color: #4d5f54; font-size: 0.82rem; line-height: 1.55; }
        .provider-area { margin-top: auto; border-top: 1px solid #edf1ed; padding-top: 0.75rem; }
        .provider-heading { display: block; margin-bottom: 0.4rem; color: #617367; font-size: 0.66rem; font-weight: 800; text-transform: uppercase; }
        .provider-list { display: flex; flex-wrap: wrap; gap: 0.35rem; }
        .provider-list a, .provider-list span { border: 1px solid #dbe7dd; border-radius: 3px; padding: 0.25rem 0.4rem; color: #2c5741; font-size: 0.7rem; text-decoration: none; }
        .provider-empty { color: #66786b; font-size: 0.73rem; }
        .card-bottom { display: flex; justify-content: space-between; align-items: end; gap: 0.65rem; margin-top: 0.9rem; }
        .price-block { display: grid; gap: 0.2rem; color: #1e503b; font-size: 0.88rem; }
        .price-block del { color: #89968d; font-size: 0.73rem; }
        .card-bottom button { border: 0; border-radius: 4px; background: #1b4335; color: #fff; padding: 0.6rem 0.8rem; font-weight: 750; cursor: pointer; }
        .state-message { border: 1px dashed #c8d4ca; background: #fff; padding: 2rem 1rem; color: #617367; text-align: center; }
        .error-message { border-color: #e6b5ae; color: #983b31; }
        .modal-backdrop { position: fixed; z-index: 5000; inset: 0; display: grid; place-items: center; overflow-y: auto; background: rgba(10, 25, 18, 0.68); padding: 1rem; }
        .detail-modal { position: relative; width: min(620px, 100%); max-height: calc(100vh - 2rem); overflow-y: auto; border-radius: 6px; background: #fff; padding: 1.5rem; box-shadow: 0 16px 55px rgba(0,0,0,0.25); }
        .detail-modal h2 { margin: 0 2rem 0.75rem 0; font-size: 1.45rem; }
        .detail-modal > p:not(.eyebrow) { color: #536359; font-size: 0.9rem; line-height: 1.65; }
        .modal-close { position: absolute; top: 0.7rem; right: 0.8rem; border: 0; background: transparent; color: #3e5146; font-size: 1.6rem; cursor: pointer; }
        .modal-discount { color: #a63f34 !important; font-weight: 800; }
        .program-itinerary { display: grid; gap: 0.75rem; margin: 1.2rem 0; }
        .program-itinerary h3 { margin: 0; color: #234b37; font-size: 0.92rem; }
        .program-itinerary section { display: grid; gap: 0.45rem; border-top: 1px solid #e4ebe5; padding-top: 0.7rem; }
        .program-itinerary h4 { margin: 0; font-size: 0.82rem; }
        .program-itinerary section > p, .program-itinerary article > p { margin: 0; color: #607165; font-size: 0.75rem; }
        .program-itinerary article { display: grid; gap: 0.3rem; border-left: 2px solid #9a6a24; padding: 0.45rem 0.65rem; background: #f7f8f5; }
        .activity-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.45rem; font-size: 0.75rem; }
        .activity-heading span { color: #91672e; text-transform: capitalize; font-size: 0.65rem; font-weight: 800; }
        .activity-heading time { color: #66756b; margin-left: auto; font-size: 0.68rem; }
        .program-itinerary article a { width: fit-content; color: #28543c; font-size: 0.7rem; font-weight: 800; }
        .modal-providers { margin-top: 1rem; border-top: 1px solid #e4ebe5; padding-top: 0.8rem; }
        .modal-providers h3 { margin: 0 0 0.55rem; color: #4f6357; font-size: 0.72rem; text-transform: uppercase; }
        .modal-providers div { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #f0f3f0; padding: 0.55rem 0; color: #234b37; font-size: 0.85rem; }
        .modal-providers a { color: inherit; }
        .modal-providers span, .validity { color: #77867b; font-size: 0.75rem; }
        .specification-list { margin-top: 1rem; border-top: 1px solid #e4ebe5; padding-top: 0.8rem; }
        .specification-list h3 { margin: 0 0 0.55rem; color: #526459; font-size: 0.72rem; text-transform: uppercase; }
        .specification-list dl { display: grid; gap: 0.4rem; margin: 0; }
        .specification-list dl div { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.78rem; }
        .specification-list dt { color: #77867b; }
        .specification-list dd { margin: 0; color: #234b37; font-weight: 700; text-align: right; }
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
        @media (max-width: 700px) {
          .filter-row { grid-template-columns: 1fr; }
          .commercial-hero { padding: 2.2rem 1rem; }
          h1 { font-size: 1.9rem; }
          .hero-inner, .catalog { width: min(100% - 1.25rem, 1200px); }
        }
      `}</style>
    </div>
  );
}