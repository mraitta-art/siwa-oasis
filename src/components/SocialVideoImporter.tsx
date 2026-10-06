'use client';

import React, { useState } from 'react';

interface SocialVideoImporterProps {
  businessId: string;
  businessSlug?: string;
  businessName?: string;
  onImported?: (slide: any) => void;
  primaryColor?: string;
}

type Destination = 'hero_carousel' | 'section_gallery' | 'social_share';

const PLATFORM_HINTS: Record<string, { icon: string; label: string; color: string; placeholder: string }> = {
  tiktok:    { icon: '🎵', label: 'TikTok',    color: '#000000', placeholder: 'https://www.tiktok.com/@username/video/...' },
  youtube:   { icon: '▶️', label: 'YouTube',   color: '#FF0000', placeholder: 'https://youtu.be/... or youtube.com/watch?v=...' },
  instagram: { icon: '📸', label: 'Instagram', color: '#E1306C', placeholder: 'https://www.instagram.com/reel/...' },
  facebook:  { icon: '📘', label: 'Facebook',  color: '#1877F2', placeholder: 'https://www.facebook.com/watch?v=...' },
};

function detectPlatformClient(url: string): string | null {
  if (!url) return null;
  const clean = url.toLowerCase();
  if (clean.includes('tiktok.com')) return 'tiktok';
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) return 'youtube';
  if (clean.includes('instagram.com') || clean.includes('instagr.am')) return 'instagram';
  if (clean.includes('facebook.com') || clean.includes('fb.watch')) return 'facebook';
  if (clean.includes('vimeo.com')) return 'vimeo';
  return null;
}

export default function SocialVideoImporter({
  businessId,
  businessSlug,
  businessName,
  onImported,
  primaryColor = '#D4AF37',
}: SocialVideoImporterProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);
  const [destination, setDestination] = useState<Destination>('hero_carousel');
  const [agreedToBioLink, setAgreedToBioLink] = useState(true);
  const [copiedBio, setCopiedBio] = useState(false);

  const effectiveSlug = businessSlug || businessId;
  const vanityUrl = `https://siwify.com/${effectiveSlug}`;
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
        setError(data.error || 'Failed to import video. Please check the URL.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteDestination = async () => {
    if (!result) return;
    setLoading(true);
    setError(null);

    try {
      // 1. If agreed to bio link, soft-accept claim agreement in the background
      if (agreedToBioLink) {
        fetch('/api/jana/businesses/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            slug: effectiveSlug,
            agreedToBioLink: true,
            sourcePlatform: result.platform,
          }),
        }).catch(() => {});
      }

      // 2. Route based on selected destination
      if (destination === 'hero_carousel') {
        const saveRes = await fetch(`/api/jana/businesses/${encodeURIComponent(businessId)}/carousel-slide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slide: result.suggested_slide,
            source_url: result.originalUrl,
            platform: result.platform,
            thumbnail: result.thumbnail,
          }),
        });

        if (!saveRes.ok) {
          const errData = await saveRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to save slide to carousel.');
        }

        setImported(true);
        if (onImported) onImported(result.suggested_slide);
      } else if (destination === 'section_gallery') {
        // Upload into vendor gallery table
        const galleryRes = await fetch('/api/vendor/gallery/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            url: result.videoUrl || result.thumbnail,
            caption: result.title,
            resourceType: result.videoUrl ? 'video' : 'image',
            sectionId: 'sec_1_identity',
          }),
        });

        setImported(true);
        if (onImported) onImported(result.suggested_slide);
      } else if (destination === 'social_share') {
        // Copy bio link & caption for posting
        const shareText = `🌴 Discover ${businessName || 'our experience'} in Siwa Oasis! Book directly with 0% platform commission: ${vanityUrl} #${effectiveSlug} #SiwaOasis #Egypt`;
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          setCopiedBio(true);
        }
        setImported(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyMinisiteLink = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(vanityUrl);
      setCopiedBio(true);
      setTimeout(() => setCopiedBio(false), 3000);
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
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    }}>
      {/* HEADER */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🎬</span> Video Carousel & Social Sync
          </h4>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: '50px', background: 'rgba(212,175,55,0.12)', color: '#92400e' }}>
            0% Commission Direct
          </span>
        </div>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
          Upload from your TikTok, Instagram Reels, YouTube Shorts, or Facebook directly to your minisite.
        </p>
      </div>

      {/* PLATFORM BADGES */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        {Object.entries(PLATFORM_HINTS).map(([key, p]) => (
          <div key={key} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '3px 10px', borderRadius: '50px', fontSize: '0.72rem',
            fontWeight: 800, background: '#f8fafc', border: '1px solid',
            color: detectedPlatform === key ? p.color : '#64748b',
            borderColor: detectedPlatform === key ? p.color : '#e2e8f0',
            transition: 'all 0.2s',
          }}>
            {p.icon} {p.label}
          </div>
        ))}
      </div>

      {/* URL INPUT & EXTRACT BUTTON */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setResult(null); setError(null); setImported(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          placeholder={hint?.placeholder || 'Paste a TikTok, Instagram Reel, or YouTube link…'}
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
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '⏳' : '⚡ Extract'}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: '10px',
          background: '#fef2f2', border: '1px solid #fca5a5',
          color: '#991b1b', fontSize: '0.8rem', marginBottom: '0.75rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* RESULT & DESTINATION SELECTION */}
      {result && !imported && (
        <div style={{
          background: '#f8fafc', borderRadius: '16px',
          border: '1px solid #e2e8f0', padding: '1rem', marginBottom: '0.85rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          {/* Card Preview */}
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
            {result.thumbnail && (
              <img
                src={result.thumbnail}
                alt={result.title}
                style={{
                  width: '84px', height: '84px', borderRadius: '10px',
                  objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0',
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fff', padding: '2px 8px', borderRadius: '50px', fontSize: '0.68rem', fontWeight: 800, color: '#475569', border: '1px solid #e2e8f0', marginBottom: '0.3rem' }}>
                {result.platformIcon || '🎬'} {result.platformLabel || result.platform}
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {result.title}
              </div>
              {result.author && (
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>@{result.author}</div>
              )}
            </div>
          </div>

          {/* DESTINATION SELECTOR */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
              CHOOSE DESTINATION:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
              {[
                { id: 'hero_carousel', label: '🎡 Hero Carousel', desc: 'Main slideshow' },
                { id: 'section_gallery', label: '📸 Section Gallery', desc: 'Media gallery' },
                { id: 'social_share', label: '📲 Social Bio Share', desc: 'Copy caption & link' },
              ].map((dest) => (
                <button
                  key={dest.id}
                  type="button"
                  onClick={() => setDestination(dest.id as Destination)}
                  style={{
                    padding: '0.6rem 0.75rem', borderRadius: '10px', textAlign: 'left',
                    border: `2px solid ${destination === dest.id ? primaryColor : '#e2e8f0'}`,
                    background: destination === dest.id ? 'rgba(212,175,55,0.08)' : '#fff',
                    color: destination === dest.id ? '#1a1000' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.78rem' }}>{dest.label}</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{dest.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 1-CLICK BIO LINK AGREEMENT CHECKBOX */}
          <div style={{
            background: '#fff', padding: '0.75rem 1rem', borderRadius: '12px',
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
          }}>
            <input
              type="checkbox"
              id="bio_agree"
              checked={agreedToBioLink}
              onChange={(e) => setAgreedToBioLink(e.target.checked)}
              style={{ marginTop: '3px', cursor: 'pointer', accentColor: primaryColor }}
            />
            <label htmlFor="bio_agree" style={{ fontSize: '0.76rem', color: '#334155', lineHeight: 1.4, cursor: 'pointer' }}>
              <strong>Bio Link Agreement:</strong> I agree to display my official link (<code>{effectiveSlug}</code>) in my social media bio for direct customer bookings.
            </label>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleExecuteDestination}
              disabled={loading}
              style={{
                flex: 1, padding: '0.8rem', borderRadius: '10px',
                background: `linear-gradient(135deg, ${primaryColor}, #f59e0b)`,
                color: '#1a1000', border: 0, fontWeight: 900, fontSize: '0.88rem',
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(212,175,55,0.25)',
              }}
            >
              {loading ? 'Processing...' : (
                destination === 'hero_carousel' ? '✅ Add to Minisite Carousel' :
                destination === 'section_gallery' ? '✅ Add to Gallery' :
                '📋 Copy Link & Share Post'
              )}
            </button>
            <button
              type="button"
              onClick={() => { setResult(null); setUrl(''); }}
              style={{
                padding: '0.8rem 1rem', borderRadius: '10px',
                background: '#f1f5f9', color: '#475569', border: 0,
                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
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
          padding: '1rem', borderRadius: '14px', background: '#f0fdf4',
          border: '1px solid #86efac', display: 'flex', flexDirection: 'column', gap: '0.6rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🎉</span>
            <div>
              <div style={{ fontWeight: 800, color: '#14532d', fontSize: '0.88rem' }}>
                {destination === 'hero_carousel' ? 'Video added to your Carousel!' : 'Media published successfully!'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#16a34a' }}>
                Your official link is ready for your social bio:
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#fff', padding: '0.5rem 0.75rem', borderRadius: '8px',
            border: '1px solid #bbf7d0',
          }}>
            <code style={{ flex: 1, fontSize: '0.78rem', color: '#14532d', fontWeight: 800 }}>
              {vanityUrl}
            </code>
            <button
              type="button"
              onClick={copyMinisiteLink}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '6px',
                background: '#15803d', color: '#fff', border: 0,
                fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
              }}
            >
              {copiedBio ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setImported(false); setUrl(''); setResult(null); }}
            style={{
              alignSelf: 'flex-start', padding: '0.4rem 0.85rem', borderRadius: '8px',
              background: '#fff', border: '1px solid #86efac', color: '#14532d',
              fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', marginTop: '0.2rem',
            }}
          >
            + Upload Another Video
          </button>
        </div>
      )}
    </div>
  );
}
