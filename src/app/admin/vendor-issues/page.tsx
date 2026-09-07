'use client';

import { useEffect, useMemo, useState } from 'react';

interface VendorIssue {
  id: string;
  vendor_id: string | null;
  business_id: string | null;
  title: string;
  description: string;
  issue_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  vendor_name?: string | null;
  business_name?: string | null;
  created_at: string;
  updated_at: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  low: 'rgba(34,197,94,0.12)',
  medium: 'rgba(245,158,11,0.12)',
  high: 'rgba(239,68,68,0.12)',
  urgent: 'rgba(220,38,38,0.18)',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'rgba(99,102,241,0.12)',
  in_progress: 'rgba(59,130,246,0.12)',
  resolved: 'rgba(34,197,94,0.12)',
  closed: 'rgba(148,163,184,0.12)',
};

export default function AdminVendorIssuesPage() {
  const [issues, setIssues] = useState<VendorIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [selected, setSelected] = useState<VendorIssue | null>(null);
  const [form, setForm] = useState({
    vendorId: '',
    businessId: '',
    title: '',
    description: '',
    issueType: 'general',
    priority: 'medium',
  });

  const loadIssues = async () => {
    try {
      const res = await fetch('/api/admin/vendor-issues');
      const data = await res.json();
      setIssues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load vendor issues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const filteredIssues = useMemo(() => {
    if (filter === 'all') return issues;
    return issues.filter(issue => issue.status === filter);
  }, [issues, filter]);

  const createIssue = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/vendor-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: form.vendorId || undefined,
          businessId: form.businessId || undefined,
          title: form.title,
          description: form.description,
          issueType: form.issueType,
          priority: form.priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create issue');
      }
      setForm({ vendorId: '', businessId: '', title: '', description: '', issueType: 'general', priority: 'medium' });
      await loadIssues();
      alert('Issue created and vendor notification queued.');
    } catch (error: any) {
      alert(error.message || 'Failed to create issue');
    } finally {
      setSubmitting(false);
    }
  };

  const updateIssueStatus = async (issueId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/vendor-issues', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: issueId, status }),
      });
      if (!res.ok) throw new Error('Failed to update issue');
      await loadIssues();
    } catch (error) {
      console.error(error);
      alert('Could not update issue status.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#e2e8f0', fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800 }}>Admin Ops</div>
            <h1 style={{ margin: '0.2rem 0 0', fontSize: '2.2rem', fontWeight: 900 }}>Vendor Issues Dashboard</h1>
          </div>
          <button
            onClick={() => loadIssues()}
            style={{ background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: '12px', padding: '0.75rem 1rem', fontWeight: 800, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.5rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '1.1rem' }}>Create Vendor Issue</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input value={form.vendorId} onChange={e => setForm({ ...form, vendorId: e.target.value })} placeholder="Vendor ID (optional)" style={inputStyle} />
                <input value={form.businessId} onChange={e => setForm({ ...form, businessId: e.target.value })} placeholder="Business ID (optional)" style={inputStyle} />
              </div>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Issue title" style={inputStyle} />
              <select value={form.issueType} onChange={e => setForm({ ...form, issueType: e.target.value })} style={inputStyle}>
                <option value="general">General</option>
                <option value="listing">Listing</option>
                <option value="content">Content</option>
                <option value="verification">Verification</option>
                <option value="visibility">Visibility</option>
                <option value="compliance">Compliance</option>
              </select>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue and what the vendor should fix" rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
              <button onClick={createIssue} disabled={submitting} style={{ ...primaryButton, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Creating...' : 'Create Issue & Notify Vendor'}
              </button>
            </div>
          </div>

          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.5rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Issue Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '1rem' }}>
              <Metric label="Open" value={issues.filter(i => i.status === 'open').length} />
              <Metric label="In Progress" value={issues.filter(i => i.status === 'in_progress').length} />
              <Metric label="Resolved" value={issues.filter(i => i.status === 'resolved').length} />
              <Metric label="Closed" value={issues.filter(i => i.status === 'closed').length} />
            </div>
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>Latest issue</div>
              {issues[0] ? (
                <>
                  <div style={{ fontWeight: 700 }}>{issues[0].title}</div>
                  <div style={{ color: '#94a3b8', marginTop: '0.4rem', fontSize: '0.72rem' }}>{issues[0].vendor_name || 'Unknown vendor'} · {issues[0].status}</div>
                </>
              ) : (
                <div style={{ color: '#64748b' }}>No vendor issues yet.</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Issues Feed</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  style={{
                    background: filter === opt ? 'rgba(212,175,55,0.16)' : 'rgba(255,255,255,0.03)',
                    color: filter === opt ? '#f0c842' : '#94a3b8',
                    border: `1px solid ${filter === opt ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: '10px',
                    padding: '0.5rem 0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {opt === 'all' ? 'All' : opt.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading issues...</div>
          ) : filteredIssues.length === 0 ? (
            <div style={{ padding: '2rem', color: '#94a3b8' }}>No issues found for this filter.</div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem', padding: '1rem' }}>
              {filteredIssues.map(issue => (
                <div key={issue.id} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', padding: '1rem 1.1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{issue.title}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                        {issue.vendor_name || 'Unknown vendor'} · {issue.business_name || 'No business'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ background: PRIORITY_STYLES[issue.priority] || 'rgba(148,163,184,0.12)', color: '#f8fafc', borderRadius: '999px', padding: '0.35rem 0.6rem', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase' }}>{issue.priority}</span>
                      <span style={{ background: STATUS_STYLES[issue.status] || 'rgba(148,163,184,0.12)', color: '#f8fafc', borderRadius: '999px', padding: '0.35rem 0.6rem', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase' }}>{issue.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <p style={{ color: '#cbd5e1', margin: '0.85rem 0', lineHeight: 1.6 }}>{issue.description}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                      {issue.issue_type} · {new Date(issue.created_at).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => setSelected(issue)} style={ghostButton}>View</button>
                      {issue.status !== 'resolved' && issue.status !== 'closed' && (
                        <button onClick={() => updateIssueStatus(issue.id, 'resolved')} style={successButton}>Resolve</button>
                      )}
                      {issue.status !== 'closed' && (
                        <button onClick={() => updateIssueStatus(issue.id, 'closed')} style={dangerButton}>Close</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.72)', display: 'grid', placeItems: 'center', padding: '1rem', zIndex: 100 }} onClick={() => setSelected(null)}>
          <div style={{ width: 'min(700px, 100%)', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.5rem', color: '#e2e8f0' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{selected.title}</h3>
              <button onClick={() => setSelected(null)} style={ghostButton}>Close</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <Badge label={selected.priority} tone={selected.priority} />
              <Badge label={selected.status} tone={selected.status} />
              <Badge label={selected.issue_type} tone="neutral" />
            </div>
            <div style={{ color: '#cbd5e1', lineHeight: 1.7 }}>{selected.description}</div>
            <div style={{ color: '#94a3b8', marginTop: '1rem', fontSize: '0.72rem' }}>
              Vendor: {selected.vendor_name || 'N/A'}<br />
              Business: {selected.business_name || 'N/A'}<br />
              Created: {new Date(selected.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '1rem' }}>
      <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.4rem' }}>{value}</div>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: string }) {
  const colors: Record<string, string> = {
    low: 'rgba(34,197,94,0.12)',
    medium: 'rgba(245,158,11,0.12)',
    high: 'rgba(239,68,68,0.12)',
    urgent: 'rgba(220,38,38,0.18)',
    open: 'rgba(99,102,241,0.12)',
    in_progress: 'rgba(59,130,246,0.12)',
    resolved: 'rgba(34,197,94,0.12)',
    closed: 'rgba(148,163,184,0.12)',
    neutral: 'rgba(148,163,184,0.12)',
  };

  return (
    <span style={{ background: colors[tone] || 'rgba(148,163,184,0.12)', color: '#f8fafc', borderRadius: '999px', padding: '0.34rem 0.6rem', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase' }}>
      {label}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.8rem 0.9rem',
  borderRadius: '12px',
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(15,23,42,0.6)',
  color: '#f8fafc',
  fontSize: '0.92rem',
  outline: 'none',
};

const primaryButton: React.CSSProperties = {
  background: 'linear-gradient(135deg, #f0c842, #d4af37)',
  color: '#1f2937',
  border: 'none',
  borderRadius: '12px',
  padding: '0.85rem 1rem',
  fontWeight: 900,
  cursor: 'pointer',
};

const ghostButton: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  color: '#e2e8f0',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  padding: '0.48rem 0.8rem',
  fontWeight: 800,
  cursor: 'pointer',
};

const successButton: React.CSSProperties = {
  background: 'rgba(34,197,94,0.12)',
  color: '#a7f3d0',
  border: '1px solid rgba(34,197,94,0.22)',
  borderRadius: '10px',
  padding: '0.48rem 0.8rem',
  fontWeight: 800,
  cursor: 'pointer',
};

const dangerButton: React.CSSProperties = {
  background: 'rgba(239,68,68,0.12)',
  color: '#fca5a5',
  border: '1px solid rgba(239,68,68,0.22)',
  borderRadius: '10px',
  padding: '0.48rem 0.8rem',
  fontWeight: 800,
  cursor: 'pointer',
};
