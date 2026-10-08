'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Plus, Save, Store } from 'lucide-react';
import {
  DEFAULT_JOURNEY_CUSTOMIZER,
  type JourneyAccommodation,
  type JourneyCatalogItemBase,
  type JourneyCustomizerCatalog,
  type JourneyExperience,
  type JourneyMeal,
  type JourneyTransport,
} from '@/lib/journey-customizer-catalog';

type CatalogGroup = 'experiences' | 'accommodations' | 'transports' | 'meals';
type EditableItem = JourneyExperience | JourneyAccommodation | JourneyTransport | JourneyMeal;

const GROUPS: Array<{ id: CatalogGroup; label: string; titleEn: string; titleAr: string; detailEn: string; detailAr: string; priceKey: string; priceLabel: string }> = [
  { id: 'experiences', label: 'Experiences', titleEn: 'title_en', titleAr: 'title_ar', detailEn: 'highlight_en', detailAr: 'highlight_ar', priceKey: 'base_price_egp', priceLabel: 'EGP per adult' },
  { id: 'accommodations', label: 'Stays', titleEn: 'name_en', titleAr: 'name_ar', detailEn: 'desc_en', detailAr: 'desc_ar', priceKey: 'price_per_night', priceLabel: 'EGP per night' },
  { id: 'transports', label: 'Transport', titleEn: 'name_en', titleAr: 'name_ar', detailEn: 'desc_en', detailAr: 'desc_ar', priceKey: 'rate_per_day', priceLabel: 'EGP per day' },
  { id: 'meals', label: 'Meals', titleEn: 'name_en', titleAr: 'name_ar', detailEn: 'desc_en', detailAr: 'desc_ar', priceKey: 'price_per_person', priceLabel: 'EGP per person' },
];

function makeItem(group: CatalogGroup, id: string): EditableItem {
  const base: JourneyCatalogItemBase = { id, is_visible: true, vendor_business_ids: [] };
  if (group === 'experiences') return { ...base, title_en: 'New experience', title_ar: 'تجربة جديدة', category: '', category_ar: '', duration: '', duration_ar: '', base_price_egp: 0, highlight_en: '', highlight_ar: '', image: '', icon: '✨' };
  if (group === 'accommodations') return { ...base, name_en: 'New stay', name_ar: 'إقامة جديدة', desc_en: '', desc_ar: '', price_per_night: 0, badge_en: '', badge_ar: '' };
  if (group === 'transports') return { ...base, name_en: 'New transport', name_ar: 'وسيلة نقل جديدة', desc_en: '', desc_ar: '', rate_per_day: 0 };
  return { ...base, name_en: 'New meal', name_ar: 'وجبة جديدة', desc_en: '', desc_ar: '', price_per_person: 0 };
}

export default function JourneyCustomizerEditor({ onClose }: { onClose: () => void }) {
  const [catalog, setCatalog] = useState<JourneyCustomizerCatalog>(DEFAULT_JOURNEY_CUSTOMIZER);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string; type_name?: string }>>([]);
  const [activeGroup, setActiveGroup] = useState<CatalogGroup>('experiences');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/journeys/customizer?view=admin'),
      fetch('/api/jana/businesses'),
    ]).then(async ([catalogResponse, businessesResponse]) => {
      if (!catalogResponse.ok) throw new Error('Could not load the journey catalog. Check your admin session.');
      const catalogData = await catalogResponse.json();
      const businessesData = businessesResponse.ok ? await businessesResponse.json() : [];
      if (!active) return;
      if (catalogData.catalog) setCatalog(catalogData.catalog);
      if (Array.isArray(businessesData)) setBusinesses(businessesData);
      if (catalogData.source === 'defaults') setNotice('Showing the starter catalog. Save to store it in the shared database.');
    }).catch((loadError: any) => {
      if (active) setError(loadError?.message || 'Catalog load failed.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const group = GROUPS.find(item => item.id === activeGroup)!;
  const items = catalog[activeGroup] as EditableItem[];

  function updateItem(index: number, key: string, value: unknown) {
    setCatalog(current => ({
      ...current,
      [activeGroup]: (current[activeGroup] as EditableItem[]).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  }

  function addItem() {
    const next = makeItem(activeGroup, `custom_${activeGroup}_${Date.now()}`);
    setCatalog(current => ({ ...current, [activeGroup]: [...current[activeGroup], next] }));
    setNotice('New item added. Fill both language fields before saving.');
  }

  async function saveCatalog() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/journeys/customizer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalog }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Catalog save failed.');
      setNotice('Saved to the shared database. New requests will use this catalog.');
    } catch (saveError: any) {
      setError(saveError?.message || 'Catalog save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-100 text-slate-900" role="dialog" aria-modal="true" aria-labelledby="journey-catalog-title">
      <div className="mx-auto min-h-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} aria-label="Back to journey requests" className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 id="journey-catalog-title" className="text-xl font-black sm:text-2xl">Journey Customizer Content</h1>
              <p className="mt-1 text-xs text-slate-500">Edit English and Arabic content, prices, visibility, and vendor routing.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/customize-journey" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100">
              <Eye size={15} /> Preview visitor page
            </a>
            <button type="button" onClick={saveCatalog} disabled={loading || saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-black text-white disabled:opacity-50">
              <Save size={15} /> {saving ? 'Saving…' : 'Save catalog'}
            </button>
          </div>
        </header>

        <div className="my-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Catalog groups">
            {GROUPS.map(option => (
              <button key={option.id} type="button" role="tab" aria-selected={activeGroup === option.id} onClick={() => setActiveGroup(option.id)} className={`min-h-10 rounded-lg px-4 text-xs font-bold ${activeGroup === option.id ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}>
                {option.label} <span className="ms-1 opacity-70">{catalog[option.id].length}</span>
              </button>
            ))}
          </div>
          <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
            Bundle discount %
            <input type="number" min="0" max="100" value={catalog.bundle_discount_percent} onChange={event => setCatalog(current => ({ ...current, bundle_discount_percent: Math.min(100, Math.max(0, Number(event.target.value) || 0)) }))} className="w-16 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-right text-slate-900" />
          </label>
          <button type="button" onClick={addItem} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100">
            <Plus size={15} /> Add {group.label.slice(0, -1)}
          </button>
        </div>

        {notice && <div role="status" className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
        {error && <div role="alert" className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">Loading catalog…</div>
        ) : (
          <div className="space-y-4 pb-12">
            {items.map((item, index) => {
              const titleEn = item[group.titleEn as keyof EditableItem] as string;
              const titleAr = item[group.titleAr as keyof EditableItem] as string;
              const detailEn = item[group.detailEn as keyof EditableItem] as string;
              const detailAr = item[group.detailAr as keyof EditableItem] as string;
              return (
                <article key={item.id} className={`rounded-xl border bg-white p-4 sm:p-5 ${item.is_visible ? 'border-slate-200' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-slate-900">{titleEn || item.id}</div>
                      <code className="text-[10px] text-slate-500">{item.id}</code>
                    </div>
                    <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700">
                      {item.is_visible ? <Eye size={14} className="text-emerald-600" /> : <EyeOff size={14} className="text-amber-600" />}
                      <input type="checkbox" checked={item.is_visible} onChange={event => updateItem(index, 'is_visible', event.target.checked)} />
                      {item.is_visible ? 'Visible to visitors' : 'Hidden from new requests'}
                    </label>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <label className="space-y-1 text-xs font-bold text-slate-700">Title (English)
                      <input value={titleEn || ''} onChange={event => updateItem(index, group.titleEn, event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900" />
                    </label>
                    <label dir="rtl" className="space-y-1 text-xs font-bold text-slate-700">العنوان (بالعربية)
                      <input dir="rtl" lang="ar" value={titleAr || ''} onChange={event => updateItem(index, group.titleAr, event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900" />
                    </label>
                    <label className="space-y-1 text-xs font-bold text-slate-700">Description (English)
                      <textarea rows={2} value={detailEn || ''} onChange={event => updateItem(index, group.detailEn, event.target.value)} className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900" />
                    </label>
                    <label dir="rtl" className="space-y-1 text-xs font-bold text-slate-700">الوصف (بالعربية)
                      <textarea dir="rtl" lang="ar" rows={2} value={detailAr || ''} onChange={event => updateItem(index, group.detailAr, event.target.value)} className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900" />
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="space-y-1 text-xs font-bold text-slate-700">{group.priceLabel}
                      <input type="number" min="0" step="1" value={Number(item[group.priceKey as keyof EditableItem] || 0)} onChange={event => updateItem(index, group.priceKey, Math.max(0, Number(event.target.value) || 0))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900" />
                    </label>
                    <label className="space-y-1 text-xs font-bold text-slate-700">Image URL
                      <input value={item.image || ''} onChange={event => updateItem(index, 'image', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900" />
                    </label>
                    <label className="space-y-1 text-xs font-bold text-slate-700">Icon
                      <input value={item.icon || ''} onChange={event => updateItem(index, 'icon', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900" />
                    </label>
                  </div>

                  {activeGroup === 'experiences' && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="space-y-1 text-xs font-bold text-slate-300">Category (English)
                        <input value={(item as JourneyExperience).category} onChange={event => updateItem(index, 'category', event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" />
                      </label>
                      <label dir="rtl" className="space-y-1 text-xs font-bold text-slate-300">الفئة (بالعربية)
                        <input dir="rtl" lang="ar" value={(item as JourneyExperience).category_ar} onChange={event => updateItem(index, 'category_ar', event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" />
                      </label>
                      <label className="space-y-1 text-xs font-bold text-slate-300">Duration (English)
                        <input value={(item as JourneyExperience).duration} onChange={event => updateItem(index, 'duration', event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" />
                      </label>
                      <label dir="rtl" className="space-y-1 text-xs font-bold text-slate-300">المدة (بالعربية)
                        <input dir="rtl" lang="ar" value={(item as JourneyExperience).duration_ar} onChange={event => updateItem(index, 'duration_ar', event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" />
                      </label>
                    </div>
                  )}

                  {activeGroup === 'accommodations' && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1 text-xs font-bold text-slate-300">Badge (English)
                        <input value={(item as JourneyAccommodation).badge_en} onChange={event => updateItem(index, 'badge_en', event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" />
                      </label>
                      <label dir="rtl" className="space-y-1 text-xs font-bold text-slate-300">شارة (بالعربية)
                        <input dir="rtl" lang="ar" value={(item as JourneyAccommodation).badge_ar} onChange={event => updateItem(index, 'badge_ar', event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white" />
                      </label>
                    </div>
                  )}

                  <details className="mt-4 rounded-lg border border-white/10 bg-black/10 p-3">
                    <summary className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-200"><Store size={14} /> Vendor assignment ({item.vendor_business_ids.length})</summary>
                    <div className="mt-3 grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                      {businesses.map(business => (
                        <label key={business.id} className="flex cursor-pointer items-center gap-2 rounded-md bg-white/5 px-2 py-2 text-xs">
                          <input type="checkbox" checked={item.vendor_business_ids.includes(business.id)} onChange={event => {
                            const next = event.target.checked
                              ? [...item.vendor_business_ids, business.id]
                              : item.vendor_business_ids.filter(id => id !== business.id);
                            updateItem(index, 'vendor_business_ids', next);
                          }} />
                          <span className="min-w-0 truncate">{business.name}<span className="ms-1 text-slate-500">{business.type_name || ''}</span></span>
                        </label>
                      ))}
                      {businesses.length === 0 && <p className="text-xs text-slate-500">No businesses available.</p>}
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
