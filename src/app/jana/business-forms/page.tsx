'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';

interface BusinessForm {
  id: string;
  business_name: string;
  business_type: string;
  email: string;
  phone: string;
  description: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  submitted_at?: string;
}

export default function BusinessFormsPage() {
  const [forms, setForms] = useState<BusinessForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted' | 'approved' | 'rejected'>('all');
  
  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadForms();
  }, [filter]);

  async function loadForms() {
    try {
      setLoading(true);
      const res = await fetch(`/api/business-forms?status=${filter !== 'all' ? filter : ''}`);
      if (res.ok) {
        const data = await res.json();
        setForms(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading forms:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateForm() {
    if (!businessName.trim() || !businessType.trim() || !email.trim()) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/business-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          business_type: businessType,
          email,
          phone,
          description,
          status: 'draft'
        })
      });

      if (res.ok) {
        alert('Business form created as draft!');
        setBusinessName('');
        setBusinessType('');
        setEmail('');
        setPhone('');
        setDescription('');
        loadForms();
      } else {
        alert('Failed to create form');
      }
    } catch (err) {
      console.error('Error creating form:', err);
      alert('Error creating form');
    } finally {
      setCreating(false);
    }
  }

  async function handleSubmitForm(formId: string) {
    if (!confirm('Submit this form for review?')) return;

    try {
      const res = await fetch('/api/business-forms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: formId, status: 'submitted' })
      });

      if (res.ok) {
        alert('Form submitted for review!');
        loadForms();
      }
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  }

  async function handleApproveForm(formId: string) {
    if (!confirm('Approve this business form?')) return;

    try {
      const res = await fetch('/api/business-forms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: formId, status: 'approved' })
      });

      if (res.ok) {
        alert('Form approved!');
        loadForms();
      }
    } catch (err) {
      console.error('Error approving form:', err);
    }
  }

  async function handleRejectForm(formId: string) {
    if (!confirm('Reject this business form?')) return;

    try {
      const res = await fetch('/api/business-forms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: formId, status: 'rejected' })
      });

      if (res.ok) {
        alert('Form rejected.');
        loadForms();
      }
    } catch (err) {
      console.error('Error rejecting form:', err);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>
          <i className="fas fa-building" style={{ marginRight: '0.5rem', color: '#D4AF37' }}></i>
          Business Forms
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Create and manage business registration forms</p>
      </div>

      {/* Create New Form */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginTop: 0 }}>Create New Business Form</h3>
        
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Business Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Desert Safari Adventures"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Business Type *
              </label>
              <select
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select type...</option>
                <option value="accommodation">Accommodation</option>
                <option value="tour">Tour Operator</option>
                <option value="food">Food & Restaurant</option>
                <option value="transportation">Transportation</option>
                <option value="entertainment">Entertainment</option>
                <option value="shopping">Shopping</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Email *
              </label>
              <input
                type="email"
                placeholder="business@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Phone
              </label>
              <input
                type="tel"
                placeholder="+20 XXX XXX XXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Description
            </label>
            <textarea
              placeholder="Describe your business..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                minHeight: '100px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleCreateForm}
          disabled={creating}
          style={{
            background: '#D4AF37',
            color: '#1a1a2e',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: creating ? 'not-allowed' : 'pointer',
            opacity: creating ? 0.6 : 1
          }}
        >
          {creating ? '⏳ Creating...' : '+ Create Form'}
        </button>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {(['all', 'draft', 'submitted', 'approved', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: filter === status ? '#D4AF37' : '#e2e8f0',
              color: filter === status ? '#1a1a2e' : '#64748b',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Forms List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
          Loading forms...
        </div>
      ) : forms.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: '#f8fafc',
          borderRadius: '8px',
          color: '#64748b'
        }}>
          No forms found
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {forms.map(form => (
            <div
              key={form.id}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1.5rem',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '1rem',
                alignItems: 'start'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>{form.business_name}</h3>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    background: form.status === 'draft' ? '#f3f4f6' : form.status === 'submitted' ? '#dbeafe' : form.status === 'approved' ? '#dcfce7' : '#fee2e2',
                    color: form.status === 'draft' ? '#4b5563' : form.status === 'submitted' ? '#0c4a6e' : form.status === 'approved' ? '#166534' : '#991b1b'
                  }}>
                    {form.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Type:</span> {form.business_type}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Email:</span> {form.email}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Phone:</span> {form.phone || 'N/A'}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Created:</span> {new Date(form.created_at).toLocaleDateString()}
                  </div>
                </div>
                {form.description && (
                  <p style={{ margin: '0.75rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                    {form.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {form.status === 'draft' && (
                  <button
                    onClick={() => handleSubmitForm(form.id)}
                    style={{
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    Submit
                  </button>
                )}
                {form.status === 'submitted' && (
                  <>
                    <button
                      onClick={() => handleApproveForm(form.id)}
                      style={{
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectForm(form.id)}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
