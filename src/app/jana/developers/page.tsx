'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';

/**
 * Admin panel for the `developers` entity — the companies behind the projects.
 *
 * Mirrors `/api/jana/developers`. The one rule this screen exists to protect is
 * the stability rule: a developer's slug is chosen at creation and then FROZEN,
 * so editing the display name never moves the public URL. The slug only changes
 * when the admin edits the slug field on purpose, and placing a developer at the
 * site root (siwify.com/{slug}) is a warned, deliberate act — so both live behind
 * an explicit "on your responsibility" notice rather than being implicit.
 */
interface DeveloperRow {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  logoUrl: string | null;
  about: string | null;
  aboutAr: string | null;
  active: boolean;
  placeAtRoot: boolean;
  projects: number;
  businessId: string | null;
  businessName: string | null;
}

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: '0.62rem',
  fontWeight: 800,
  letterSpacing: '0.05em',
  color: '#6b7280',
  marginBottom: '0.25rem',
};

function Badge({ tone, children }: { tone: 'live' | 'warn' | 'muted' | 'dark'; children: React.ReactNode }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    live: { bg: '#dcfce7', fg: '#166534' },
    warn: { bg: '#fef3c7', fg: '#92400e' },
    muted: { bg: '#e2e8f0', fg: '#475569' },
    dark: { bg: '#1e293b', fg: '#e2e8f0' },
  };
  const c = palette[tone] || palette.muted;
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        fontSize: '0.6rem',
        fontWeight: 800,
        padding: '0.15rem 0.45rem',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function DeveloperForm({
  draft,
  onClose,
  onSaved,
}: {
  draft: DeveloperRow | 'new';
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = draft !== 'new';
  const base = draft === 'new' ? null : draft;
  const { notify } = useAdmin();
  const [form, setForm] = useState({
    name: base?.name || '',
    nameAr: base?.nameAr || '',
    // A manual slug wins at creation; on edit it is shown but frozen unless the
    // admin changes it on purpose. Sending an unchanged slug is a no-op server-side.
    slug: base?.slug || '',
    logoUrl: base?.logoUrl || '',
    about: base?.about || '',
    aboutAr: base?.aboutAr || '',
    active: base ? base.active : true,
    placeAtRoot: base ? Boolean(base.placeAtRoot) : false,
    // The corporate businesses row that carries this brand's identity/contacts.
    // Sent only when present; an empty value clears the link server-side.
    businessSlug: base?.businessId || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rootPreview = form.slug || 'slug';

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      // businessSlug rides along ONLY when it actually changed. Sending it every
      // time would touch the business_id column on unrelated edits — which needs
      // migration 20261109 to have landed. Unchanged (including blank) stays out.
      const { businessSlug, ...rest } = form;
      const payload: Record<string, any> = editing ? { id: base?.id, ...rest } : { ...rest };
      if (businessSlug !== (base?.businessId || '')) payload.businessSlug = businessSlug;
      const res = await fetch('/api/jana/developers', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save it');
      notify(editing ? 'Developer updated' : 'Developer created', 'success');
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Could not save it');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: '#fffbeb',
        border: '2px solid #D4AF37',
        borderRadius: '10px',
        padding: '1rem',
        margin: '0.75rem 0',
      }}
    >
      <h5 style={{ margin: '0 0 0.75rem 0', color: '#92400e' }}>
        <i className="fas fa-building-circle-exclamation"></i>{' '}
        {editing ? `EDIT ${base?.name}` : 'NEW DEVELOPER / BRAND'}
      </h5>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div>
          <label style={LABEL}>NAME (ENGLISH) *</label>
          <input
            className="form-control"
            value={form.name}
            placeholder="Sodic"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label style={LABEL}>NAME (ARABIC)</label>
          <input
            className="form-control"
            dir="rtl"
            value={form.nameAr}
            placeholder="السعودية المصرية للتعمير"
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={LABEL}>LOGO URL</label>
          <input
            className="form-control"
            value={form.logoUrl}
            placeholder="https://…/logo.png"
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          />
        </div>
        <div>
          <label style={LABEL}>ABOUT (ENGLISH)</label>
          <textarea
            className="form-control"
            rows={3}
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
          />
        </div>
        <div>
          <label style={LABEL}>ABOUT (ARABIC)</label>
          <textarea
            className="form-control"
            rows={3}
            dir="rtl"
            value={form.aboutAr}
            onChange={(e) => setForm({ ...form, aboutAr: e.target.value })}
          />
        </div>

        {/* ── Corporate presence: reuse the business engine ─────────────────
            A developer is a company, and a company's identity / offices / contacts
            already live on a businesses row. Linking one here lets the brand borrow
            that minisite — and its per-field show/hide — instead of duplicating it. */}
        <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #d4af37', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400e', marginBottom: '0.4rem' }}>
            <i className="fas fa-building-shield"></i> CORPORATE PRESENCE — <span style={{ fontWeight: 600 }}>هوية الشركة · offices &amp; contacts</span>
          </div>
          <label style={LABEL}>BUSINESS SLUG OR ID — the minisite that speaks for this brand</label>
          <input
            className="form-control"
            value={form.businessSlug}
            placeholder="e.g. sodic-head-office, or a business id"
            onChange={(e) => setForm({ ...form, businessSlug: e.target.value })}
          />
          <div style={{ fontSize: '0.68rem', color: '#b45309', marginTop: '0.4rem', lineHeight: 1.5 }}>
            {base?.businessName ? (
              <>
                Currently linked to <strong>{base.businessName}</strong>. That page already decides which offices,
                addresses and contact numbers are shown or hidden — this only points the developer at it. Clear
                the field to unlink.
              </>
            ) : (
              <>
                A developer stays thin by design. Link one businesses row to give the brand a corporate home —
                identity, offices, addresses, contact numbers — whose show/hide is governed on that business’s
                own page. Leave blank for none. (Requires migration 20261109.)
              </>
            )}
          </div>
        </div>

        {/* ── The address is the admin's upper hand ──────────────────────────
            A developer normally answers at /developers/{slug}. The slug is frozen
            after creation — renaming the brand never moves the URL — and placing it
            at siwify.com/{slug} is a warned act. Both controls carry the notice. */}
        <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #d4af37', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400e', marginBottom: '0.4rem' }}>
            <i className="fas fa-link"></i> ADDRESS — <span style={{ fontWeight: 600 }}>العنوان على مسؤوليتك · on your responsibility</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
            <div>
              <label style={LABEL}>SLUG {editing ? '(frozen unless changed on purpose)' : '(optional — auto-derived from name if blank)'}</label>
              <input
                className="form-control"
                value={form.slug}
                placeholder="sodic"
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                id={`dev-root-${form.slug || 'new'}`}
                type="checkbox"
                checked={form.placeAtRoot}
                onChange={(e) => setForm({ ...form, placeAtRoot: e.target.checked })}
              />
              <label htmlFor={`dev-root-${form.slug || 'new'}`} style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280' }}>
                PLACE AT ROOT — siwify.com/{rootPreview}
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                id={`dev-active`}
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              <label htmlFor={`dev-active`} style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280' }}>
                VISIBLE
              </label>
            </div>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#b45309', marginTop: '0.4rem', lineHeight: 1.5 }}>
            Default page: <code>siwify.com/developers/{rootPreview}</code>.
            Editing the name above never changes this address. Changing the slug or placing it at the root
            breaks any link already shared, and a root slug that collides with an app route or an existing
            developer will be rejected. Do it only after reading this — you are choosing the address yourself.
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: '0.6rem', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 700 }}>{error}</div>
      )}

      <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.6rem' }}>
        <button className="btn btn-primary" onClick={submit} disabled={saving || !form.name.trim()}>
          {saving ? 'SAVING…' : editing ? 'SAVE CHANGES' : 'CREATE DEVELOPER'}
        </button>
        <button className="btn btn-outline" onClick={onClose}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

export default function DevelopersAdminPage() {
  const { notify } = useAdmin();
  const [developers, setDevelopers] = useState<DeveloperRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<DeveloperRow | 'new' | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/jana/developers', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDevelopers(Array.isArray(data.developers) ? data.developers : []);
      } else {
        const data = await res.json().catch(() => ({}));
        notify(data.error || 'Could not load developers', 'error');
      }
    } catch {
      notify('Could not load developers', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (dev: DeveloperRow) => {
    if (
      !confirm(
        `Delete "${dev.name}"? Their ${dev.projects} project(s) stay but lose the developer link — a build is never erased with its builder.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/jana/developers?id=${encodeURIComponent(dev.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      notify(`"${dev.name}" deleted`, 'success');
      await load();
    } catch (e: any) {
      notify(e.message || 'Delete failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37' }}></i>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ marginBottom: '0.25rem' }}>
            <i className="fas fa-building-circle-exclamation"></i> Developers &amp; Brands
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>
            The companies behind the projects. Each one aggregates its developments across every market.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setDraft('new')}>
          <i className="fas fa-plus"></i> NEW DEVELOPER
        </button>
      </div>

      {draft && (
        <DeveloperForm draft={draft} onClose={() => setDraft(null)} onSaved={load} />
      )}

      <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
        {developers.length === 0 && (
          <div style={{ color: '#6b7280', fontSize: '0.85rem', padding: '1.5rem', textAlign: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            No developers yet. A brand appears here automatically when an admin names it on a project, or add one now.
          </div>
        )}
        {developers.map((dev) => (
          <div
            key={dev.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              padding: '0.6rem 0.75rem',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderLeft: `3px solid ${dev.placeAtRoot ? '#D4AF37' : '#cbd5e1'}`,
              borderRadius: '8px',
            }}
          >
            {dev.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dev.logoUrl} alt="" style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 6, background: '#f8fafc' }} />
            ) : (
              <i className="fas fa-building" style={{ color: '#94a3b8', width: 34, textAlign: 'center' }}></i>
            )}
            <div style={{ flex: 1, minWidth: '160px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                {dev.name}
                {dev.nameAr ? <span style={{ fontWeight: 600, color: '#64748b' }}> · {dev.nameAr}</span> : null}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                {dev.placeAtRoot ? `siwify.com/${dev.slug}` : `/developers/${dev.slug}`} · {dev.projects} project(s)
              </div>
            </div>
            {dev.placeAtRoot && <Badge tone="warn">AT ROOT</Badge>}
            {dev.businessId && <Badge tone="muted">CORPORATE</Badge>}
            <Badge tone={dev.active ? 'live' : 'dark'}>{dev.active ? 'LIVE' : 'HIDDEN'}</Badge>
            <Link
              href={dev.placeAtRoot ? `/${dev.slug}` : `/developers/${dev.slug}`}
              target="_blank"
              className="btn btn-xs btn-outline"
              style={{ color: '#10b981', borderColor: '#10b981' }}
            >
              <i className="fas fa-external-link-alt"></i>
            </Link>
            <button className="btn btn-xs btn-outline" onClick={() => setDraft(dev)}>
              <i className="fas fa-pen"></i>
            </button>
            <button
              className="btn btn-xs btn-outline"
              style={{ color: '#ef4444', borderColor: '#ef4444' }}
              disabled={busy}
              onClick={() => remove(dev)}
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
