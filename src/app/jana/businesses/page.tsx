'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DynamicForm from '@/components/DynamicForm';

interface Business {
  id: string; name: string; type_id: string; type_name: string; type_icon: string;
  type_icon_color: string; status: string; subscription_tier: string; vendor_email: string | null;
  vendor_id: string | null; approved_by_vendor: boolean; views: number;
}

export default function BusinessRegistryPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Wizard Registry State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [types, setTypes] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  
  const [newBiz, setNewBiz] = useState({
    name: '',
    type_id: '',
    subscription_tier: 'free',
    vendor_id: '',
    custom_data: {} as Record<string, any>
  });
  
  const [schemaFields, setSchemaFields] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => { 
    loadBusinesses(); 
    fetchMetadata();
  }, []);

  async function loadBusinesses() {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/businesses');
      if (res.ok) setBusinesses(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchMetadata() {
    try {
      const [tRes, sRes, vRes] = await Promise.all([
        fetch('/api/jana/types'),
        fetch('/api/jana/tiers'),
        fetch('/api/jana/vendors')
      ]);
      if (tRes.ok) setTypes(await tRes.json());
      if (sRes.ok) setTiers(await sRes.json());
      if (vRes.ok) setVendors(await vRes.json());
    } catch (e) { console.error(e); }
  }

  // Fetch sections and fields for the selected type
  async function loadTypeSchema(typeId: string) {
    setIsSyncing(true);
    setSchemaFields([]);
    try {
      // For the simplified registry, we'll fetch all 'basic' and 'location' fields
      const res = await fetch(`/api/jana/forms?type=${typeId}`);
      if (res.ok) {
        setSchemaFields(await res.json());
      }
    } catch (e) { console.error(e); }
    setIsSyncing(false);
  }

  async function deleteBiz(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    await fetch(`/api/jana/businesses?id=${id}`, { method: 'DELETE' });
    loadBusinesses();
  }

  const handleFieldChange = (name: string, value: any) => {
    setNewBiz(prev => ({
      ...prev,
      custom_data: { ...prev.custom_data, [name]: value }
    }));
  };

  async function submitRegistration() {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/jana/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBiz),
      });
      if (res.ok) {
        setShowWizard(false);
        setWizardStep(1);
        setNewBiz({ name: '', type_id: '', subscription_tier: 'free', vendor_id: '', custom_data: {} });
        await loadBusinesses();
      }
    } catch (e) { console.error(e); }
    setIsSyncing(false);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37' }}></i></div>;

  return (
    <div className="animate-in">
      <div className="card-header">
        <div>
          <h3 style={{ marginBottom: '0.25rem' }}><i className="fas fa-building"></i> Business Registry</h3>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>Register and manage governed business entities.</p>
        </div>
        <Link href="/jana/forms" className="btn btn-primary">
          <i className="fas fa-plus"></i> ONBOARD BUSINESS
        </Link>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Business Entity</th>
              <th>Typology</th>
              <th>Status / Tier</th>
              <th>Vendor Link</th>
              <th>Analytics</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map(b => (
              <tr key={b.id}>
                <td>
                  <div style={{ fontWeight: 800 }}>{b.name}</div>
                  <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>ID: {b.id.slice(0, 8)}...</div>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className={b.type_icon} style={{ color: b.type_icon_color }}></i>
                    {b.type_name}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className={`badge badge-${b.status === 'active' ? 'success' : 'warning'}`}>{b.status.toUpperCase()}</span>
                    <span className="subscription-badge">{b.subscription_tier.toUpperCase()}</span>
                  </div>
                </td>
                <td>
                  {b.vendor_email ? (
                    <div style={{ fontSize: '0.8rem' }}>
                      <i className="fas fa-user-circle" style={{ color: '#6b7280' }}></i> {b.vendor_email}
                      {!b.approved_by_vendor && <span className="badge badge-warning" style={{ fontSize: '0.6rem', display: 'block', width: 'fit-content', marginTop: '0.2rem' }}>PENDING VENDOR</span>}
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Managed by System</span>
                  )}
                </td>
                <td>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{b.views.toLocaleString()} <span style={{ color: '#9ca3af', fontWeight: 400 }}>views</span></div>
                </td>
                <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                       <button className="btn btn-xs btn-outline" style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }} title="Manage Tier & Vendor" onClick={() => {
                          const newTier = prompt('Enter new Tier ID (e.g., free, pro, premium):', b.subscription_tier);
                          if (newTier && newTier !== b.subscription_tier) {
                            fetch('/api/jana/businesses', { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: b.id, subscription_tier: newTier })})
                            .then(() => loadBusinesses());
                          }
                       }}>
                         <i className="fas fa-crown"></i> MANAGE TIER
                       </button>
                       <Link href={`/jana/curation/${b.id}`} className="btn btn-xs btn-outline gold-border" title="Curate Content">
                         <i className="fas fa-magic"></i> CURATE
                       </Link>
                       <Link href={`/jana/businesses/${b.id}/edit`} className="btn btn-xs btn-outline" title="Edit Business DNA">
                         <i className="fas fa-dna"></i> EDIT DNA
                       </Link>
                       <button className="btn btn-xs btn-outline" style={{ color: '#ef4444' }} onClick={() => deleteBiz(b.id, b.name)}><i className="fas fa-trash"></i></button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
