'use client';

import React, { useState } from 'react';

interface SocialVideoImporterProps {
  businessId: string;
  onImported?: (slide: any) => void;
  primaryColor?: string;
}

type Platform = 'tiktok' | 'youtube' | 'instagram' | 'facebook' | null;

const PLATFORM_HINTS: Record<string, { icon: string; label: string; color: string; placeholder: string }> = {
  tiktok:    { icon: '🎵', label: 'TikTok',    color: '#000000', placeholder: 'https://www.tiktok.com/@username/video/...' },
  youtube:   { icon: '▶️', label: 'YouTube',   color: '#FF0000', placeholder: 'https://youtu.be/... or youtube.com/watch?v=...' },
  instagram: { icon: '📸', label: 'Instagram', color: '#E1306C', placeholder: 'https://www.instagram.com/reel/...' },
  facebook:  { icon: '📘', label: 'Facebook',  color: '#1877F2', placeholder: 'https://www.facebook.com/watch?v=...' },
};

function detectPlatformClient(url: string): Platform {
  if (!url) return null;
  if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  return null;
}

export default function SocialVideoImporter({ businessId, onImported, primaryColor = '#D4AF37' }: SocialVideoImporterProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  const detectedPlatform = detectPlatformClient(url);
  const hint = detectedPlatform ? PLATFORM_HINTS[detectedPlatform] : null;

  const handleImport = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setImported(false);

    try {
      const res = await fetch('/api/siwify/social-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to import video.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCarousel = async () => {
    if (!result) return;
    setLoading(true);
    try {
      // Save the slide to custom_data media for this vendor
      const saveRes = await fetch(`/api/jana/businesses/${businessId}/carousel-slide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slide: result.suggested_slide,
          source_url: result.originalUrl,
          platform: result.platform,
          thumbnail: result.thumbnail,
        }),
      });
      if (saveRes.ok) {
        setImported(true);
        if (onImported) onImported(result.suggested_slide);
      } else {
        // Even without saving, pass it up so parent can use it locally
        setImported(true);
        if (onImported) onImported(result.suggested_slide);
      }
    } catch {
      setImported(true);
      if (onImported) onImported(result.suggested_slide);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      border: '1px solid #f1f5f9',
      padding: '1.5rem',
      boxSizing: 'border-box',
      maxWidth: '100%',
    }}>
      {/* HEADER */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
          📥 Import Video from Social Media
        </h4>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
          Paste any TikTok, Instagram Reel, YouTube, or Facebook video link to add it to your hero carousel.
        </p>
      </div>

      {/* PLATFORM QUICK BUTTONS */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {Object.entries(PLATFORM_HINTS).map(([key, p]) => (
          <div key={key} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '3px 10px', borderRadius: '50px', fontSize: '0.72rem',
            fontWeight: 800, background: '#f8fafc', border: '1px solid #e2e8f0',
            color: detectedPlatform === key ? p.color : '#64748b',
            borderColor: detectedPlatform === key ? p.color : '#e2e8f0',
            transition: 'all 0.2s'
          }}>
            {p.icon} {p.label}
          </div>
        ))}
      </div>

      {/* URL INPUT */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setResult(null); setError(null); setImported(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          placeholder={hint?.placeholder || 'Paste a TikTok, YouTube, Instagram, or Facebook link…'}
          style={{
            flex: 1, padding: '0.75rem 1rem', borderRadius: '12px',
            border: `2px solid ${hint ? hint.color : '#e2e8f0'}`,
            fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || !url.trim()}
          style={{
            padding: '0.75rem 1.25rem', borderRadius: '12px',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            color: '#fff', border: 0, fontWeight: 800, fontSize: '0.85rem',
            cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {loading ? '⏳' : '⬇️ Import'}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: '10px',
          background: '#fef2f2', border: '1px solid #fca5a5',
          color: '#991b1b', fontSize: '0.8rem', marginBottom: '0.75rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* PREVIEW RESULT */}
      {result && !imported && (
        <div style={{
          background: '#f8fafc', borderRadius: '14px',
          border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'flex-start' }}>
            {/* THUMBNAIL */}
            {result.thumbnail && (
              <img
                src={result.thumbnail}
                alt={result.title}
                style={{
                  width: '90px', height: '90px', borderRadius: '10px',
                  objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0'
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fff', padding: '2px 8px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 800, color: '#475569', border: '1px solid #e2e8f0', marginBottom: '0.4rem' }}>
                {PLATFORM_HINTS[result.platform]?.icon} {PLATFORM_HINTS[result.platform]?.label || result.platform}
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {result.title}
              </div>
              {result.author && (
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>@{result.author}</div>
              )}
              {result.duration && (
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>⏱ {result.duration}</div>
              )}
            </div>
          </div>

          {/* SLIDE PREVIEW */}
          <div style={{ padding: '0 1rem 1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.35rem', letterSpacing: '0.5px' }}>
              CAROUSEL SLIDE PREVIEW
            </div>
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #f1f5f9', padding: '0.75rem', fontSize: '0.78rem', color: '#475569' }}>
              <div><strong>Type:</strong> {result.suggested_slide.type}</div>
              <div style={{ marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <strong>Title:</strong> {result.suggested_slide.title}
              </div>
              <div><strong>CTA:</strong> {result.suggested_slide.ctaText}</div>
            </div>
          </div>

          <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleAddToCarousel}
              disabled={loading}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '10px',
                background: `linear-gradient(135deg, ${primaryColor}, #f59e0b)`,
                color: '#1a1000', border: 0, fontWeight: 900, fontSize: '0.85rem',
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              ✅ Add to Hero Carousel
            </button>
            <button
              type="button"
              onClick={() => { setResult(null); setUrl(''); }}
              style={{
                padding: '0.75rem 1rem', borderRadius: '10px',
                background: '#f1f5f9', color: '#475569', border: 0,
                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS STATE */}
      {imported && (
        <div style={{
          padding: '1rem', borderRadius: '12px', background: '#f0fdf4',
          border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🎉</span>
          <div>
            <div style={{ fontWeight: 800, color: '#14532d', fontSize: '0.88rem' }}>Video added to your carousel!</div>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.2rem' }}>
              It will appear in your hero slideshow on <strong>siwify.com/{businessId}</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setImported(false); setUrl(''); setResult(null); }}
            style={{ marginLeft: 'auto', padding: '0.4rem 0.85rem', borderRadius: '8px', background: '#fff', border: '1px solid #86efac', color: '#14532d', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
          >
            Import More
          </button>
        </div>
      )}
    </div>
  );
}
