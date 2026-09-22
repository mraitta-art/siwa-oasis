'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export interface AuctionItem {
  business_id: string;
  business_name: string;
  business_slug: string;
  business_logo: string | null;
  type_name: string;
  type_icon: string;
  auction_title: string;
  auction_type: string;
  starting_price: string;
  reserve_price: string | null;
  buy_now_price: string | null;
  auction_start: string;
  auction_end: string;
  auction_status: 'upcoming' | 'live' | 'ended' | 'sold' | 'cancelled';
  auction_description: string;
  auction_terms: string;
  auction_contact: string | null;
  is_featured: boolean;
}

interface AuctionsShowcaseProps {
  title?: string;
  subtitle?: string;
  initialFilterType?: string;
  initialFilterStatus?: string;
}

export default function AuctionsShowcase({
  title = 'Live & Upcoming Auctions',
  subtitle = 'Bid on unique local assets, premium hotel nights, desert tours, and business licenses in Siwa Oasis.',
  initialFilterType = 'all',
  initialFilterStatus = 'all',
}: AuctionsShowcaseProps) {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(initialFilterType);
  const [filterStatus, setFilterStatus] = useState(initialFilterStatus);

  useEffect(() => {
    fetch('/api/discovery/auctions')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) {
          setAuctions(data.items);
        }
      })
      .catch((err) => console.error('Failed to load auctions', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredAuctions = auctions.filter((item) => {
    const matchesSearch =
      item.auction_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.auction_type === filterType;
    const matchesStatus = filterStatus === 'all' || item.auction_status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white animate-pulse';
      case 'upcoming':
        return 'bg-blue-500 text-white';
      case 'ended':
        return 'bg-gray-700 text-gray-300';
      case 'sold':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getAuctionTypeIcon = (type: string) => {
    switch (type) {
      case 'asset':
        return '📦';
      case 'service':
        return '🛠️';
      case 'experience':
        return '⛺';
      case 'property':
        return '🏡';
      case 'license':
        return '📜';
      default:
        return '🔨';
    }
  };

  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, margin: '0 0 0.75rem', color: 'var(--text, #fff)' }}>
          <span style={{ background: 'linear-gradient(135deg, #D4AF37, #FFB700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {title}
          </span>
        </h2>
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '1rem', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6 }}>
          {subtitle}
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,23,42,0.6)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
        <div style={{ flex: '1 1 260px' }}>
          <input
            type="text"
            placeholder="Search auctions or businesses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 1rem', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '0.65rem 0.9rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Types</option>
            <option value="asset">Assets / Equipment</option>
            <option value="service">Services</option>
            <option value="experience">Experiences & Stays</option>
            <option value="property">Properties</option>
            <option value="license">Licenses & Permits</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.65rem 0.9rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Statuses</option>
            <option value="live">⚡ Live Now</option>
            <option value="upcoming">⏳ Upcoming</option>
            <option value="ended">⌛ Ended</option>
            <option value="sold">✓ Sold</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #D4AF37', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ color: '#D4AF37', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '2px' }}>LOADING LIVE AUCTIONS...</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredAuctions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', color: '#94a3b8' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔨</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>No Auctions Found</h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Try changing your search keywords or filter criteria.</p>
        </div>
      )}

      {/* Grid of Auctions */}
      {!loading && filteredAuctions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredAuctions.map((item, idx) => (
            <div
              key={`${item.business_id}_${idx}`}
              style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, border-color 0.2s', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
            >
              {/* Card Header */}
              <div style={{ padding: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.25rem 0.65rem', borderRadius: '20px', letterSpacing: '0.5px' }} className={getStatusBadgeColor(item.auction_status)}>
                  {item.auction_status}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {getAuctionTypeIcon(item.auction_type)} {item.auction_type}
                </span>
              </div>

              {/* Content */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Link href={`/${item.business_slug || item.business_id}`} style={{ textDecoration: 'none', color: '#D4AF37', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.4rem', display: 'inline-block' }}>
                  {item.business_name}
                </Link>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 0.6rem', lineHeight: 1.4 }}>
                  {item.auction_title}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.5, margin: '0 0 1.25rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.auction_description}
                </p>

                {/* Pricing Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Starting Price</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>{item.starting_price} EGP</div>
                  </div>
                  {item.buy_now_price && (
                    <div>
                      <div style={{ fontSize: '0.6rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Buy Now</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#10b981' }}>{item.buy_now_price} EGP</div>
                    </div>
                  )}
                </div>

                {/* Action CTA */}
                <Link
                  href={`/${item.business_slug || item.business_id}?tab=auctions`}
                  style={{ display: 'block', textAlign: 'center', padding: '0.7rem', background: 'linear-gradient(135deg, #D4AF37, #FFB700)', color: '#1a1a2e', borderRadius: '10px', fontWeight: 900, fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.5px' }}
                >
                  VIEW DETAILS &amp; BID →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
