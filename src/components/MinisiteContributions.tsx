'use client';

import React, { useState, useEffect } from 'react';

export interface ContributionItem {
  id: string;
  author_name: string;
  author_origin?: string;
  contribution_type: 'review' | 'tip' | 'road_alert' | 'photo_story';
  rating: number;
  title?: string;
  content: string;
  media_url?: string;
  created_at: string;
}

export interface MinisiteContributionsProps {
  businessId: string;
  businessName: string;
  slug?: string;
  primaryColor?: string;
}

export default function MinisiteContributions({
  businessId,
  businessName,
  slug,
  primaryColor = '#D4AF37',
}: MinisiteContributionsProps) {
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [authorName, setAuthorName] = useState('');
  const [authorOrigin, setAuthorOrigin] = useState('');
  const [rating, setRating] = useState(5);
  const [contributionType, setContributionType] = useState<'review' | 'tip' | 'road_alert'>('review');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!businessId && !slug) return;
    fetch(`/api/siwify/contributions?businessId=${encodeURIComponent(businessId || '')}&slug=${encodeURIComponent(slug || '')}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setContributions(data);
      })
      .catch((err) => console.error('Error fetching contributions:', err))
      .finally(() => setLoading(false));
  }, [businessId, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/siwify/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          slug,
          authorName,
          authorOrigin,
          rating,
          contributionType,
          title,
          content,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setContributions([result.contribution, ...contributions]);
        setShowForm(false);
        setContent('');
        setTitle('');
      } else {
        alert(result.error || 'Failed to submit contribution.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error submitting review.');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = contributions.length > 0
    ? (contributions.reduce((acc, c) => acc + (c.rating || 5), 0) / contributions.length).toFixed(1)
    : '5.0';

  return (
    <div style={{
      background: '#fff',
      borderRadius: '24px',
      border: '1px solid #f1f5f9',
      padding: '2rem',
      marginBottom: '2.5rem',
      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.06)',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      {/* HEADER WITH RATING SUMMARY */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{averageRating}</span>
            <div style={{ color: '#f59e0b', fontSize: '1.1rem' }}>★★★★★</div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
              ({contributions.length} verified {contributions.length === 1 ? 'review' : 'reviews'} & traveler tips)
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
            Community verified experiences on SiWiFy.com
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            color: '#fff',
            border: 0,
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
          }}
        >
          <span>✍️</span>
          <span>{showForm ? 'Cancel Contribution' : 'Write a Review / Tip'}</span>
        </button>
      </div>

      {/* SUBMISSION FORM */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#f8fafc',
            borderRadius: '18px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid #e2e8f0'
          }}
        >
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
            Share Your Experience with {businessName}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                Your Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                Traveler Type / Origin
              </label>
              <input
                type="text"
                placeholder="e.g. Solo Explorer / Cairo / London"
                value={authorOrigin}
                onChange={(e) => setAuthorOrigin(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                Rating (1 to 5 Stars)
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                <option value={3}>⭐⭐⭐ (3 - Average)</option>
                <option value={2}>⭐⭐ (2 - Poor)</option>
                <option value={1}>⭐ (1 - Terrible)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
              Your Review or Oasis Tip *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Tell other travelers about your stay, safari, driver, or favorite secret spot..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
              color: '#1a1000',
              border: 0,
              fontWeight: 900,
              fontSize: '0.85rem',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Submitting...' : 'Post Verified Contribution 🚀'}
          </button>
        </form>
      )}

      {/* LIST OF CONTRIBUTIONS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          Loading community contributions...
        </div>
      ) : contributions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#fafbfc', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🌴</div>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            Be the First to Contribute a Review!
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Have you stayed, dined, or toured with {businessName}? Share your feedback with the oasis community.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {contributions.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#fafbfc',
                borderRadius: '16px',
                padding: '1.25rem',
                border: '1px solid #f1f5f9'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem' }}>{item.author_name}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(212,175,55,0.15)', color: '#b45309', padding: '2px 8px', borderRadius: '50px' }}>
                      ✓ {item.author_origin || 'Verified Guest'}
                    </span>
                  </div>
                  <div style={{ color: '#f59e0b', fontSize: '0.85rem', marginTop: '2px' }}>
                    {'★'.repeat(item.rating || 5)}{'☆'.repeat(5 - (item.rating || 5))}
                  </div>
                </div>

                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                </span>
              </div>

              {item.title && (
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e293b', marginBottom: '0.35rem' }}>
                  {item.title}
                </div>
              )}

              <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
