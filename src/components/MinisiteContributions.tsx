'use client';

import React, { useState, useEffect } from 'react';
import { useMinisiteLang } from './minisite/MinisiteLang';
import { label, labelWith } from '@/lib/minisite-i18n';

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
  // Every string in this card came from the dictionary, because it is the one
  // satellite that had no language at all: an Arabic minisite was showing an
  // English review form to the visitor writing the review.
  const { ar } = useMinisiteLang();
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
        alert(result.error || label('contrib_failed', ar));
      }
    } catch (err) {
      console.error(err);
      alert(label('contrib_network_error', ar));
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = contributions.length > 0
    ? (contributions.reduce((acc, c) => acc + (c.rating || 5), 0) / contributions.length).toFixed(1)
    : '5.0';

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{
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
              ({labelWith(contributions.length === 1 ? 'contrib_count_one' : 'contrib_count', ar, { n: contributions.length })})
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
            {label('contrib_community_line', ar)}
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
          <span>{showForm ? label('contrib_cancel', ar) : label('contrib_write', ar)}</span>
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
            {labelWith('contrib_share_title', ar, { name: businessName })}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                {label('contrib_name', ar)}
              </label>
              <input
                type="text"
                required
                placeholder={label('contrib_name_placeholder', ar)}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                {label('contrib_origin', ar)}
              </label>
              <input
                type="text"
                placeholder={label('contrib_origin_placeholder', ar)}
                value={authorOrigin}
                onChange={(e) => setAuthorOrigin(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                {label('contrib_rating', ar)}
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              >
                <option value={5}>{label('contrib_rating_5', ar)}</option>
                <option value={4}>{label('contrib_rating_4', ar)}</option>
                <option value={3}>{label('contrib_rating_3', ar)}</option>
                <option value={2}>{label('contrib_rating_2', ar)}</option>
                <option value={1}>{label('contrib_rating_1', ar)}</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
              {label('contrib_review_text', ar)}
            </label>
            <textarea
              required
              rows={3}
              placeholder={label('contrib_review_placeholder', ar)}
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
            {submitting ? label('contrib_submitting', ar) : label('contrib_post', ar)}
          </button>
        </form>
      )}

      {/* LIST OF CONTRIBUTIONS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          {label('contrib_loading', ar)}
        </div>
      ) : contributions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#fafbfc', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🌴</div>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            {label('contrib_empty_title', ar)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            {labelWith('contrib_empty_body', ar, { name: businessName })}
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
                      ✓ {item.author_origin || label('contrib_verified_guest', ar)}
                    </span>
                  </div>
                  <div style={{ color: '#f59e0b', fontSize: '0.85rem', marginTop: '2px' }}>
                    {'★'.repeat(item.rating || 5)}{'☆'.repeat(5 - (item.rating || 5))}
                  </div>
                </div>

                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString(ar ? 'ar-EG' : 'en-GB') : label('contrib_recent', ar)}
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
