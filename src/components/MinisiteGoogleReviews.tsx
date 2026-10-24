'use client';

import React from 'react';

/**
 * Public, read-only Google Maps profile block for a vendor minisite.
 *
 * Rendered only when the vendor granted the `google_place_data` consent.
 * Content comes from the cached snapshot in `businesses.custom_data.google_place`
 * (see src/lib/google-places.ts) — no API call happens during render.
 */

export interface GoogleReviewItem {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
}

export interface GooglePlacePublicData {
  rating?: number | null;
  review_count?: number | null;
  reviews?: GoogleReviewItem[];
  maps_uri?: string;
  opening_hours?: string[];
  fetched_at?: string;
}

interface Props {
  place: GooglePlacePublicData | null | undefined;
  lang?: 'en' | 'ar';
  variant?: 'sidebar' | 'inline';
}

function GoogleGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v8.4h12.7c-.3 2.1-1.6 5.2-4.6 7.3l7.6 5.9c4.5-4.2 6.8-10.3 6.8-17.5z" />
      <path fill="#FBBC05" d="M10.4 28.6A14.6 14.6 0 0 1 9.6 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.6-5.9c-2 1.4-4.8 2.4-8.2 2.4-6.3 0-11.7-3.7-13.6-9.1l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function Stars({ value, size = 12 }: { value: number; size?: number }) {
  const rounded = Math.round(Math.max(0, Math.min(5, value)) * 2) / 2;
  return (
    <span style={{ display: 'inline-flex', gap: '2px', color: '#F59E0B', fontSize: `${size}px`, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map(index => (
        <i
          key={index}
          className={rounded >= index ? 'fas fa-star' : rounded >= index - 0.5 ? 'fas fa-star-half-alt' : 'far fa-star'}
          style={{ opacity: rounded >= index - 0.5 ? 1 : 0.35 }}
        />
      ))}
    </span>
  );
}

export default function MinisiteGoogleReviews({ place, lang = 'en', variant = 'sidebar' }: Props) {
  if (!place) return null;

  const rating = typeof place.rating === 'number' ? place.rating : null;
  const reviews = Array.isArray(place.reviews) ? place.reviews.filter(r => r && r.text) : [];
  const reviewCount = typeof place.review_count === 'number' ? place.review_count : null;
  const mapsUri = typeof place.maps_uri === 'string' && /^https?:\/\//i.test(place.maps_uri) ? place.maps_uri : '';
  const todayHours = Array.isArray(place.opening_hours) && place.opening_hours.length > 0
    ? place.opening_hours[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
    : '';
  const hasRating = rating !== null;

  if (!hasRating && reviews.length === 0 && !mapsUri) return null;

  const copy = lang === 'ar'
    ? {
        heading: 'تقييمات جوجل',
        reviewsSuffix: 'مراجعة',
        noRating: 'لا يوجد تقييم بعد',
        today: 'اليوم',
        view: 'عرض على خرائط جوجل',
        source: 'بيانات عامة من جوجل',
      }
    : {
        heading: 'Google Reviews',
        reviewsSuffix: 'reviews',
        noRating: 'No rating yet',
        today: 'Today',
        view: 'View on Google Maps',
        source: 'Public data from Google',
      };

  const isSidebar = variant === 'sidebar';
  const maxReviews = isSidebar ? 2 : 1;

  return (
    <div
      style={{
        marginTop: isSidebar ? '2rem' : '1.25rem',
        paddingTop: isSidebar ? '2rem' : '1.25rem',
        borderTop: isSidebar ? '1px solid #f1f5f9' : '1px solid #e2e8f0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <GoogleGlyph size={isSidebar ? 16 : 14} />
        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase' }}>
          {copy.heading}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        {hasRating ? (
          <>
            <span style={{ fontSize: isSidebar ? '1.5rem' : '1.15rem', fontWeight: 900, color: '#0f172a' }}>{rating!.toFixed(1)}</span>
            <Stars value={rating!} size={isSidebar ? 13 : 11} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
              {reviewCount !== null ? `(${reviewCount.toLocaleString()} ${copy.reviewsSuffix})` : ''}
            </span>
          </>
        ) : (
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>{copy.noRating}</span>
        )}
      </div>

      {todayHours && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
          <span style={{ fontWeight: 800, color: '#94a3b8' }}>{copy.today}: </span>
          {todayHours.replace(/^[^:]+:\s*/, '')}
        </div>
      )}

      {reviews.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {reviews.slice(0, maxReviews).map((review, index) => (
            <div key={`${review.author}-${index}`} style={{ background: '#f8fafc', border: '1px solid #eef0f5', borderRadius: '12px', padding: '0.75rem 0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.author}</span>
                <Stars value={review.rating || 0} size={10} />
              </div>
              <div style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {review.text}
              </div>
              {review.relativeTime && (
                <div style={{ marginTop: '0.35rem', fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8' }}>{review.relativeTime}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        {mapsUri ? (
          <a
            href={mapsUri}
            target="_blank"
            rel="noopener noreferrer nofollow"
            style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1a73e8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            {copy.view}
            <i className="fas fa-arrow-up-right-from-square" style={{ fontSize: '0.6rem' }} />
          </a>
        ) : <span />}
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#cbd5e1' }}>{copy.source}</span>
      </div>
    </div>
  );
}
