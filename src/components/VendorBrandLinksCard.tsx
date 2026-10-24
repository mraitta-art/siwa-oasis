'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { VENDOR_OPTIONAL_CONSENTS, VENDOR_SOCIAL_FIELDS } from '@/lib/vendor-consents';

interface GoogleSnapshot {
  place_id: string;
  name: string;
  rating: number | null;
  review_count: number | null;
  opening_hours: string[];
  maps_uri: string;
  fetched_at: string;
}

interface BrandLinksState {
  social: Record<string, string>;
  googleProfileUrl: string;
  consents: Record<string, boolean>;
}

interface PledgeView {
  status: 'none' | 'pending' | 'verified' | 'expired';
  accepted_at: string;
  grace_ends_at: string;
  days_remaining: number;
  verified_sources: string[];
  google_website_url: string | null;
}

interface PromoItem {
  platform: string;
  label: string;
  field: 'bio' | 'website';
  limit: number | null;
  value: string;
  deepLink: string;
  note: string;
}

interface GoogleSetup {
  name: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  photos: string[];
  addBusinessUrl: string;
  note: string;
}

const EMPTY_STATE: BrandLinksState = {
  social: { instagram_handle: '', facebook_link: '', tiktok_handle: '' },
  googleProfileUrl: '',
  consents: { social_links: false, google_place_data: false },
};

function formatDate(value: string | null | undefined) {
  if (!value) return 'never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'never';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Vendor-facing control for the optional permissions: social links and the
 * read-only Google profile snapshot. Lives on the intake studio because every
 * /vendor/* sub-route redirects back to /vendor.
 */
export default function VendorBrandLinksCard() {
  const [state, setState] = useState<BrandLinksState>(EMPTY_STATE);
  const [snapshot, setSnapshot] = useState<GoogleSnapshot | null>(null);
  const [configured, setConfigured] = useState(true);
  const [pledge, setPledge] = useState<PledgeView | null>(null);
  const [promoKit, setPromoKit] = useState<PromoItem[]>([]);
  const [minisiteUrl, setMinisiteUrl] = useState('');
  const [googleStatus, setGoogleStatus] = useState<'unknown' | 'linked' | 'absent'>('unknown');
  const [googleSetup, setGoogleSetup] = useState<GoogleSetup | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [linksResponse, placeResponse, pledgeResponse] = await Promise.all([
        fetch('/api/vendor/brand-links'),
        fetch('/api/vendor/google-place'),
        fetch('/api/vendor/pledge'),
      ]);

      if (linksResponse.ok) {
        const data = await linksResponse.json();
        setState({
          social: { ...EMPTY_STATE.social, ...(data.social || {}) },
          googleProfileUrl: data.googleProfileUrl || '',
          consents: { ...EMPTY_STATE.consents, ...(data.consents || {}) },
        });
      }

      if (placeResponse.ok) {
        const data = await placeResponse.json();
        setConfigured(data.configured !== false);
        setSnapshot(data.snapshot || null);
      }

      if (pledgeResponse.ok) {
        const data = await pledgeResponse.json();
        setPledge(data.pledge || null);
        setPromoKit(Array.isArray(data.promoKit) ? data.promoKit : []);
        setMinisiteUrl(data.minisiteUrl || '');
        setGoogleStatus(data.googlePlaceStatus || 'unknown');
        setGoogleSetup(data.googleSetup || null);
      }
    } catch {
      setMessage({ tone: 'warn', text: 'Could not load your link settings.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/vendor/brand-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          social: state.social,
          googleProfileUrl: state.googleProfileUrl,
          consents: state.consents,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save.');
      setState({
        social: { ...EMPTY_STATE.social, ...(data.social || {}) },
        googleProfileUrl: data.googleProfileUrl || '',
        consents: { ...EMPTY_STATE.consents, ...(data.consents || {}) },
      });
      setMessage({ tone: 'ok', text: 'Saved. Your minisite will show the updates within a minute.' });
    } catch (error: any) {
      setMessage({ tone: 'warn', text: error?.message || 'Unable to save.' });
    } finally {
      setSaving(false);
    }
  }

  async function syncGoogle() {
    setSyncing(true);
    setMessage(null);
    try {
      const response = await fetch('/api/vendor/google-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Google data is unavailable.');
      setSnapshot(data.snapshot || null);
      setMessage({ tone: 'ok', text: data.cached ? 'Showing your cached Google data.' : 'Google profile refreshed.' });
    } catch (error: any) {
      setMessage({ tone: 'warn', text: error?.message || 'Google data is unavailable.' });
    } finally {
      setSyncing(false);
    }
  }

  async function withdraw(consentId: string) {
    setState(current => ({ ...current, consents: { ...current.consents, [consentId]: false } }));
    try {
      await fetch(`/api/vendor/brand-links?consent=${encodeURIComponent(consentId)}`, { method: 'DELETE' });
      if (consentId === 'google_place_data') setSnapshot(null);
      setMessage({ tone: 'ok', text: 'Permission withdrawn.' });
    } catch {
      setMessage({ tone: 'warn', text: 'Could not withdraw the permission. Please retry.' });
    }
  }

  async function runPledge(action: 'verify' | 'accept') {
    setChecking(true);
    setMessage(null);
    try {
      const response = await fetch('/api/vendor/pledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update the pledge.');

      setPledge(data.pledge || null);
      setPromoKit(Array.isArray(data.promoKit) ? data.promoKit : []);
      setGoogleStatus(data.googlePlaceStatus || 'unknown');
      setGoogleSetup(data.googleSetup || null);

      const status = data.verification?.status;
      if (status === 'verified') {
        setMessage({ tone: 'ok', text: 'Verified — your Google profile links to your minisite.' });
      } else if (status === 'absent') {
        setMessage({ tone: 'warn', text: 'We could not find a Google profile for this business. Create it with the details below — we will detect it automatically.' });
      } else if (status === 'linked') {
        setMessage({ tone: 'warn', text: 'Google profile found, but its website field does not point to your minisite yet.' });
      } else if (action === 'accept') {
        setMessage({ tone: 'ok', text: 'Pledge recorded. Add the link wherever you can, then check again.' });
      } else {
        setMessage({ tone: 'warn', text: data.verification?.message || 'Could not check Google right now.' });
      }
    } catch (error: any) {
      setMessage({ tone: 'warn', text: error?.message || 'Unable to update the pledge.' });
    } finally {
      setChecking(false);
    }
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage({ tone: 'ok', text: 'Copied. Paste it in the platform, then come back and check.' });
    } catch {
      setMessage({ tone: 'warn', text: 'Copy failed — select the text manually.' });
    }
  }

  return (
    <section
      style={{
        marginBottom: '1.5rem',
        background: '#fff',
        border: '1px solid #eef0f5',
        borderRadius: '22px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
        <div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '1.2px', fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase' }}>
            Links &amp; Google
          </div>
          <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
            Social profiles and Google rating
          </h2>
        </div>
        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, maxWidth: 320, lineHeight: 1.6 }}>
          Optional. Each permission can be withdrawn at any time without affecting your minisite.
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '1rem 0', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>Loading your settings…</div>
      ) : (
        <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
          {/* Mutual visibility pledge — the free-plan condition */}
          <div style={{ border: '1px solid rgba(212,175,55,0.35)', borderRadius: 14, padding: '0.9rem 1rem', background: 'rgba(212,175,55,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, color: '#0f172a' }}>Mutual visibility pledge</span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginTop: 2, lineHeight: 1.6 }}>
                  Required for the free plan: one visible link to {minisiteUrl ? <strong>{minisiteUrl}</strong> : 'your minisite'} from your Google profile or a social bio.
                </span>
              </div>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: '0.64rem',
                  fontWeight: 900,
                  whiteSpace: 'nowrap',
                  background: pledge?.status === 'verified' ? '#dcfce7' : pledge?.status === 'expired' ? '#fee2e2' : '#fef3c7',
                  color: pledge?.status === 'verified' ? '#166534' : pledge?.status === 'expired' ? '#991b1b' : '#92400e',
                }}
              >
                {!pledge
                  ? 'Not recorded'
                  : pledge.status === 'verified'
                    ? 'Verified'
                    : pledge.status === 'expired'
                      ? 'Perks paused'
                      : `${pledge.days_remaining} days left`}
              </span>
            </div>

            {!pledge ? (
              <button
                type="button"
                onClick={() => runPledge('accept')}
                disabled={checking}
                style={{ marginTop: '0.8rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, padding: '0.55rem 1rem', fontSize: '0.72rem', fontWeight: 900, cursor: checking ? 'wait' : 'pointer' }}
              >
                {checking ? 'Recording…' : 'Accept the visibility pledge'}
              </button>
            ) : (
              <div style={{ marginTop: '0.7rem', display: 'grid', gap: '0.55rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {['google', 'instagram', 'facebook', 'tiktok'].map(source => {
                    const found = pledge.verified_sources.includes(source);
                    return (
                      <span
                        key={source}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: '0.64rem', fontWeight: 800, padding: '3px 9px', borderRadius: 999,
                          background: found ? '#f0fdf4' : '#f8fafc',
                          border: `1px solid ${found ? '#bbf7d0' : '#e2e8f0'}`,
                          color: found ? '#166534' : '#94a3b8',
                          textTransform: 'capitalize',
                        }}
                      >
                        <i className={found ? 'fas fa-check' : 'far fa-circle'} style={{ fontSize: '0.55rem' }} />
                        {source}
                      </span>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => runPledge('verify')}
                    disabled={checking}
                    style={{ background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 10, padding: '0.45rem 0.85rem', fontSize: '0.7rem', fontWeight: 900, cursor: checking ? 'wait' : 'pointer' }}
                  >
                    {checking ? 'Checking…' : 'Check Google now'}
                  </button>
                  {pledge.google_website_url && !pledge.verified_sources.includes('google') && (
                    <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#b45309', wordBreak: 'break-all' }}>
                      Google currently lists: {pledge.google_website_url}
                    </span>
                  )}
                  <span style={{ fontSize: '0.64rem', color: '#94a3b8', fontWeight: 700 }}>
                    Accepted {formatDate(pledge.accepted_at)} · minisite stays online even if the link is missing
                  </span>
                </div>

                {googleStatus === 'absent' && !pledge.verified_sources.includes('google') && googleSetup && (
                  <div style={{ border: '1px solid #fde68a', background: '#fffbeb', borderRadius: 12, padding: '0.75rem 0.85rem' }}>
                    <strong style={{ display: 'block', fontSize: '0.72rem', color: '#92400e' }}>No Google profile found for this business</strong>
                    <span style={{ display: 'block', fontSize: '0.66rem', color: '#a16207', marginTop: 2, lineHeight: 1.6 }}>
                      Use these prepared details to create it once, then press “Check Google now” — we detect it automatically.
                    </span>
                    <div style={{ marginTop: '0.5rem', display: 'grid', gap: 2, fontSize: '0.68rem', color: '#475569' }}>
                      {[
                        { label: 'Name', value: googleSetup.name },
                        { label: 'Category', value: googleSetup.category },
                        { label: 'Address', value: googleSetup.address },
                        { label: 'Phone', value: googleSetup.phone },
                        { label: 'Website', value: googleSetup.website },
                      ].filter(row => row.value).map(row => (
                        <div key={row.label}>
                          <strong style={{ color: '#0f172a' }}>{row.label}: </strong>{row.value}
                        </div>
                      ))}
                    </div>
                    {googleSetup.description && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.66rem', color: '#64748b', lineHeight: 1.6 }}>{googleSetup.description}</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                      <button
                        type="button"
                        onClick={() => copyText([
                          `Name: ${googleSetup.name}`,
                          googleSetup.category ? `Category: ${googleSetup.category}` : '',
                          googleSetup.address ? `Address: ${googleSetup.address}` : '',
                          googleSetup.phone ? `Phone: ${googleSetup.phone}` : '',
                          `Website: ${googleSetup.website}`,
                          googleSetup.description ? `\n${googleSetup.description}` : '',
                        ].filter(Boolean).join('\n'))}
                        style={{ background: '#fff', color: '#92400e', border: '1px solid #fcd34d', borderRadius: 8, padding: '0.35rem 0.7rem', fontSize: '0.66rem', fontWeight: 900, cursor: 'pointer' }}
                      >
                        Copy details
                      </button>
                      <a
                        href={googleSetup.addBusinessUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.66rem', fontWeight: 900, color: '#92400e', textDecoration: 'none' }}
                      >
                        Create it on Google <i className="fas fa-arrow-up-right-from-square" style={{ fontSize: '0.55rem' }} />
                      </a>
                    </div>
                    <div style={{ marginTop: '0.4rem', fontSize: '0.62rem', color: '#a16207', lineHeight: 1.6 }}>{googleSetup.note}</div>
                  </div>
                )}
              </div>
            )}

            {pledge && promoKit.length > 0 && (
              <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.85rem' }}>
                {promoKit.map(item => (
                  <div key={item.platform} style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: 12, padding: '0.65rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0f172a' }}>{item.label}</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8' }}>
                        {item.field === 'bio' ? `${item.value.length}/${item.limit} characters` : 'URL field'}
                      </span>
                    </div>
                    <code style={{ display: 'block', margin: '0.4rem 0', padding: '0.45rem 0.55rem', background: '#f8fafc', border: '1px solid #eef0f5', borderRadius: 8, fontSize: '0.72rem', color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {item.value}
                    </code>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => copyText(item.value)}
                        style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '0.35rem 0.7rem', fontSize: '0.66rem', fontWeight: 900, cursor: 'pointer' }}
                      >
                        Copy
                      </button>
                      <a
                        href={item.deepLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.66rem', fontWeight: 900, color: '#0f766e', textDecoration: 'none' }}
                      >
                        Open <i className="fas fa-arrow-up-right-from-square" style={{ fontSize: '0.55rem' }} />
                      </a>
                    </div>
                    <div style={{ marginTop: '0.35rem', fontSize: '0.62rem', color: '#94a3b8', lineHeight: 1.6 }}>{item.note}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {VENDOR_OPTIONAL_CONSENTS.map(consent => {
            const granted = Boolean(state.consents[consent.id]);
            return (
              <div key={consent.id} style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: '0.9rem 1rem' }}>
                <label style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={granted}
                    onChange={event => {
                      if (event.target.checked) {
                        setState(current => ({ ...current, consents: { ...current.consents, [consent.id]: true } }));
                      } else {
                        withdraw(consent.id);
                      }
                    }}
                    style={{ marginTop: 3, width: 18, height: 18, accentColor: '#D4AF37' }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, color: '#0f172a' }}>{consent.title}</span>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', lineHeight: 1.65, marginTop: 2 }}>{consent.body}</span>
                  </span>
                </label>

                {consent.id === 'social_links' && granted && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', marginTop: '0.85rem' }}>
                    {VENDOR_SOCIAL_FIELDS.map(field => (
                      <label key={field.key} style={{ display: 'grid', gap: 4, fontSize: '0.66rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {field.label}
                        <input
                          value={state.social[field.key] || ''}
                          onChange={event =>
                            setState(current => ({
                              ...current,
                              social: { ...current.social, [field.key]: event.target.value },
                            }))
                          }
                          placeholder={field.placeholder}
                          style={inputStyle}
                        />
                      </label>
                    ))}
                  </div>
                )}

                {consent.id === 'google_place_data' && granted && (
                  <div style={{ marginTop: '0.85rem', display: 'grid', gap: '0.6rem' }}>
                    <label style={{ display: 'grid', gap: 4, fontSize: '0.66rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Google Maps profile link
                      <input
                        value={state.googleProfileUrl}
                        onChange={event => setState(current => ({ ...current, googleProfileUrl: event.target.value }))}
                        placeholder="https://maps.app.goo.gl/..."
                        style={inputStyle}
                      />
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', background: '#f8fafc', border: '1px solid #eef0f5', borderRadius: 12, padding: '0.7rem 0.85rem' }}>
                      {snapshot ? (
                        <>
                          <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>
                            {snapshot.rating != null ? snapshot.rating.toFixed(1) : '—'}
                          </strong>
                          <span style={{ color: '#D4AF37', fontSize: '0.85rem', letterSpacing: '1px' }}>
                            {'★'.repeat(Math.round(snapshot.rating || 0))}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                            {snapshot.review_count != null ? `${snapshot.review_count} reviews` : 'no review count'}
                          </span>
                          <span style={{ fontSize: '0.66rem', color: '#94a3b8', fontWeight: 700 }}>
                            synced {formatDate(snapshot.fetched_at)}
                          </span>
                          {snapshot.maps_uri && (
                            <a href={snapshot.maps_uri} target="_blank" rel="noreferrer" style={{ fontSize: '0.68rem', color: '#0f766e', fontWeight: 800 }}>
                              View on Google
                            </a>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                          {configured ? 'No Google data yet — save your Maps link, then sync.' : 'Google Places API is not configured on this deployment yet.'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={syncGoogle}
                        disabled={syncing || saving}
                        style={{ marginLeft: 'auto', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 9, padding: '0.45rem 0.85rem', fontSize: '0.7rem', fontWeight: 900, cursor: syncing ? 'wait' : 'pointer' }}
                      >
                        {syncing ? 'Syncing…' : 'Sync Google'}
                      </button>
                    </div>
                    <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                      Public data only, refreshed at most weekly. Written by Google users — SiWiFy never edits your profile.
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{ background: 'linear-gradient(135deg, #D4AF37, #f0c842)', border: 'none', color: '#1a1000', padding: '0.7rem 1.2rem', borderRadius: 12, fontWeight: 900, cursor: saving ? 'wait' : 'pointer' }}
            >
              {saving ? 'Saving…' : 'Save links & permissions'}
            </button>
            {message && (
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: message.tone === 'ok' ? '#166534' : '#b45309' }}>
                {message.text}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e2e8f0',
  background: '#fff',
  borderRadius: 10,
  padding: '0.6rem 0.75rem',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: '#0f172a',
  textTransform: 'none',
  letterSpacing: 0,
};
