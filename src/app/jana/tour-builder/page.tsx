'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────
type StopRole = 'stay' | 'eat' | 'visit' | 'do' | 'travel' | 'buy';
type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'full_day' | 'overnight';

interface TourStop {
  _key: string;        // local unique key
  business_id: string;
  business_name: string;
  type_name?: string;
  type_icon?: string;
  type_icon_color?: string;
  stop_role: StopRole;
  day_number: number;
  time_slot: TimeSlot;
  start_time: string;  // "09:00"
  end_time: string;    // "11:30"
  start_date: string;  // "2026-12-01"
  duration_hours: number | null;
  notes: string;
  is_optional: boolean;
  price_usd: number | null;
}

interface TourProduct {
  id?: string;
  catalog_cat_id: string;
  name: string;
  name_ar: string;
  slug: string;
  description: string;
  duration_days: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  pace: 'slow' | 'moderate' | 'active';
  group_size_min: number;
  group_size_max: number;
  base_price_usd: number | null;
  base_price_egp: number | null;
  price_per: 'person' | 'group' | 'fixed';
  included: string[];
  excluded: string[];
  highlights: string[];
  best_season: string;
  is_public: boolean;
  is_featured: boolean;
  vendor_business_id: string;
  vendor_name: string;
  stops: TourStop[];
}

interface CatalogCategory { id: string; parent_id: string | null; name: string; icon: string; color: string; }
interface Business { id: string; name: string; type_name: string; type_icon: string; type_icon_color: string; parent_type_id: string; parent_type_name: string; }

// ─── Role config ─────────────────────────────────────────────────────────────
const ROLES: { id: StopRole; label: string; icon: string; color: string; emoji: string }[] = [
  { id: 'stay',   label: 'Stay',   icon: 'fa-bed',         color: '#6366f1', emoji: '🏨' },
  { id: 'eat',    label: 'Eat',    icon: 'fa-utensils',    color: '#f59e0b', emoji: '🍽️' },
  { id: 'visit',  label: 'Visit',  icon: 'fa-binoculars',  color: '#0ea5e9', emoji: '🏭' },
  { id: 'do',     label: 'Do',     icon: 'fa-hiking',      color: '#22c55e', emoji: '🧭' },
  { id: 'travel', label: 'Travel', icon: 'fa-car',         color: '#f97316', emoji: '🚙' },
  { id: 'buy',    label: 'Buy',    icon: 'fa-shopping-bag',color: '#ec4899', emoji: '🛍️' },
];

const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.id, r]));

function emptyProduct(): TourProduct {
  return {
    catalog_cat_id: 'multi_day_package',
    name: '', name_ar: '', slug: '', description: '',
    duration_days: 3, difficulty: 'easy', pace: 'moderate',
    group_size_min: 1, group_size_max: 12,
    base_price_usd: null, base_price_egp: null, price_per: 'person',
    included: ['Guide', 'Transport', 'Entrance Fees'],
    excluded: ['Flights', 'Personal Expenses'],
    highlights: [], best_season: 'October to April',
    is_public: true, is_featured: false,
    vendor_business_id: '', vendor_name: '',
    stops: [],
  };
}

function newKey() { return `stop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TourBuilderPage() {
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bizSearch, setBizSearch] = useState('');
  const [bizRoleFilter, setBizRoleFilter] = useState<StopRole | ''>('');
  const [product, setProduct] = useState<TourProduct>(emptyProduct());
  const [activeDay, setActiveDay] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [startDateBase, setStartDateBase] = useState(''); // base date for day 1

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetch('/api/jana/tour-builder?action=list').then(r => r.json()),
      fetch('/api/jana/tour-builder?action=categories').then(r => r.json()),
    ]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  // Load businesses when search/role changes
  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/jana/tour-builder?action=businesses&q=${encodeURIComponent(bizSearch)}&role=${bizRoleFilter}`)
        .then(r => r.json()).then(setBusinesses);
    }, 300);
    return () => clearTimeout(t);
  }, [bizSearch, bizRoleFilter]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const daysArray = Array.from({ length: product.duration_days }, (_, i) => i + 1);

  function computeDate(dayNumber: number): string {
    if (!startDateBase) return '';
    const d = new Date(startDateBase);
    d.setDate(d.getDate() + dayNumber - 1);
    return d.toISOString().slice(0, 10);
  }

  function addStop(biz: Business, role: StopRole) {
    const date = computeDate(activeDay);
    const stop: TourStop = {
      _key: newKey(),
      business_id: biz.id,
      business_name: biz.name,
      type_name: biz.type_name,
      type_icon: biz.type_icon,
      type_icon_color: biz.type_icon_color,
      stop_role: role,
      day_number: activeDay,
      time_slot: 'morning',
      start_time: '09:00',
      end_time: '10:30',
      start_date: date,
      duration_hours: 1.5,
      notes: '',
      is_optional: false,
      price_usd: null,
    };
    setProduct(p => ({ ...p, stops: [...p.stops, stop] }));
  }

  function removeStop(key: string) {
    setProduct(p => ({ ...p, stops: p.stops.filter(s => s._key !== key) }));
  }

  function updateStop(key: string, patch: Partial<TourStop>) {
    setProduct(p => ({
      ...p,
      stops: p.stops.map(s => {
        if (s._key !== key) return s;
        const updated = { ...s, ...patch };
        // Auto-calc duration from times
        if (patch.start_time || patch.end_time) {
          const [sh, sm] = (updated.start_time || '00:00').split(':').map(Number);
          const [eh, em] = (updated.end_time || '00:00').split(':').map(Number);
          const diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff > 0) updated.duration_hours = Math.round(diff / 6) / 10;
        }
        return updated;
      })
    }));
  }

  const stopsForDay = (day: number) =>
    product.stops
      .filter(s => s.day_number === day)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  async function handleSave() {
    if (!product.name || !product.catalog_cat_id) {
      setSaveMsg('❌ Package name and category are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/jana/tour-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_product', ...product }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMsg(`✅ Saved! Slug: ${data.slug}`);
        // Refresh list
        const prods = await fetch('/api/jana/tour-builder?action=list').then(r => r.json());
        setProducts(prods);
        setTimeout(() => setView('list'), 1500);
      } else {
        setSaveMsg(`❌ ${data.error}`);
      }
    } catch {
      setSaveMsg('❌ Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this package?')) return;
    await fetch('/api/jana/tour-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_product', id }),
    });
    setProducts(ps => ps.filter(p => p.id !== id));
  }

  async function handleEdit(id: string) {
    const data = await fetch(`/api/jana/tour-builder?action=get&id=${id}`).then(r => r.json());
    const stops = (data.stops || []).map((s: any) => ({ ...s, _key: newKey() }));
    setProduct({ ...data, stops });
    setView('builder');
  }

  // ─── Root categories only ─────────────────────────────────────────────────
  const rootCats = categories.filter(c => !c.parent_id);
  const childCats = (parentId: string) => categories.filter(c => c.parent_id === parentId);
  const leafCats = categories.filter(c => {
    return c.parent_id && !categories.some(cc => cc.parent_id === c.id);
  });

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080d14', color:'#D4AF37', fontFamily:'monospace', letterSpacing:'5px' }}>
      LOADING TOUR BUILDER...
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === 'list') return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.container}>
          <Link href="/jana" style={styles.backLink}>← ADMIN DASHBOARD</Link>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <div>
              <div style={styles.badge}>TOUR ARCHITECT</div>
              <h1 style={styles.title}>PACKAGE BUILDER</h1>
              <p style={styles.subtitle}>Build multi-day tours by composing businesses into day-by-day itineraries with time scheduling.</p>
            </div>
            <button style={styles.btnPrimary} onClick={() => { setProduct(emptyProduct()); setActiveDay(1); setView('builder'); }}>
              <i className="fas fa-plus" /> NEW PACKAGE
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...styles.container, marginTop: '3rem' }}>
        {products.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🗺️</div>
            <h3 style={{ margin:'0 0 0.5rem', fontSize:'1.5rem' }}>No tour packages yet</h3>
            <p style={{ color:'#64748b' }}>Create your first package to start composing itineraries.</p>
            <button style={{ ...styles.btnPrimary, marginTop:'2rem' }} onClick={() => { setProduct(emptyProduct()); setView('builder'); }}>
              + CREATE FIRST PACKAGE
            </button>
          </div>
        ) : (
          <div style={styles.grid3}>
            {products.map(p => {
              const cat = categories.find(c => c.id === p.catalog_cat_id);
              return (
                <div key={p.id} style={styles.card}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem' }}>
                    <span style={{ ...styles.catBadge, background: cat?.color || '#0284c7' }}>
                      <i className={`fas ${cat?.icon || 'fa-route'}`} style={{ marginRight:'0.4rem' }} />
                      {p.category_name || p.catalog_cat_id}
                    </span>
                    <div style={{ display:'flex', gap:'0.75rem' }}>
                      <button style={styles.iconBtn} onClick={() => handleEdit(p.id)} title="Edit"><i className="fas fa-edit" /></button>
                      <button style={{ ...styles.iconBtn, color:'#ef4444' }} onClick={() => handleDelete(p.id)} title="Delete"><i className="fas fa-trash" /></button>
                    </div>
                  </div>
                  <h3 style={{ margin:'0 0 0.5rem', fontSize:'1.25rem', fontWeight:800 }}>{p.name}</h3>
                  <p style={{ color:'#94a3b8', fontSize:'0.8rem', lineHeight:1.5, margin:'0 0 1rem', height:'3em', overflow:'hidden' }}>{p.description}</p>
                  <div style={styles.metaRow}>
                    <span>⏱ {p.duration_days}d</span>
                    <span>💰 ${p.base_price_usd || '—'}/person</span>
                    <span>🔴 {p.stop_count || 0} stops</span>
                  </div>
                  <button style={{ ...styles.btnOutline, marginTop:'1.5rem', width:'100%' }} onClick={() => handleEdit(p.id)}>
                    OPEN BUILDER
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILDER VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={styles.page}>
      {/* ── Top bar ── */}
      <div style={styles.builderTopBar}>
        <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
          <button style={styles.iconBtn} onClick={() => setView('list')}>
            <i className="fas fa-arrow-left" /> PACKAGES
          </button>
          <input
            style={styles.titleInput}
            placeholder="Package name…"
            value={product.name}
            onChange={e => setProduct(p => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          {saveMsg && <span style={{ fontSize:'0.8rem', color: saveMsg.startsWith('✅') ? '#22c55e' : '#ef4444' }}>{saveMsg}</span>}
          <button style={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-cloud-upload-alt" />}
            {saving ? 'SAVING…' : 'SAVE PACKAGE'}
          </button>
        </div>
      </div>

      <div style={styles.builderLayout}>

        {/* ── LEFT: Settings Panel ── */}
        <div style={styles.settingsPanel}>
          <div style={styles.panelSection}>
            <label style={styles.fieldLabel}>CATEGORY</label>
            <select style={styles.select} value={product.catalog_cat_id}
              onChange={e => setProduct(p => ({ ...p, catalog_cat_id: e.target.value }))}>
              {leafCats.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.panelSection}>
            <label style={styles.fieldLabel}>DESCRIPTION</label>
            <textarea style={{ ...styles.input, minHeight:'80px', resize:'vertical' }}
              value={product.description}
              onChange={e => setProduct(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe this tour package…"
            />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div style={styles.panelSection}>
              <label style={styles.fieldLabel}>DAYS</label>
              <input type="number" min={1} max={30} style={styles.input}
                value={product.duration_days}
                onChange={e => setProduct(p => ({ ...p, duration_days: +e.target.value }))}
              />
            </div>
            <div style={styles.panelSection}>
              <label style={styles.fieldLabel}>DIFFICULTY</label>
              <select style={styles.select} value={product.difficulty}
                onChange={e => setProduct(p => ({ ...p, difficulty: e.target.value as any }))}>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="challenging">Challenging</option>
              </select>
            </div>
            <div style={styles.panelSection}>
              <label style={styles.fieldLabel}>MIN GROUP</label>
              <input type="number" min={1} style={styles.input}
                value={product.group_size_min}
                onChange={e => setProduct(p => ({ ...p, group_size_min: +e.target.value }))}
              />
            </div>
            <div style={styles.panelSection}>
              <label style={styles.fieldLabel}>MAX GROUP</label>
              <input type="number" min={1} style={styles.input}
                value={product.group_size_max}
                onChange={e => setProduct(p => ({ ...p, group_size_max: +e.target.value }))}
              />
            </div>
            <div style={styles.panelSection}>
              <label style={styles.fieldLabel}>PRICE (USD)</label>
              <input type="number" min={0} style={styles.input}
                value={product.base_price_usd || ''}
                placeholder="0"
                onChange={e => setProduct(p => ({ ...p, base_price_usd: +e.target.value || null }))}
              />
            </div>
            <div style={styles.panelSection}>
              <label style={styles.fieldLabel}>PRICE (EGP)</label>
              <input type="number" min={0} style={styles.input}
                value={product.base_price_egp || ''}
                placeholder="0"
                onChange={e => setProduct(p => ({ ...p, base_price_egp: +e.target.value || null }))}
              />
            </div>
          </div>

          <div style={styles.panelSection}>
            <label style={styles.fieldLabel}>PRICE PER</label>
            <select style={styles.select} value={product.price_per}
              onChange={e => setProduct(p => ({ ...p, price_per: e.target.value as any }))}>
              <option value="person">Per Person</option>
              <option value="group">Per Group</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>

          <div style={styles.panelSection}>
            <label style={styles.fieldLabel}>BEST SEASON</label>
            <input style={styles.input} value={product.best_season}
              onChange={e => setProduct(p => ({ ...p, best_season: e.target.value }))}
              placeholder="October to April"
            />
          </div>

          <div style={styles.panelSection}>
            <label style={styles.fieldLabel}>TOUR START DATE (Day 1)</label>
            <input type="date" style={styles.input}
              value={startDateBase}
              onChange={e => {
                setStartDateBase(e.target.value);
                // Update existing stops' start_date
                setProduct(p => ({
                  ...p,
                  stops: p.stops.map(s => ({
                    ...s,
                    start_date: (() => {
                      if (!e.target.value) return '';
                      const d = new Date(e.target.value);
                      d.setDate(d.getDate() + s.day_number - 1);
                      return d.toISOString().slice(0, 10);
                    })()
                  }))
                }));
              }}
            />
            <p style={{ color:'#64748b', fontSize:'0.7rem', margin:'0.5rem 0 0' }}>
              Sets the calendar date for each day. Day 2 = Day 1 + 1, etc.
            </p>
          </div>

          <div style={styles.panelSection}>
            <label style={styles.fieldLabel}>INCLUDED</label>
            <textarea style={{ ...styles.input, minHeight:'60px', fontSize:'0.75rem' }}
              value={product.included.join('\n')}
              onChange={e => setProduct(p => ({ ...p, included: e.target.value.split('\n').filter(Boolean) }))}
              placeholder="One item per line"
            />
          </div>
          <div style={styles.panelSection}>
            <label style={styles.fieldLabel}>EXCLUDED</label>
            <textarea style={{ ...styles.input, minHeight:'60px', fontSize:'0.75rem' }}
              value={product.excluded.join('\n')}
              onChange={e => setProduct(p => ({ ...p, excluded: e.target.value.split('\n').filter(Boolean) }))}
              placeholder="One item per line"
            />
          </div>

          <div style={styles.panelSection}>
            <label style={styles.fieldLabel}>HIGHLIGHTS (one per line)</label>
            <textarea style={{ ...styles.input, minHeight:'80px', fontSize:'0.75rem' }}
              value={product.highlights.join('\n')}
              onChange={e => setProduct(p => ({ ...p, highlights: e.target.value.split('\n').filter(Boolean) }))}
            />
          </div>

          <div style={{ display:'flex', gap:'1rem' }}>
            <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.8rem' }}>
              <input type="checkbox" checked={product.is_public}
                onChange={e => setProduct(p => ({ ...p, is_public: e.target.checked }))} />
              Public
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.8rem' }}>
              <input type="checkbox" checked={product.is_featured}
                onChange={e => setProduct(p => ({ ...p, is_featured: e.target.checked }))} />
              Featured
            </label>
          </div>
        </div>

        {/* ── CENTER: Day Timeline ── */}
        <div style={styles.timelinePanel}>
          {/* Day selector tabs */}
          <div style={styles.dayTabs}>
            {daysArray.map(d => (
              <button key={d}
                style={{ ...styles.dayTab, ...(activeDay === d ? styles.dayTabActive : {}) }}
                onClick={() => setActiveDay(d)}>
                <span style={{ fontWeight:900 }}>Day {d}</span>
                {computeDate(d) && <span style={{ fontSize:'0.65rem', opacity:0.7, display:'block' }}>{computeDate(d)}</span>}
                <span style={{ fontSize:'0.65rem', opacity:0.6, display:'block' }}>
                  {stopsForDay(d).length} stops
                </span>
              </button>
            ))}
          </div>

          {/* Stops for active day */}
          <div style={styles.timelineArea}>
            {stopsForDay(activeDay).length === 0 ? (
              <div style={styles.emptyDay}>
                <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>📅</div>
                <div style={{ fontWeight:700, marginBottom:'0.5rem' }}>Day {activeDay} is empty</div>
                <div style={{ color:'#64748b', fontSize:'0.8rem' }}>Search for a business on the right and click a role to add it here.</div>
              </div>
            ) : (
              stopsForDay(activeDay).map(stop => {
                const role = ROLE_MAP[stop.stop_role];
                return (
                  <div key={stop._key} style={{ ...styles.stopCard, borderLeftColor: role.color }}>
                    {/* Role badge + Business name row */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <span style={{ ...styles.rolePill, background: role.color }}>
                          {role.emoji} {role.label.toUpperCase()}
                        </span>
                        <div>
                          <div style={{ fontWeight:800, fontSize:'0.95rem' }}>
                            <i className={`fas ${stop.type_icon || 'fa-store'}`} style={{ color: stop.type_icon_color || '#D4AF37', marginRight:'0.5rem' }} />
                            {stop.business_name}
                          </div>
                          <div style={{ color:'#64748b', fontSize:'0.7rem' }}>{stop.type_name}</div>
                        </div>
                      </div>
                      <button style={{ ...styles.iconBtn, color:'#ef4444' }} onClick={() => removeStop(stop._key)}>
                        <i className="fas fa-times" />
                      </button>
                    </div>

                    {/* Time row */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:'0.75rem', alignItems:'end', marginBottom:'0.75rem' }}>
                      <div>
                        <label style={styles.miniLabel}>START TIME</label>
                        <input type="time" style={styles.timeInput}
                          value={stop.start_time}
                          onChange={e => updateStop(stop._key, { start_time: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={styles.miniLabel}>END TIME</label>
                        <input type="time" style={styles.timeInput}
                          value={stop.end_time}
                          onChange={e => updateStop(stop._key, { end_time: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={styles.miniLabel}>DATE</label>
                        <input type="date" style={styles.timeInput}
                          value={stop.start_date}
                          onChange={e => updateStop(stop._key, { start_date: e.target.value })}
                        />
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <label style={styles.miniLabel}>DURATION</label>
                        <div style={{ color:'#D4AF37', fontWeight:900, fontSize:'1rem', paddingTop:'0.4rem' }}>
                          {stop.duration_hours ? `${stop.duration_hours}h` : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Role + optional row */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem', marginBottom:'0.5rem' }}>
                      <div>
                        <label style={styles.miniLabel}>ROLE</label>
                        <select style={styles.miniSelect}
                          value={stop.stop_role}
                          onChange={e => updateStop(stop._key, { stop_role: e.target.value as StopRole })}>
                          {ROLES.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={styles.miniLabel}>PRICE (USD)</label>
                        <input type="number" style={styles.miniInput} placeholder="0"
                          value={stop.price_usd || ''}
                          onChange={e => updateStop(stop._key, { price_usd: +e.target.value || null })}
                        />
                      </div>
                      <div style={{ display:'flex', alignItems:'flex-end', paddingBottom:'0.3rem' }}>
                        <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer', fontSize:'0.75rem', color:'#94a3b8' }}>
                          <input type="checkbox" checked={stop.is_optional}
                            onChange={e => updateStop(stop._key, { is_optional: e.target.checked })} />
                          Optional stop
                        </label>
                      </div>
                    </div>

                    {/* Notes */}
                    <input style={{ ...styles.miniInput, width:'100%' }}
                      placeholder="Notes for this stop (optional)…"
                      value={stop.notes}
                      onChange={e => updateStop(stop._key, { notes: e.target.value })}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT: Business Picker ── */}
        <div style={styles.pickerPanel}>
          <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontWeight:900, fontSize:'0.75rem', letterSpacing:'1px', color:'#D4AF37', marginBottom:'0.75rem' }}>
              ADD STOP → DAY {activeDay}
            </div>
            <input style={{ ...styles.input, marginBottom:'0.5rem' }}
              placeholder="🔍 Search businesses…"
              value={bizSearch}
              onChange={e => setBizSearch(e.target.value)}
            />
            {/* Role filter buttons */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
              <button style={{ ...styles.rolePill, background: bizRoleFilter === '' ? '#D4AF37' : 'rgba(255,255,255,0.07)', color: bizRoleFilter === '' ? '#0f172a' : '#fff', cursor:'pointer', border:'none' }}
                onClick={() => setBizRoleFilter('')}>All</button>
              {ROLES.map(r => (
                <button key={r.id}
                  style={{ ...styles.rolePill, background: bizRoleFilter === r.id ? r.color : 'rgba(255,255,255,0.07)', cursor:'pointer', border:'none', color:'#fff' }}
                  onClick={() => setBizRoleFilter(r.id === bizRoleFilter ? '' : r.id)}>
                  {r.emoji}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowY:'auto', flex:1 }}>
            {businesses.map(biz => (
              <div key={biz.id} style={styles.bizRow}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flex:1, minWidth:0 }}>
                  <i className={`fas ${biz.type_icon || 'fa-store'}`}
                    style={{ color: biz.type_icon_color || '#D4AF37', fontSize:'1.1rem', minWidth:'1.2rem', textAlign:'center' }} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'0.82rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{biz.name}</div>
                    <div style={{ color:'#64748b', fontSize:'0.65rem' }}>{biz.parent_type_name} › {biz.type_name}</div>
                  </div>
                </div>
                {/* Role add buttons */}
                <div style={{ display:'flex', gap:'0.3rem', flexShrink:0 }}>
                  {ROLES.map(r => (
                    <button key={r.id}
                      title={`Add as ${r.label}`}
                      style={{ ...styles.addRoleBtn, background: r.color }}
                      onClick={() => addStop(biz, r.id)}>
                      {r.emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {businesses.length === 0 && (
              <div style={{ padding:'2rem', textAlign:'center', color:'#475569', fontSize:'0.8rem' }}>
                No businesses found. Try a different search or role filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: { minHeight:'100vh', background:'#080d14', color:'#e2e8f0', fontFamily:"'Inter', sans-serif" },
  header: { background:'#0f172a', padding:'5rem 0 3rem', borderBottom:'1px solid rgba(255,255,255,0.05)' },
  container: { maxWidth:'1600px', margin:'0 auto', padding:'0 2rem' },
  backLink: { color:'#D4AF37', textDecoration:'none', fontWeight:800, fontSize:'0.75rem', letterSpacing:'1px', display:'block', marginBottom:'1.5rem' },
  badge: { background:'#D4AF37', color:'#0f172a', padding:'3px 10px', borderRadius:'50px', fontSize:'0.6rem', fontWeight:900, letterSpacing:'2px', display:'inline-block', marginBottom:'0.75rem' },
  title: { fontSize:'2.5rem', fontWeight:900, margin:'0 0 0.5rem', letterSpacing:'-1.5px', fontFamily:"'Outfit', sans-serif" },
  subtitle: { color:'#64748b', margin:0, fontSize:'0.9rem' },
  btnPrimary: { background:'#D4AF37', color:'#0f172a', border:'none', padding:'0.85rem 1.75rem', borderRadius:'10px', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.85rem' },
  btnOutline: { background:'transparent', border:'1px solid rgba(255,255,255,0.15)', color:'#e2e8f0', padding:'0.75rem 1.25rem', borderRadius:'10px', fontWeight:700, cursor:'pointer', fontSize:'0.8rem' },
  iconBtn: { background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'0.9rem', padding:'0.25rem' },
  grid3: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:'1.5rem' },
  card: { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'20px', padding:'1.75rem' },
  catBadge: { display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:'50px', fontSize:'0.65rem', fontWeight:900, color:'#fff' },
  metaRow: { display:'flex', gap:'1rem', fontSize:'0.78rem', color:'#94a3b8' },
  emptyState: { textAlign:'center', padding:'8rem 2rem', color:'#e2e8f0' },

  // Builder layout
  builderTopBar: { background:'#0f172a', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0.85rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100 },
  titleInput: { background:'transparent', border:'none', color:'#fff', fontSize:'1.1rem', fontWeight:800, outline:'none', width:'320px' },
  builderLayout: { display:'grid', gridTemplateColumns:'280px 1fr 340px', height:'calc(100vh - 56px)', overflow:'hidden' },
  settingsPanel: { borderRight:'1px solid rgba(255,255,255,0.06)', overflowY:'auto', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.25rem' },
  timelinePanel: { display:'flex', flexDirection:'column', overflow:'hidden' },
  pickerPanel: { borderLeft:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', overflow:'hidden' },

  // Day tabs
  dayTabs: { display:'flex', gap:'0', borderBottom:'1px solid rgba(255,255,255,0.06)', overflowX:'auto', background:'rgba(0,0,0,0.2)' },
  dayTab: { background:'none', border:'none', borderBottom:'3px solid transparent', color:'#64748b', padding:'0.85rem 1.25rem', cursor:'pointer', fontSize:'0.8rem', minWidth:'80px', transition:'all 0.2s', textAlign:'center' as const },
  dayTabActive: { color:'#D4AF37', borderBottomColor:'#D4AF37', background:'rgba(212,175,55,0.05)' },

  // Timeline
  timelineArea: { overflowY:'auto', flex:1, padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' },
  emptyDay: { textAlign:'center', padding:'5rem 2rem', color:'#475569' },
  stopCard: { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderLeft:'4px solid #6366f1', borderRadius:'16px', padding:'1.25rem' },
  rolePill: { display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:'50px', fontSize:'0.65rem', fontWeight:900, color:'#fff' },

  // Forms
  panelSection: { display:'flex', flexDirection:'column', gap:'0.35rem', marginBottom:'0.5rem' },
  fieldLabel: { fontSize:'0.6rem', fontWeight:900, color:'#D4AF37', letterSpacing:'1.5px' },
  miniLabel: { fontSize:'0.58rem', fontWeight:900, color:'#64748b', letterSpacing:'1px', display:'block', marginBottom:'0.25rem' },
  input: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'8px', padding:'0.6rem 0.75rem', color:'#e2e8f0', fontSize:'0.85rem', outline:'none', width:'100%', boxSizing:'border-box' as const },
  select: { background:'#0f172a', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'8px', padding:'0.6rem 0.75rem', color:'#e2e8f0', fontSize:'0.85rem', outline:'none', width:'100%' },
  timeInput: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'8px', padding:'0.5rem 0.6rem', color:'#e2e8f0', fontSize:'0.82rem', outline:'none', width:'100%', boxSizing:'border-box' as const, colorScheme:'dark' as any },
  miniInput: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'6px', padding:'0.45rem 0.6rem', color:'#e2e8f0', fontSize:'0.78rem', outline:'none', boxSizing:'border-box' as const },
  miniSelect: { background:'#0f172a', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'6px', padding:'0.45rem 0.6rem', color:'#e2e8f0', fontSize:'0.78rem', outline:'none', width:'100%' },

  // Business picker
  bizRow: { display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.2s' },
  addRoleBtn: { border:'none', color:'#fff', width:'28px', height:'28px', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', display:'flex', alignItems:'center', justifyContent:'center' },
};
