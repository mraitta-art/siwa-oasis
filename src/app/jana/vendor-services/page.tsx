'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function VendorServicesControlPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch('/api/jana/vendor-services'), fetch('/api/jana/templates')])
      .then(async ([businessResponse, templateResponse]) => {
        const [businessData, templateData] = await Promise.all([businessResponse.json(), templateResponse.json()]);
        setBusinesses(Array.isArray(businessData) ? businessData : []);
        setTemplates(Array.isArray(templateData) ? templateData : []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function updateService(businessId: string, changes: Record<string, unknown>) {
    const response = await fetch('/api/jana/vendor-services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, ...changes }),
    });
    if (!response.ok) return;
    setBusinesses(current => current.map(business => business.id === businessId
      ? { ...business, ...changes, qr_enabled: changes.qrEnabled ?? business.qr_enabled, minisite_status: changes.minisiteStatus ?? business.minisite_status }
      : business));
  }

  async function assignTemplate(businessId: string, templateId: string) {
    const response = await fetch('/api/jana/template-governance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, templateId }),
    });
    if (!response.ok) return;
    setBusinesses(current => current.map(business => business.id === businessId ? { ...business, template_id: templateId } : business));
  }

  const filtered = businesses.filter(business => {
    const value = `${business.name || ''} ${business.vendor_name || ''} ${business.vendor_email || ''}`.toLowerCase();
    return value.includes(filter.toLowerCase());
  });

  return (
    <div style={{ maxWidth: '1250px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ color: '#22c55e', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1.5px' }}>PLANS & SERVICES</div>
        <h1 style={{ margin: '0.35rem 0', fontSize: '2rem', fontWeight: 900 }}>Vendor Services Control</h1>
        <p style={{ margin: 0, color: '#64748b' }}>One operational view for vendor plans, minisites, QR access, and service status.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Search vendor or business" style={{ minWidth: '280px', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '10px' }} />
        <Link href="/jana/tiers" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.75rem 1rem', background: '#0f172a', color: '#fff', borderRadius: '10px', fontWeight: 800, textDecoration: 'none' }}>Manage tier catalogue</Link>
      </div>

      <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
          <thead><tr style={{ background: '#f8fafc', textAlign: 'left' }}>
            {['Business / Vendor', 'Plan', 'Minisite', 'QR service', 'Section titles', 'Template', 'Actions'].map(label => <th key={label} style={{ padding: '0.9rem 1rem', color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>{label}</th>)}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading vendors...</td></tr>}
            {!loading && filtered.map(business => {
              const live = business.minisite_status === 'active' && !!(business.is_published || business.published || business.status === 'active');
              return <tr key={business.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem' }}><strong>{business.name}</strong><div style={{ color: '#64748b', fontSize: '0.75rem' }}>{business.vendor_name || business.vendor_email || 'Unassigned'}</div></td>
                <td style={{ padding: '1rem', fontWeight: 800 }}>{business.subscription_tier || 'free'}</td>
                <td style={{ padding: '1rem' }}><span style={{ color: live ? '#15803d' : '#b45309', fontWeight: 800 }}>{live ? 'Active' : 'Pending'}</span></td>
                <td style={{ padding: '1rem' }}>
                  <button onClick={() => updateService(business.id, { qrEnabled: !business.qr_enabled })} style={{ border: 0, background: 'transparent', padding: 0, color: business.qr_enabled ? '#15803d' : '#b91c1c', fontWeight: 800, cursor: 'pointer' }}>
                    {business.qr_enabled ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button onClick={() => updateService(business.id, { allowSectionLabelEdit: !business.allow_section_label_edit })} style={{ border: 0, background: 'transparent', padding: 0, color: business.allow_section_label_edit ? '#15803d' : '#64748b', fontWeight: 800, cursor: 'pointer' }}>
                    {business.allow_section_label_edit ? 'Allowed' : 'Locked'}
                  </button>
                </td>
                <td style={{ padding: '1rem' }}>
                  <select value={business.template_id || ''} onChange={event => assignTemplate(business.id, event.target.value)} style={{ maxWidth: '180px', padding: '0.35rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.72rem' }}>
                    <option value="">Use tier default</option>
                    {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
                  </select>
                </td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                  <Link href={`/jana/businesses/${business.id}/qr`} style={{ color: '#0f766e', fontWeight: 800, textDecoration: 'none' }}>QR kit</Link>
                  <button onClick={() => updateService(business.id, { minisiteStatus: live ? 'suspended' : 'active' })} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: '7px', padding: '0.35rem 0.55rem', fontSize: '0.7rem', cursor: 'pointer' }}>{live ? 'Suspend' : 'Activate'}</button>
                </td>
              </tr>;
            })}
            {!loading && filtered.length === 0 && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No vendors found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', color: '#92400e', fontSize: '0.8rem' }}>
        QR and minisite activation controls are persisted locally. Billing, add-ons, and expiry dates can use the same service-control record when payment integration is added.
      </div>
    </div>
  );
}
