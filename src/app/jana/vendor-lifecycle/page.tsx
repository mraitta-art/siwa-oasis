'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
type TabKey = 'pending' | 'approved' | 'suspended' | 'archived' | 'removed';

interface Vendor {
  user_id: string;
  display_name: string;
  email: string;
  phone: string | null;
  approval_status: TabKey;
  active: number;
  registered_at: string;
  business_id: string | null;
  business_name: string | null;
  business_slug: string | null;
  business_type: string | null;
  business_category: string | null;
  business_status: string | null;
  last_message_subject: string | null;
  last_message_at: string | null;
  last_action_trigger: string | null;
}

interface Counts {
  pending: number;
  approved: number;
  suspended: number;
  archived: number;
  removed: number;
}

interface Template {
  subject: string;
  body: string;
}

interface Templates {
  [key: string]: Template;
}

interface MessageModalState {
  open: boolean;
  vendor: Vendor | null;
  action: string;
  subject: string;
  body: string;
  customizing: boolean;
}

interface InlineAction {
  vendorId: string;
  action: string;
  reason: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const TABS: { key: TabKey; label: string; emoji: string; color: string }[] = [
  { key: 'pending',   label: 'Pending',   emoji: '🔵', color: '#f59e0b' },
  { key: 'approved',  label: 'Approved',  emoji: '🟢', color: '#22c55e' },
  { key: 'suspended', label: 'Suspended', emoji: '🟡', color: '#f97316' },
  { key: 'archived',  label: 'Archived',  emoji: '⚫', color: '#6b7280' },
  { key: 'removed',   label: 'Removed',   emoji: '🔴', color: '#ef4444' },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   '#f59e0b',
  approved:  '#22c55e',
  suspended: '#f97316',
  archived:  '#6b7280',
  removed:   '#ef4444',
};

const TEMPLATE_KEYS = ['welcome', 'rejection', 'suspension', 'archive', 'restoration', 'removal', 'generic'];

const TEMPLATE_LABELS: Record<string, string> = {
  welcome:    '✅ Welcome (on approve)',
  rejection:  '❌ Rejection (on reject)',
  suspension: '🚫 Suspension (on suspend)',
  archive:    '📦 Archive (on archive)',
  restoration:'♻️ Restoration (on restore)',
  removal:    '🗑️ Removal (on remove)',
  generic:    '✉️ Generic (manual message)',
};

function buildMinisiteUrl(slug: string): string {
  return `https://siwify.com/biz/${slug}`;
}

function interpolatePreview(text: string, vendor: Vendor): string {
  const name = vendor.display_name || vendor.email || 'Vendor';
  const bizName = vendor.business_name || 'Your Business';
  const slug = vendor.business_slug ? buildMinisiteUrl(vendor.business_slug) : 'https://siwify.com';
  return text
    .replace(/\{vendor_name\}/g, name)
    .replace(/\{business_name\}/g, bizName)
    .replace(/\{minisite_url\}/g, slug)
    .replace(/\{reason\}/g, '—')
    .replace(/\{message\}/g, '—');
}

function formatDate(dt: string | null): string {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dt;
  }
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function VendorLifecyclePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, suspended: 0, archived: 0, removed: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Message modal
  const [modal, setModal] = useState<MessageModalState>({
    open: false, vendor: null, action: '', subject: '', body: '', customizing: false,
  });
  const [modalSending, setModalSending] = useState(false);

  // Templates drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [templates, setTemplates] = useState<Templates>({});
  const [templateEdits, setTemplateEdits] = useState<Templates>({});
  const [templatesSaving, setTemplatesSaving] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  // Inline reason state
  const [inlineAction, setInlineAction] = useState<InlineAction | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch vendors ──────────────────────────────────────────────────────────
  const fetchVendors = useCallback(async (tab: TabKey, s: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ tab, page: String(p) });
      if (s) params.set('search', s);
      const res = await fetch(`/api/jana/vendor-lifecycle?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVendors(data.vendors || []);
      setCounts(data.counts || { pending: 0, approved: 0, suspended: 0, archived: 0, removed: 0 });
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors(activeTab, search, page);
  }, [activeTab, search, page, fetchVendors]);

  // ── Fetch templates ────────────────────────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    if (templatesLoaded) return;
    try {
      const res = await fetch('/api/jana/vendor-lifecycle?setting=message_templates');
      if (!res.ok) throw new Error('Failed to load templates');
      const data = await res.json();
      setTemplates(data.templates || {});
      setTemplateEdits(JSON.parse(JSON.stringify(data.templates || {})));
      setTemplatesLoaded(true);
    } catch (e: any) {
      setError(e.message);
    }
  }, [templatesLoaded]);

  useEffect(() => {
    if (drawerOpen) fetchTemplates();
  }, [drawerOpen, fetchTemplates]);

  // ── Search debounce ────────────────────────────────────────────────────────
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  // ── Tab change ─────────────────────────────────────────────────────────────
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setPage(1);
    setInlineAction(null);
  };

  // ── Success flash ──────────────────────────────────────────────────────────
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ── Perform action (with message modal) ───────────────────────────────────
  const openMessageModal = async (vendor: Vendor, action: string, prefillReason?: string) => {
    // Get templates if not yet loaded
    let tmpl = templates;
    if (!templatesLoaded) {
      try {
        const res = await fetch('/api/jana/vendor-lifecycle?setting=message_templates');
        const data = await res.json();
        tmpl = data.templates || {};
        setTemplates(tmpl);
        setTemplateEdits(JSON.parse(JSON.stringify(tmpl)));
        setTemplatesLoaded(true);
      } catch {
        tmpl = {};
      }
    }

    const keyMap: Record<string, string> = {
      approve: 'welcome', reject: 'rejection', suspend: 'suspension',
      archive: 'archive', restore: 'restoration', remove: 'removal', send_message: 'generic',
    };
    const key = keyMap[action] || 'generic';
    const tpl = tmpl[key] || { subject: 'Message from SiWiFy.com', body: '' };

    // Pre-fill reason if provided
    let body = tpl.body;
    if (prefillReason) {
      body = body.replace(/\{reason\}/g, prefillReason);
    }

    setModal({ open: true, vendor, action, subject: tpl.subject, body, customizing: false });
  };

  const closeModal = () => {
    setModal({ open: false, vendor: null, action: '', subject: '', body: '', customizing: false });
  };

  const sendModalMessage = async () => {
    if (!modal.vendor) return;
    setModalSending(true);
    try {
      const res = await fetch('/api/jana/vendor-lifecycle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: modal.vendor.user_id,
          action: modal.action,
          customMessage: modal.body,
          subject: modal.subject,
          reason: inlineAction?.reason || '',
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      closeModal();
      setInlineAction(null);
      showSuccess(`Action "${modal.action}" completed for ${modal.vendor.display_name || modal.vendor.email}`);
      fetchVendors(activeTab, search, page);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setModalSending(false);
    }
  };

  // ── Quick action (no message modal for restore) ────────────────────────────
  const performAction = async (vendor: Vendor, action: string, reason?: string) => {
    // Actions that require message confirmation modal
    const modalActions = ['approve', 'reject', 'suspend', 'archive', 'restore', 'remove', 'send_message'];
    if (modalActions.includes(action)) {
      await openMessageModal(vendor, action, reason);
      return;
    }
  };

  // ── Inline reason actions ──────────────────────────────────────────────────
  const startInlineAction = (vendor: Vendor, action: string) => {
    setInlineAction({ vendorId: vendor.user_id, action, reason: '' });
  };

  const confirmInlineAction = async (vendor: Vendor) => {
    if (!inlineAction) return;
    await openMessageModal(vendor, inlineAction.action, inlineAction.reason);
  };

  // ── Setup DB ───────────────────────────────────────────────────────────────
  const handleSetupDB = async () => {
    setActionLoading('setup');
    try {
      const res = await fetch('/api/jana/vendor-lifecycle/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showSuccess('✅ Database tables set up successfully: ' + data.results.join(' | '));
      } else {
        setError('Setup partially failed: ' + data.results.join(' | '));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Save templates ─────────────────────────────────────────────────────────
  const saveTemplates = async () => {
    setTemplatesSaving(true);
    try {
      const res = await fetch('/api/jana/vendor-lifecycle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateTemplates: true, templates: templateEdits }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setTemplates(JSON.parse(JSON.stringify(templateEdits)));
      showSuccess('✅ Message templates saved successfully!');
      setDrawerOpen(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTemplatesSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        padding: '32px 32px 28px',
        color: '#fff',
      }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
          🏪 Vendor Lifecycle Manager
        </h1>
        <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '15px' }}>
          Manage vendor registration, approval, suspension, and messaging — all in one place.
        </p>
      </div>

      {/* ── Action Bar ── */}
      <div style={{ padding: '20px 32px 0', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff',
            fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          ⚙️ Message Templates
        </button>
        <button
          onClick={handleSetupDB}
          disabled={actionLoading === 'setup'}
          style={{
            padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff',
            fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
            opacity: actionLoading === 'setup' ? 0.7 : 1,
          }}
        >
          {actionLoading === 'setup' ? '⏳ Setting up...' : '🛠️ Setup DB'}
        </button>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="🔍 Search by name, email, phone, business…"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: '10px',
              border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
              background: '#fff', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ── Success / Error banners ── */}
      {successMsg && (
        <div style={{
          margin: '16px 32px 0', padding: '12px 16px', borderRadius: '10px',
          background: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontSize: '14px',
        }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{
          margin: '16px 32px 0', padding: '12px 16px', borderRadius: '10px',
          background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontSize: '14px',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* ── Status Tabs ── */}
      <div style={{ padding: '20px 32px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: '10px 18px', borderRadius: '24px', border: 'none', cursor: 'pointer',
                background: isActive ? tab.color : '#fff',
                color: isActive ? '#fff' : '#475569',
                fontWeight: isActive ? 700 : 500,
                fontSize: '14px',
                boxShadow: isActive ? `0 4px 12px ${tab.color}44` : '0 1px 4px rgba(0,0,0,0.08)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              {tab.emoji} {tab.label}
              <span style={{
                background: isActive ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                color: isActive ? '#fff' : '#334155',
                borderRadius: '12px', padding: '1px 8px', fontSize: '12px', fontWeight: 700,
              }}>
                {counts[tab.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Vendor Cards Grid ── */}
      <div style={{ padding: '24px 32px 48px' }}>
        {loading ? (
          <LoadingGrid />
        ) : vendors.length === 0 ? (
          <EmptyState tab={activeTab} search={search} />
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '20px',
            }}>
              {vendors.map((vendor) => (
                <VendorCard
                  key={vendor.user_id}
                  vendor={vendor}
                  tab={activeTab}
                  inlineAction={inlineAction?.vendorId === vendor.user_id ? inlineAction : null}
                  onAction={performAction}
                  onStartInline={startInlineAction}
                  onCancelInline={() => setInlineAction(null)}
                  onConfirmInline={confirmInlineAction}
                  onInlineReasonChange={(reason) =>
                    setInlineAction((prev) => prev ? { ...prev, reason } : null)
                  }
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={paginationBtnStyle(page <= 1)}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      ...paginationBtnStyle(false),
                      background: p === page ? '#1e293b' : '#fff',
                      color: p === page ? '#fff' : '#334155',
                      fontWeight: p === page ? 700 : 500,
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={paginationBtnStyle(page >= totalPages)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Message Modal ── */}
      {modal.open && modal.vendor && (
        <MessageModal
          modal={modal}
          vendor={modal.vendor}
          sending={modalSending}
          onClose={closeModal}
          onSend={sendModalMessage}
          onSubjectChange={(s) => setModal((m) => ({ ...m, subject: s }))}
          onBodyChange={(b) => setModal((m) => ({ ...m, body: b }))}
        />
      )}

      {/* ── Templates Drawer ── */}
      {drawerOpen && (
        <TemplatesDrawer
          edits={templateEdits}
          saving={templatesSaving}
          onClose={() => setDrawerOpen(false)}
          onSave={saveTemplates}
          onChange={(key, field, val) =>
            setTemplateEdits((prev) => ({
              ...prev,
              [key]: { ...(prev[key] || { subject: '', body: '' }), [field]: val },
            }))
          }
        />
      )}
    </div>
  );
}

// ── Vendor Card ──────────────────────────────────────────────────────────────
function VendorCard({
  vendor,
  tab,
  inlineAction,
  onAction,
  onStartInline,
  onCancelInline,
  onConfirmInline,
  onInlineReasonChange,
}: {
  vendor: Vendor;
  tab: TabKey;
  inlineAction: InlineAction | null;
  onAction: (v: Vendor, a: string, r?: string) => void;
  onStartInline: (v: Vendor, a: string) => void;
  onCancelInline: () => void;
  onConfirmInline: (v: Vendor) => void;
  onInlineReasonChange: (r: string) => void;
}) {
  const statusColor = STATUS_COLORS[vendor.approval_status] || '#94a3b8';

  return (
    <div style={{
      background: '#fff', borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      overflow: 'hidden', transition: 'box-shadow 0.2s',
    }}>
      {/* Card header stripe */}
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${statusColor}, ${statusColor}88)` }} />

      <div style={{ padding: '20px' }}>
        {/* Vendor info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                {vendor.display_name || '(No name)'}
              </h3>
              <span style={{
                padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                background: `${statusColor}22`, color: statusColor, textTransform: 'uppercase',
              }}>
                {vendor.approval_status}
              </span>
            </div>
            <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{vendor.email}</div>
            {vendor.phone && (
              <div style={{ color: '#64748b', fontSize: '13px' }}>📞 {vendor.phone}</div>
            )}
          </div>
          <div style={{ textAlign: 'right', color: '#94a3b8', fontSize: '12px' }}>
            <div>Joined</div>
            <div style={{ fontWeight: 600, color: '#475569' }}>{formatDate(vendor.registered_at)}</div>
          </div>
        </div>

        {/* Business info */}
        {vendor.business_name ? (
          <div style={{
            background: '#f8fafc', borderRadius: '10px', padding: '12px',
            marginBottom: '14px', border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>
                  🏢 {vendor.business_name}
                </div>
                {vendor.business_slug && (
                  <a
                    href={buildMinisiteUrl(vendor.business_slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#6366f1', fontSize: '12px', textDecoration: 'none' }}
                  >
                    /biz/{vendor.business_slug} ↗
                  </a>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                {vendor.business_type && (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{vendor.business_type}</div>
                )}
                {vendor.business_category && (
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{vendor.business_category}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#fff7ed', borderRadius: '10px', padding: '10px 12px',
            marginBottom: '14px', border: '1px solid #fed7aa', fontSize: '13px', color: '#92400e',
          }}>
            ⚠️ No business linked
          </div>
        )}

        {/* Last message */}
        {vendor.last_message_subject && (
          <div style={{
            fontSize: '12px', color: '#64748b', marginBottom: '14px',
            display: 'flex', gap: '6px', alignItems: 'center',
          }}>
            <span>✉️</span>
            <span style={{ flex: 1 }}>
              <span style={{ fontWeight: 600 }}>{vendor.last_message_subject}</span>
              {vendor.last_message_at && <span style={{ marginLeft: '6px' }}>· {formatDate(vendor.last_message_at)}</span>}
            </span>
          </div>
        )}

        {/* Inline reason input */}
        {inlineAction && (
          <div style={{ marginBottom: '12px' }}>
            <textarea
              placeholder={`Reason for ${inlineAction.action}… (optional)`}
              value={inlineAction.reason}
              onChange={(e) => onInlineReasonChange(e.target.value)}
              rows={2}
              style={{
                width: '100%', padding: '10px', borderRadius: '8px',
                border: '1px solid #e2e8f0', fontSize: '13px', resize: 'vertical',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={() => onConfirmInline(vendor)}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                  background: '#1e293b', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                }}
              >
                Continue →
              </button>
              <button
                onClick={onCancelInline}
                style={{
                  padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '13px',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!inlineAction && (
          <ActionButtons vendor={vendor} tab={tab} onAction={onAction} onStartInline={onStartInline} />
        )}
      </div>
    </div>
  );
}

// ── Action Buttons ───────────────────────────────────────────────────────────
function ActionButtons({
  vendor, tab, onAction, onStartInline,
}: {
  vendor: Vendor;
  tab: TabKey;
  onAction: (v: Vendor, a: string, r?: string) => void;
  onStartInline: (v: Vendor, a: string) => void;
}) {
  const btnBase: React.CSSProperties = {
    padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
    transition: 'opacity 0.15s',
  };

  const btn = (label: string, bg: string, onClick: () => void): React.ReactElement => (
    <button key={label} onClick={onClick} style={{ ...btnBase, background: bg, color: '#fff' }}>
      {label}
    </button>
  );

  const buttons: React.ReactElement[] = [];

  if (tab === 'pending') {
    buttons.push(btn('✅ Approve', 'linear-gradient(135deg,#22c55e,#16a34a)', () => onAction(vendor, 'approve')));
    buttons.push(btn('❌ Reject', 'linear-gradient(135deg,#ef4444,#dc2626)', () => onStartInline(vendor, 'reject')));
  }

  if (tab === 'approved') {
    buttons.push(btn('🚫 Suspend', 'linear-gradient(135deg,#f97316,#ea580c)', () => onStartInline(vendor, 'suspend')));
    buttons.push(btn('📦 Archive', 'linear-gradient(135deg,#6b7280,#4b5563)', () => onAction(vendor, 'archive')));
    buttons.push(btn('🗑️ Remove', 'linear-gradient(135deg,#ef4444,#dc2626)', () => onAction(vendor, 'remove')));
    buttons.push(btn('✉️ Message', 'linear-gradient(135deg,#6366f1,#4f46e5)', () => onAction(vendor, 'send_message')));
  }

  if (tab === 'suspended') {
    buttons.push(btn('✅ Restore', 'linear-gradient(135deg,#22c55e,#16a34a)', () => onAction(vendor, 'restore')));
    buttons.push(btn('📦 Archive', 'linear-gradient(135deg,#6b7280,#4b5563)', () => onAction(vendor, 'archive')));
    buttons.push(btn('🗑️ Remove', 'linear-gradient(135deg,#ef4444,#dc2626)', () => onAction(vendor, 'remove')));
    buttons.push(btn('✉️ Message', 'linear-gradient(135deg,#6366f1,#4f46e5)', () => onAction(vendor, 'send_message')));
  }

  if (tab === 'archived') {
    buttons.push(btn('✅ Restore', 'linear-gradient(135deg,#22c55e,#16a34a)', () => onAction(vendor, 'restore')));
    buttons.push(btn('🗑️ Remove', 'linear-gradient(135deg,#ef4444,#dc2626)', () => onAction(vendor, 'remove')));
    buttons.push(btn('✉️ Message', 'linear-gradient(135deg,#6366f1,#4f46e5)', () => onAction(vendor, 'send_message')));
  }

  if (tab === 'removed') {
    buttons.push(btn('✅ Restore', 'linear-gradient(135deg,#22c55e,#16a34a)', () => onAction(vendor, 'restore')));
  }

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {buttons}
    </div>
  );
}

// ── Message Modal ────────────────────────────────────────────────────────────
function MessageModal({
  modal, vendor, sending, onClose, onSend, onSubjectChange, onBodyChange,
}: {
  modal: MessageModalState;
  vendor: Vendor;
  sending: boolean;
  onClose: () => void;
  onSend: () => void;
  onSubjectChange: (s: string) => void;
  onBodyChange: (b: string) => void;
}) {
  const preview = interpolatePreview(modal.body, vendor);
  const actionLabels: Record<string, string> = {
    approve: '✅ Approve & Send Welcome',
    reject: '❌ Reject & Notify',
    suspend: '🚫 Suspend & Notify',
    archive: '📦 Archive & Notify',
    restore: '♻️ Restore & Notify',
    remove: '🗑️ Remove & Notify',
    send_message: '✉️ Send Message',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '680px',
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Modal header */}
        <div style={{
          padding: '24px 28px 16px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
              {actionLabels[modal.action] || '✉️ Send Message'}
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
              To: <strong>{vendor.display_name || vendor.email}</strong>
              {vendor.business_name && ` · ${vendor.business_name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: '8px',
              width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px 28px 28px' }}>
          {/* Subject */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Subject
            </label>
            <input
              type="text"
              value={modal.subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>

          {/* Body */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Message Body
              <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '8px' }}>
                (variables: {'{vendor_name}'}, {'{business_name}'}, {'{minisite_url}'})
              </span>
            </label>
            <textarea
              value={modal.body}
              onChange={(e) => onBodyChange(e.target.value)}
              rows={8}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '8px',
                border: '1px solid #e2e8f0', fontSize: '14px', resize: 'vertical',
                boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', lineHeight: 1.6,
              }}
            />
          </div>

          {/* Preview */}
          <div style={{
            background: '#f8fafc', borderRadius: '10px', padding: '16px',
            border: '1px solid #e2e8f0', marginBottom: '20px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Preview (variables resolved)
            </div>
            <div style={{ fontSize: '13px', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.7, direction: 'rtl', textAlign: 'right' }}>
              {preview}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 20px', borderRadius: '10px', border: '1px solid #e2e8f0',
                background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              disabled={sending}
              style={{
                padding: '12px 24px', borderRadius: '10px', border: 'none',
                background: sending ? '#94a3b8' : 'linear-gradient(135deg,#1e293b,#334155)',
                color: '#fff', cursor: sending ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 700,
              }}
            >
              {sending ? '⏳ Sending…' : (actionLabels[modal.action] || '✉️ Send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Templates Drawer ─────────────────────────────────────────────────────────
function TemplatesDrawer({
  edits, saving, onClose, onSave, onChange,
}: {
  edits: Templates;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (key: string, field: 'subject' | 'body', val: string) => void;
}) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.4)' }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 901,
        width: '560px', maxWidth: '95vw',
        background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Drawer header */}
        <div style={{
          padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg,#0f172a,#1e293b)',
          color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>⚙️ Message Templates</h2>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '13px' }}>
              Edit the default messages sent for each lifecycle action.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
              width: '36px', height: '36px', cursor: 'pointer', color: '#fff', fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {TEMPLATE_KEYS.map((key) => (
            <div key={key} style={{ marginBottom: '32px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b', marginBottom: '10px' }}>
                {TEMPLATE_LABELS[key] || key}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={edits[key]?.subject || ''}
                  onChange={(e) => onChange(key, 'subject', e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                  Body
                </label>
                <textarea
                  value={edits[key]?.body || ''}
                  onChange={(e) => onChange(key, 'body', e.target.value)}
                  rows={5}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', fontSize: '13px', resize: 'vertical',
                    boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6,
                    direction: 'rtl', textAlign: 'right', outline: 'none',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid #f1f5f9',
          display: 'flex', gap: '12px', justifyContent: 'flex-end',
          background: '#f8fafc',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '11px 20px', borderRadius: '10px', border: '1px solid #e2e8f0',
              background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              padding: '11px 24px', borderRadius: '10px', border: 'none',
              background: saving ? '#94a3b8' : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: 700,
            }}
          >
            {saving ? '⏳ Saving…' : '💾 Save All Templates'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Loading Grid ─────────────────────────────────────────────────────────────
function LoadingGrid() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px',
    }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} style={{
          background: '#fff', borderRadius: '16px', height: '220px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <div style={{ height: '4px', background: '#e2e8f0' }} />
          <div style={{ padding: '20px' }}>
            <div style={{ height: '20px', background: '#f1f5f9', borderRadius: '6px', marginBottom: '10px', width: '60%' }} />
            <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '6px', marginBottom: '8px', width: '40%' }} />
            <div style={{ height: '60px', background: '#f8fafc', borderRadius: '10px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ height: '34px', background: '#f1f5f9', borderRadius: '8px', flex: 1 }} />
              <div style={{ height: '34px', background: '#f1f5f9', borderRadius: '8px', flex: 1 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ tab, search }: { tab: TabKey; search: string }) {
  const messages: Record<TabKey, string> = {
    pending: 'No pending vendors',
    approved: 'No approved vendors',
    suspended: 'No suspended vendors',
    archived: 'No archived vendors',
    removed: 'No removed vendors',
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '80px 32px', color: '#94a3b8',
    }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏪</div>
      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#475569' }}>
        {search ? `No results for "${search}"` : messages[tab]}
      </h3>
      <p style={{ margin: '8px 0 0', fontSize: '15px' }}>
        {search ? 'Try a different search term.' : `Vendors with ${tab} status will appear here.`}
      </p>
    </div>
  );
}

// ── Pagination button style ───────────────────────────────────────────────────
function paginationBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
    background: '#fff', color: disabled ? '#cbd5e1' : '#334155',
    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 500,
  };
}
