'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Auction {
  id: string;
  business_name: string;
  visitor_request: string;
  status: 'open' | 'closed' | 'completed';
  created_at: string;
  closing_date: string;
  bid_count: number;
  show_visitor_contact: boolean;
  contact_visibility_level: string;
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'completed'>('all');
  const [businessName, setBusinessName] = useState('');
  const [visitorRequest, setVisitorRequest] = useState('');
  const [showVisitorContact, setShowVisitorContact] = useState(false);
  const [contactLevel, setContactLevel] = useState('anonymous');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAuctions();
  }, [filter]);

  async function loadAuctions() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/auctions?status=${filter !== 'all' ? filter : ''}`);
      if (res.ok) {
        const data = await res.json();
        setAuctions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading auctions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAuction() {
    if (!businessName.trim() || !visitorRequest.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/admin/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          visitor_request: visitorRequest,
          show_visitor_contact: showVisitorContact,
          contact_visibility_level: contactLevel
        })
      });

      if (res.ok) {
        alert('Auction created successfully!');
        setBusinessName('');
        setVisitorRequest('');
        setShowVisitorContact(false);
        setContactLevel('anonymous');
        loadAuctions();
      } else {
        alert('Failed to create auction');
      }
    } catch (err) {
      console.error('Error creating auction:', err);
      alert('Error creating auction');
    } finally {
      setCreating(false);
    }
  }

  async function handleCloseAuction(auctionId: string) {
    if (!confirm('Close this auction? The highest bidder will win.')) return;

    try {
      const res = await fetch('/api/admin/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', id: auctionId })
      });

      if (res.ok) {
        alert('Auction closed! Winner determined.');
        loadAuctions();
      }
    } catch (err) {
      console.error('Error closing auction:', err);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>
          <i className="fas fa-gavel" style={{ marginRight: '0.5rem', color: '#D4AF37' }}></i>
          Auction Management
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Manage vendor auctions for visitor requests</p>
      </div>

      {/* Create New Auction */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginTop: 0 }}>Create New Auction</h3>
        
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Business Name</label>
            <input
              type="text"
              placeholder="e.g., Desert Safari Co."
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
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Visitor Request</label>
            <textarea
              placeholder="e.g., Looking for a 3-day Siwa oasis tour with accommodation"
              value={visitorRequest}
              onChange={e => setVisitorRequest(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showVisitorContact}
                  onChange={e => setShowVisitorContact(e.target.checked)}
                />
                Show Visitor Contact
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Contact Visibility Level
              </label>
              <select
                value={contactLevel}
                onChange={e => setContactLevel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="anonymous">Anonymous</option>
                <option value="names_only">Names Only</option>
                <option value="emails_only">Emails Only</option>
                <option value="full_contact">Full Contact</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateAuction}
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
          {creating ? '⏳ Creating...' : '+ Create Auction'}
        </button>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {(['all', 'open', 'closed', 'completed'] as const).map(status => (
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
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Auctions List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
          Loading auctions...
        </div>
      ) : auctions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: '#f8fafc',
          borderRadius: '8px',
          color: '#64748b'
        }}>
          No auctions found
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {auctions.map(auction => (
            <div
              key={auction.id}
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
                  <h3 style={{ margin: 0 }}>{auction.business_name}</h3>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    background: auction.status === 'open' ? '#dcfce7' : auction.status === 'closed' ? '#fef3c7' : '#dbeafe',
                    color: auction.status === 'open' ? '#166534' : auction.status === 'closed' ? '#92400e' : '#0c4a6e'
                  }}>
                    {auction.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: '0.5rem 0', color: '#64748b' }}>
                  <i className="fas fa-quote-left" style={{ marginRight: '0.5rem', opacity: 0.5 }}></i>
                  {auction.visitor_request}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Created:</span> {new Date(auction.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Closes:</span> {new Date(auction.closing_date).toLocaleDateString()}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Bids:</span> <strong>{auction.bid_count}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Contact:</span> {auction.show_visitor_contact ? '✅ Visible' : '❌ Hidden'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {auction.status === 'open' && (
                  <button
                    onClick={() => handleCloseAuction(auction.id)}
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
                    Close Auction
                  </button>
                )}
                <Link
                  href={`/jana/auctions/${auction.id}`}
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
