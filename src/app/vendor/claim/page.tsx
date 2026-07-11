'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLang } from '@/context/LangContext';

interface UnclaimedBiz {
  id: string;
  name: string;
  slug: string;
  type_id: string;
  type_name: string;
  type_icon: string;
  type_color: string;
  parent_type_name: string;
  template_name: string | null;
  subscription_tier: string;
  isMatchingType: boolean;
  created_at: string;
}

interface ClaimData {
  vendorTypeId: string | null;
  vendorTypeName: string | null;
  myType: UnclaimedBiz[];
  others: UnclaimedBiz[];
  total: number;
}

export default function VendorClaimPage() {
  const { isRTL } = useLang();

  const [data, setData]         = useState<ClaimData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimed, setClaimed]   = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch]     = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/claim');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function claim(bizId: string, bizName: string) {
    setClaiming(bizId);
    setError(null);
    try {
      const res = await fetch('/api/vendor/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: bizId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Claim failed');
      setClaimed(bizId);
      setConfirmId(null);
      // Refresh list
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setClaiming(null);
    }
  }

  const filterBiz = (list: UnclaimedBiz[]) =>
    search
      ? list.filter(b =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.type_name.toLowerCase().includes(search.toLowerCase())
        )
      : list;

  /* ─── Shared styles ─────────────────────────────────────────── */
  const cardStyle = (isMatch: boolean): React.CSSProperties => ({
    background: '#fff',
    borderRadius: '16px',
    border: isMatch ? '2px solid #D4AF37' : '1px solid #e2e8f0',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    transition: 'box-shadow 0.15s',
    boxShadow: isMatch ? '0 4px 20px rgba(212,175,55,0.08)' : '0 2px 8px rgba(0,0,0,0.03)',
    flexDirection: isRTL ? 'row-reverse' : 'row',
  });

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <div style={{ width: 48, height: 48, border: '4px solid rgba(212,175,55,0.15)', borderTop: '4px solid #D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#D4AF37', fontWeight: 800, letterSpacing: '2px', fontSize: '0.75rem' }}>Loading available listings...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error && !data) return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
      <div style={{ color: '#ef4444', fontWeight: 700 }}>{error}</div>
      <Link href="/vendor" style={{ display: 'inline-block', marginTop: '1rem', color: '#D4AF37', textDecoration: 'none', fontWeight: 700 }}>← Back to Dashboard</Link>
    </div>
  );

  const myList     = filterBiz(data?.myType || []);
  const otherList  = filterBiz(data?.others || []);
  const totalShown = myList.length + otherList.length;

  return (
    <div style={{ fontFamily: isRTL ? "'Cairo', sans-serif" : "'Inter', system-ui, sans-serif", direction: isRTL ? 'rtl' : 'ltr', minHeight: '100vh', background: '#f8fafc' }}>

      {/* ─── Header ───────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
            🔓 Claim Your Business
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.8rem' }}>
            Select a listing to become its owner and activate your minisite
          </p>
        </div>
        <Link href="/vendor" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fas fa-arrow-left" style={{ transform: isRTL ? 'rotate(180deg)' : undefined }}></i> Dashboard
        </Link>
      </div>

      <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem' }}>

        {/* Success banner */}
        {claimed && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#166534', fontWeight: 700 }}>
            <i className="fas fa-check-circle" style={{ fontSize: '1.2rem' }}></i>
            <span>Business claimed! Your minisite is now live. Head to <Link href="/vendor/sections" style={{ color: '#166534', fontWeight: 900 }}>Studio</Link> to fill in your content.</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', color: '#991b1b', fontWeight: 700 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
          <input
            type="text"
            placeholder="Search by name or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        {totalShown === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
            <i className="fas fa-store-slash" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '1rem', display: 'block' }}></i>
            <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>No unclaimed listings available</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>All businesses are currently owned by vendors, or no listings match your search.</div>
          </div>
        )}

        {/* ─── MY TYPE SECTION ──────────────────────────────── */}
        {myList.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#fffbeb', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-star"></i>
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a' }}>Your Business Type — {data?.vendorTypeName || 'Matching'}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>These listings match your registered type — claim one to activate your minisite</div>
              </div>
              <span style={{ marginLeft: 'auto', background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 800, padding: '2px 10px' }}>{myList.length} available</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myList.map(biz => (
                <BizCard
                  key={biz.id}
                  biz={biz}
                  isConfirming={confirmId === biz.id}
                  isClaiming={claiming === biz.id}
                  onConfirm={() => setConfirmId(biz.id)}
                  onCancel={() => setConfirmId(null)}
                  onClaim={() => claim(biz.id, biz.name)}
                  cardStyle={cardStyle(true)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── OTHER TYPES SECTION ──────────────────────────── */}
        {otherList.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-globe"></i>
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a' }}>Other Listings</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>You can also claim listings from other business types</div>
              </div>
              <span style={{ marginLeft: 'auto', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 800, padding: '2px 10px' }}>{otherList.length} available</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {otherList.map(biz => (
                <BizCard
                  key={biz.id}
                  biz={biz}
                  isConfirming={confirmId === biz.id}
                  isClaiming={claiming === biz.id}
                  onConfirm={() => setConfirmId(biz.id)}
                  onCancel={() => setConfirmId(null)}
                  onClaim={() => claim(biz.id, biz.name)}
                  cardStyle={cardStyle(false)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ─── Business Card Component ────────────────────────────────── */
function BizCard({ biz, isConfirming, isClaiming, onConfirm, onCancel, onClaim, cardStyle }: {
  biz: UnclaimedBiz;
  isConfirming: boolean;
  isClaiming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onClaim: () => void;
  cardStyle: React.CSSProperties;
}) {
  return (
    <div style={cardStyle}>
      {/* Left: Business info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${biz.type_color}15`, color: biz.type_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
          <i className={biz.type_icon}></i>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{biz.name}</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px' }}>
              {biz.parent_type_name ? `${biz.parent_type_name} › ` : ''}{biz.type_name}
            </span>
            {biz.template_name && (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '6px' }}>
                <i className="fas fa-layer-group" style={{ marginRight: '3px' }}></i>{biz.template_name}
              </span>
            )}
            <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#fffbeb', color: '#92400e', padding: '2px 8px', borderRadius: '6px' }}>
              🔓 Unclaimed
            </span>
          </div>
        </div>
      </div>

      {/* Right: Claim action */}
      <div style={{ flexShrink: 0 }}>
        {!isConfirming ? (
          <button
            onClick={onConfirm}
            style={{ padding: '0.6rem 1.25rem', background: biz.isMatchingType ? '#D4AF37' : '#0f172a', color: biz.isMatchingType ? '#1a1a2e' : '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
          >
            <i className="fas fa-key"></i> Claim
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a', textAlign: 'right', maxWidth: '220px' }}>
              Claim <strong>"{biz.name}"</strong>? You will become its owner and your minisite will go live.
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={onCancel} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={onClaim}
                disabled={isClaiming}
                style={{ padding: '0.5rem 1.25rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', cursor: isClaiming ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {isClaiming ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                {isClaiming ? 'Claiming...' : 'Yes, Claim It'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
