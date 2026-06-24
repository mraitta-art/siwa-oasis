'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DynamicForm from '@/components/DynamicForm';
import { useAdmin } from '@/context/AdminContext';

interface PendingBusiness {
  id: string;
  business_name: string;
  business_type: string;
  type_name: string;
  email: string;
  phone: string;
  description: string;
  status: 'pending' | 'active' | 'inactive' | 'hidden';
  created_at: string;
  custom_data: any;
  is_standalone: boolean;
  template_id: string;
  subscription_tier: string;
}

export default function BusinessFormsPage() {
  const { notify } = useAdmin();
  const [activeTab, setActiveTab] = useState<'queue' | 'new_form'>('queue');
  const [loading, setLoading] = useState(true);
  
  // Intake queue state
  const [pendingBizs, setPendingBizs] = useState<PendingBusiness[]>([]);
  const [reviewBiz, setReviewBiz] = useState<PendingBusiness | null>(null);
  const [reviewFields, setReviewFields] = useState<any[]>([]);
  const [reviewSections, setReviewSections] = useState<any[]>([]);
  const [reviewActiveTab, setReviewActiveTab] = useState<string>('');
  const [isReviewSaving, setIsReviewSaving] = useState(false);

  // New onboarding form state
  const [step, setStep] = useState<1 | 2>(1);
  const [types, setTypes] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [newBiz, setNewBiz] = useState({
    name: '',
    type_id: '',
    email: '',
    phone: '',
    description: '',
    custom_data: {} as Record<string, any>
  });
  const [newBizFields, setNewBizFields] = useState<any[]>([]);
  const [newBizSections, setNewBizSections] = useState<any[]>([]);
  const [newBizActiveTab, setNewBizActiveTab] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMetadata();
    loadPendingQueue();
  }, []);

  async function fetchMetadata() {
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/jana/types'),
        fetch('/api/jana/sections')
      ]);
      if (tRes.ok) setTypes(await tRes.json());
      if (sRes.ok) setSections(await sRes.json());
    } catch (e) {
      console.error('Error fetching metadata:', e);
    }
  }

  async function loadPendingQueue() {
    setLoading(true);
    try {
      const res = await fetch('/api/business-forms?status=pending');
      if (res.ok) {
        setPendingBizs(await res.json());
      }
    } catch (e) {
      console.error('Error loading pending queue:', e);
      notify('Failed to load pending queue', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Triggered when admin changes type during creation wizard
  async function handleTypeChange(typeId: string) {
    setNewBiz(prev => ({ ...prev, type_id: typeId, custom_data: {} }));
    if (!typeId) {
      setNewBizFields([]);
      setNewBizSections([]);
      setNewBizActiveTab('');
      return;
    }

    try {
      const res = await fetch(`/api/jana/forms?type=${typeId}`);
      if (res.ok) {
        const schema = await res.json();
        setNewBizFields(schema);
        
        // Find unique sections in schema
        const uniqueSectionIds = Array.from(new Set(schema.map((f: any) => f.section_id)));
        const filteredSections = sections.filter((s: any) => uniqueSectionIds.includes(s.id));
        setNewBizSections(filteredSections);
        if (filteredSections.length > 0) {
          setNewBizActiveTab(filteredSections[0].id);
        }
      }
    } catch (e) {
      console.error('Error loading schema for type:', e);
    }
  }

  // Handle dynamic form data edits for onboarding wizard
  const handleNewBizDataChange = (sectionId: string, name: string, value: any) => {
    setNewBiz(prev => {
      const nextCustom = { ...prev.custom_data };
      if (!nextCustom[sectionId]) nextCustom[sectionId] = {};
      nextCustom[sectionId][name] = value;
      return { ...prev, custom_data: nextCustom };
    });
  };

  // Submit new registration from wizard
  async function handleSubmitRegistration() {
    if (!newBiz.name.trim() || !newBiz.type_id) {
      alert('Please fill out Business Name and Typology');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/business-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: newBiz.name,
          business_type: newBiz.type_id,
          email: newBiz.email,
          phone: newBiz.phone,
          description: newBiz.description,
          custom_data: newBiz.custom_data
        })
      });

      if (res.ok) {
        notify('🎉 Registration submitted to intake queue!', 'success');
        // Reset form
        setNewBiz({
          name: '',
          type_id: '',
          email: '',
          phone: '',
          description: '',
          custom_data: {}
        });
        setNewBizFields([]);
        setNewBizSections([]);
        setNewBizActiveTab('');
        setStep(1);
        setActiveTab('queue');
        loadPendingQueue();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit registration');
      }
    } catch (e) {
      console.error(e);
      notify('Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // Start reviewing a pending submission
  async function handleStartReview(biz: PendingBusiness) {
    setReviewBiz(biz);
    setReviewFields([]);
    setReviewSections([]);
    setReviewActiveTab('');

    try {
      const res = await fetch(`/api/jana/forms?type=${biz.business_type}`);
      if (res.ok) {
        const schema = await res.json();
        setReviewFields(schema);
        
        const uniqueSectionIds = Array.from(new Set(schema.map((f: any) => f.section_id)));
        const filteredSections = sections.filter((s: any) => uniqueSectionIds.includes(s.id));
        setReviewSections(filteredSections);
        if (filteredSections.length > 0) {
          setReviewActiveTab(filteredSections[0].id);
        }
      }
    } catch (e) {
      console.error('Error loading review schema:', e);
    }
  }

  // Handle dynamic form data edits during admin review
  const handleReviewDataChange = (sectionId: string, name: string, value: any) => {
    if (!reviewBiz) return;
    setReviewBiz(prev => {
      if (!prev) return null;
      const nextCustom = { ...prev.custom_data || {} };
      if (!nextCustom[sectionId]) nextCustom[sectionId] = {};
      nextCustom[sectionId][name] = value;
      return { ...prev, custom_data: nextCustom };
    });
  };

  // Save reviewed details as draft (still pending)
  async function handleSaveReviewDraft() {
    if (!reviewBiz) return;
    setIsReviewSaving(true);
    try {
      const res = await fetch('/api/business-forms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reviewBiz.id,
          status: 'pending',
          custom_data: reviewBiz.custom_data
        })
      });

      if (res.ok) {
        notify('Review draft saved successfully', 'success');
        loadPendingQueue();
      } else {
        notify('Failed to save review draft', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReviewSaving(false);
    }
  }

  // Approve and activate business (makes it live!)
  async function handleApproveBusiness(bizId: string) {
    if (!confirm('Approve and activate this business? It will immediately go live on the platform.')) return;
    
    // If reviewing the business currently, use the updated reviewBiz custom_data
    const targetCustomData = reviewBiz && reviewBiz.id === bizId ? reviewBiz.custom_data : undefined;
    
    try {
      const res = await fetch('/api/business-forms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bizId,
          status: 'active',
          custom_data: targetCustomData
        })
      });

      if (res.ok) {
        notify('✨ Business Approved & Activated!', 'success');
        setReviewBiz(null);
        loadPendingQueue();
      } else {
        notify('Approval failed', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Reject business submission (marks as inactive)
  async function handleRejectBusiness(bizId: string) {
    if (!confirm('Reject this business registration? This will mark it as inactive.')) return;

    try {
      const res = await fetch('/api/business-forms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bizId,
          status: 'inactive'
        })
      });

      if (res.ok) {
        notify('Registration rejected & archived', 'warning');
        setReviewBiz(null);
        loadPendingQueue();
      } else {
        notify('Rejection failed', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Delete submission
  async function handleDeleteSubmission(bizId: string, name: string) {
    if (!confirm(`Delete submission "${name}" completely? This action is irreversible.`)) return;

    try {
      const res = await fetch('/api/business-forms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bizId })
      });

      if (res.ok) {
        notify('Submission deleted successfully', 'success');
        if (reviewBiz?.id === bizId) setReviewBiz(null);
        loadPendingQueue();
      } else {
        notify('Failed to delete submission', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.5px' }}>
            <i className="fas fa-file-signature" style={{ color: '#D4AF37' }}></i>
            Business Forms
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0.3rem 0 0 0', fontWeight: 500 }}>
            Unified intake portal and approval pipeline for Siwa Oasis registered entities.
          </p>
        </div>

        {/* View Switcher Toggles */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.3rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => { setActiveTab('queue'); setReviewBiz(null); }}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'queue' ? '#fff' : 'transparent',
              color: activeTab === 'queue' ? '#1e293b' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'queue' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <i className="fas fa-list-check" style={{ marginRight: '0.5rem' }}></i>
            Pending Intake ({pendingBizs.length})
          </button>
          <button
            onClick={() => { setActiveTab('new_form'); setReviewBiz(null); }}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'new_form' ? '#fff' : 'transparent',
              color: activeTab === 'new_form' ? '#1e293b' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'new_form' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
            New Registration
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: reviewBiz ? '1fr 600px' : '1fr', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: ACTIVE VIEW (Intake Queue or New Form) */}
        <div>
          {activeTab === 'queue' && (
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', background: '#fcfcfd' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>📥 Intake Pipeline Submissions</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  Register requests submitted by vendors or system admins. Promote them to the registry by approving.
                </p>
              </div>

              {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                  <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37', marginBottom: '1rem' }}></i>
                  <div>Fetching submissions...</div>
                </div>
              ) : pendingBizs.length === 0 ? (
                <div style={{ padding: '5rem 2rem', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}><i className="fas fa-check-double"></i></div>
                  <h4 style={{ margin: 0, fontWeight: 800 }}>No Pending Submissions</h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>All submitted business forms have been processed.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '1rem 2rem', fontWeight: 800, color: '#475569' }}>Business Name</th>
                        <th style={{ padding: '1rem 2rem', fontWeight: 800, color: '#475569' }}>Typology</th>
                        <th style={{ padding: '1rem 2rem', fontWeight: 800, color: '#475569' }}>Contact Point</th>
                        <th style={{ padding: '1rem 2rem', fontWeight: 800, color: '#475569' }}>Submitted On</th>
                        <th style={{ padding: '1rem 2rem', fontWeight: 800, color: '#475569', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingBizs.map(biz => {
                        const isCurrentlyReviewing = reviewBiz?.id === biz.id;
                        return (
                          <tr
                            key={biz.id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: isCurrentlyReviewing ? '#fffbeb' : 'transparent',
                              transition: 'background 0.2s'
                            }}
                          >
                            <td style={{ padding: '1.25rem 2rem' }}>
                              <div style={{ fontWeight: 800, color: '#1e293b' }}>{biz.business_name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>ID: {biz.id.slice(0, 8)}...</div>
                            </td>
                            <td style={{ padding: '1.25rem 2rem' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', padding: '0.3rem 0.75rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>
                                <i className="fas fa-folder" style={{ color: '#D4AF37' }}></i>
                                {biz.type_name || biz.business_type}
                              </span>
                            </td>
                            <td style={{ padding: '1.25rem 2rem' }}>
                              <div style={{ fontWeight: 600, color: '#334155' }}>{biz.email || '—'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{biz.phone || '—'}</div>
                            </td>
                            <td style={{ padding: '1.25rem 2rem', color: '#64748b', fontWeight: 500 }}>
                              {new Date(biz.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleStartReview(biz)}
                                  className="btn btn-outline"
                                  style={{
                                    borderColor: '#D4AF37',
                                    color: '#b45309',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    background: isCurrentlyReviewing ? '#fff' : 'transparent'
                                  }}
                                >
                                  <i className="fas fa-magnifying-glass-chart" style={{ marginRight: '0.3rem' }}></i>
                                  Review DNA
                                </button>
                                <button
                                  onClick={() => handleApproveBusiness(biz.id)}
                                  style={{
                                    background: '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectBusiness(biz.id)}
                                  style={{
                                    background: '#f43f5e',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleDeleteSubmission(biz.id, biz.business_name)}
                                  style={{
                                    background: 'transparent',
                                    color: '#94a3b8',
                                    border: 'none',
                                    padding: '0.4rem',
                                    cursor: 'pointer'
                                  }}
                                  title="Delete registration completely"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'new_form' && (
            <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              
              {/* Wizard Steps Tracker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: step === 1 ? '#D4AF37' : '#10b981',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.85rem'
                  }}>
                    {step === 1 ? '1' : <i className="fas fa-check"></i>}
                  </div>
                  <span style={{ fontWeight: 800, color: step === 1 ? '#1e293b' : '#64748b', fontSize: '0.9rem' }}>Core Identity</span>
                </div>
                <div style={{ flex: 1, height: '2px', background: '#e2e8f0' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: step === 2 ? '#D4AF37' : '#e2e8f0',
                    color: step === 2 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.85rem'
                  }}>
                    2
                  </div>
                  <span style={{ fontWeight: 800, color: step === 2 ? '#1e293b' : '#64748b', fontSize: '0.9rem' }}>Typology DNA fields</span>
                </div>
              </div>

              {step === 1 ? (
                <div>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 800, fontSize: '1.25rem' }}>Step 1: Core Entity Details</h3>
                  <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
                    
                    {/* Name */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Official Business Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Siwa Salt Lake Eco Lodge"
                        value={newBiz.name}
                        onChange={e => setNewBiz({ ...newBiz, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>

                    {/* Typology */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Business Typology (Archetype) *</label>
                      <select
                        className="form-control"
                        value={newBiz.type_id}
                        onChange={e => handleTypeChange(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '0.95rem',
                          appearance: 'auto'
                        }}
                      >
                        <option value="">-- Select Typology --</option>
                        {types.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>
                        This choice dynamically configures the fields in step 2.
                      </p>
                    </div>

                    {/* Email */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Contact Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. contact@business.com"
                        value={newBiz.email}
                        onChange={e => setNewBiz({ ...newBiz, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Contact Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. +20 100 123 4567"
                        value={newBiz.phone}
                        onChange={e => setNewBiz({ ...newBiz, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>

                    {/* Description */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Description</label>
                      <textarea
                        className="form-control"
                        placeholder="Provide a brief summary of the business..."
                        value={newBiz.description}
                        onChange={e => setNewBiz({ ...newBiz, description: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '0.95rem',
                          minHeight: '100px',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setStep(2)}
                      disabled={!newBiz.name.trim() || !newBiz.type_id}
                      className="btn"
                      style={{
                        background: '#1e293b',
                        color: '#fff',
                        border: 'none',
                        padding: '0.8rem 2rem',
                        borderRadius: '12px',
                        fontWeight: 800,
                        cursor: (!newBiz.name.trim() || !newBiz.type_id) ? 'not-allowed' : 'pointer',
                        opacity: (!newBiz.name.trim() || !newBiz.type_id) ? 0.5 : 1
                      }}
                    >
                      Next Step <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '1.25rem' }}>Step 2: Typology-Specific Fields</h3>
                  <p style={{ margin: '0 0 2rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Fill out the dynamic fields designed for the <strong style={{ color: '#D4AF37' }}>{types.find(t => t.id === newBiz.type_id)?.name}</strong> typology.
                  </p>

                  {newBizSections.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                      <p style={{ margin: 0, fontWeight: 700, color: '#64748b' }}>No custom fields defined for this typology.</p>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>You can proceed directly to submit.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '2rem', alignItems: 'start', minHeight: '400px' }}>
                      
                      {/* Section Tabs */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {newBizSections.map(s => (
                          <button
                            key={s.id}
                            onClick={() => setNewBizActiveTab(s.id)}
                            style={{
                              textAlign: 'left',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: newBizActiveTab === s.id ? '#f1f5f9' : 'transparent',
                              color: newBizActiveTab === s.id ? '#1e293b' : '#64748b',
                              fontWeight: newBizActiveTab === s.id ? 800 : 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            <i className={`fas ${s.icon}`} style={{ color: newBizActiveTab === s.id ? '#D4AF37' : '#94a3b8' }}></i>
                            {s.name}
                          </button>
                        ))}
                      </div>

                      {/* Dynamic Form Render */}
                      <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <DynamicForm
                          fields={newBizFields.filter(f => f.section_id === newBizActiveTab)}
                          data={newBiz.custom_data}
                          onChange={handleNewBizDataChange}
                          sections={newBizSections.filter(s => s.id === newBizActiveTab)}
                          userRole="admin"
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                    <button
                      onClick={() => setStep(1)}
                      className="btn btn-outline"
                      style={{
                        borderColor: '#e2e8f0',
                        color: '#64748b',
                        padding: '0.8rem 1.5rem',
                        borderRadius: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i> Back
                    </button>
                    <button
                      onClick={handleSubmitRegistration}
                      disabled={submitting}
                      className="btn"
                      style={{
                        background: '#D4AF37',
                        color: '#1a1a2e',
                        border: 'none',
                        padding: '0.8rem 2.5rem',
                        borderRadius: '12px',
                        fontWeight: 900,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        boxShadow: '0 10px 15px -3px rgba(212, 175, 55, 0.2)'
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Submit to Intake Queue'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTIVE REVIEW PANEL (Appears when reviewing a business) */}
        {reviewBiz && (
          <aside style={{ background: '#fff', border: '2px solid #D4AF37', borderRadius: '24px', padding: '2rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', position: 'sticky', top: '2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px', textTransform: 'uppercase' }}>Reviewing Submission</span>
                <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.3rem', fontWeight: 900 }}>{reviewBiz.business_name}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Typology:</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b' }}>{reviewBiz.type_name || reviewBiz.business_type}</span>
                </div>
              </div>
              <button
                onClick={() => setReviewBiz(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                <i className="fas fa-times-circle"></i>
              </button>
            </div>

            {/* Meta Information */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Email:</span>
                <div style={{ fontWeight: 800, color: '#334155', wordBreak: 'break-all' }}>{reviewBiz.email || 'None'}</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Phone:</span>
                <div style={{ fontWeight: 800, color: '#334155' }}>{reviewBiz.phone || 'None'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Description:</span>
                <div style={{ fontWeight: 500, color: '#475569', lineHeight: '1.4', marginTop: '0.2rem' }}>{reviewBiz.description || 'None'}</div>
              </div>
            </div>

            {/* Dynamic review sections list */}
            {reviewSections.length > 0 ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Submitted DNA Sections</span>
                
                {/* Horizontal tabs */}
                <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem', overflowX: 'auto', marginBottom: '1rem' }}>
                  {reviewSections.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setReviewActiveTab(s.id)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: reviewActiveTab === s.id ? '#D4AF3715' : 'transparent',
                        color: reviewActiveTab === s.id ? '#b45309' : '#64748b',
                        fontWeight: reviewActiveTab === s.id ? 800 : 600,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <i className={`fas ${s.icon}`} style={{ marginRight: '0.3rem' }}></i>
                      {s.name}
                    </button>
                  ))}
                </div>

                {/* Form Fields box */}
                <div style={{ background: '#fcfcfd', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                  <DynamicForm
                    fields={reviewFields.filter(f => f.section_id === reviewActiveTab)}
                    data={reviewBiz.custom_data || {}}
                    onChange={handleReviewDataChange}
                    sections={reviewSections.filter(s => s.id === reviewActiveTab)}
                    userRole="admin"
                  />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                No active schema fields to review. Proceed to approve directly.
              </div>
            )}

            {/* Approval Controls */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  onClick={handleSaveReviewDraft}
                  disabled={isReviewSaving}
                  style={{
                    background: '#1e293b',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {isReviewSaving ? 'Saving...' : '💾 Save Review Draft'}
                </button>
                <button
                  onClick={() => handleApproveBusiness(reviewBiz.id)}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(16,185,129,0.2)'
                  }}
                >
                  ✅ Approve & Activate
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  onClick={() => handleRejectBusiness(reviewBiz.id)}
                  style={{
                    background: '#f43f5e',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Reject Submission
                </button>
                <button
                  onClick={() => handleDeleteSubmission(reviewBiz.id, reviewBiz.business_name)}
                  style={{
                    background: '#f1f5f9',
                    color: '#e11d48',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Delete Permanently
                </button>
              </div>
            </div>

          </aside>
        )}

      </div>

    </div>
  );
}
