'use client';

import React, { useState, useEffect } from 'react';
import type { VideoImportResult } from '@/app/api/siwify/social-import/route';

export interface SocialImportedSlide {
  id: string;
  title: string;
  subtitle?: string;
  caption?: string;
  mediaUrl: string;
  type: 'image' | 'youtube' | 'video' | 'branded';
  ctaText?: string;
  ctaLink?: string;
  targetSectionId?: string;
  displayOrder: number;
  imageFit?: 'cover' | 'contain';
  imagePosition?: 'center' | 'top' | 'bottom';
  bgColor?: string;
  overlayOpacity?: number;
  animation?: string;
  titleColor?: string;
  titleSize?: number;
  subtitleSize?: number;
  textAlign?: 'center' | 'left' | 'right';
  _source?: 'manual' | 'business' | 'journey' | 'investment' | 'workflow';
  _platform?: string;
  _originalUrl?: string;
}

interface CarouselSocialMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTitle: string;
  targetSiteId: string;
  onAddSlideDirectly: (slide: SocialImportedSlide) => Promise<boolean | void>;
  onPopulateInEditor?: (slideData: Partial<SocialImportedSlide>) => void;
}

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: 'fab fa-tiktok', color: '#000000', badge: '#ff0050', placeholder: 'https://www.tiktok.com/@username/video/...' },
  { id: 'instagram', name: 'Instagram', icon: 'fab fa-instagram', color: '#e1306c', badge: '#c13584', placeholder: 'https://www.instagram.com/reel/... or /p/...' },
  { id: 'youtube', name: 'YouTube', icon: 'fab fa-youtube', color: '#ff0000', badge: '#cc0000', placeholder: 'https://youtu.be/... or youtube.com/watch?v=... or /shorts/...' },
  { id: 'facebook', name: 'Facebook', icon: 'fab fa-facebook', color: '#1877f2', badge: '#0d65d9', placeholder: 'https://www.facebook.com/watch/?v=... or fb.watch/...' },
  { id: 'vimeo', name: 'Vimeo', icon: 'fab fa-vimeo-v', color: '#1ab7ea', badge: '#1596c0', placeholder: 'https://vimeo.com/...' },
  { id: 'twitter', name: 'X / Twitter', icon: 'fab fa-x-twitter', color: '#0f1419', badge: '#000000', placeholder: 'https://x.com/.../status/...' },
  { id: 'pinterest', name: 'Pinterest', icon: 'fab fa-pinterest', color: '#e60023', badge: '#bd081c', placeholder: 'https://pinterest.com/pin/...' },
  { id: 'direct_video', name: 'Direct Video', icon: 'fas fa-file-video', color: '#059669', badge: '#047857', placeholder: 'https://.../video.mp4, .webm, Cloudinary URL' },
];

export default function CarouselSocialMediaModal({
  isOpen,
  onClose,
  targetTitle,
  targetSiteId,
  onAddSlideDirectly,
  onPopulateInEditor,
}: CarouselSocialMediaModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoImportResult | null>(null);

  // Form customization overrides
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customCaption, setCustomCaption] = useState('');
  const [customCtaText, setCustomCtaText] = useState('');
  const [customCtaLink, setCustomCtaLink] = useState('');
  const [slideType, setSlideType] = useState<'image' | 'youtube' | 'video'>('image');

  // Detect platform as user types
  const detectedPlatform = React.useMemo(() => {
    if (!url) return null;
    const clean = url.toLowerCase();
    return PLATFORMS.find(p => {
      if (p.id === 'tiktok' && clean.includes('tiktok.com')) return true;
      if (p.id === 'instagram' && (clean.includes('instagram.com') || clean.includes('instagr.am'))) return true;
      if (p.id === 'youtube' && (clean.includes('youtube.com') || clean.includes('youtu.be'))) return true;
      if (p.id === 'facebook' && (clean.includes('facebook.com') || clean.includes('fb.watch') || clean.includes('fb.com'))) return true;
      if (p.id === 'vimeo' && clean.includes('vimeo.com')) return true;
      if (p.id === 'twitter' && (clean.includes('twitter.com') || clean.includes('x.com'))) return true;
      if (p.id === 'pinterest' && (clean.includes('pinterest.com') || clean.includes('pin.it'))) return true;
      if (p.id === 'direct_video' && (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(clean) || clean.includes('/video/upload/') || clean.includes('res.cloudinary.com'))) return true;
      return false;
    }) || null;
  }, [url]);

  const handleImport = async (targetUrl?: string) => {
    const toImport = (targetUrl || url).trim();
    if (!toImport) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/siwify/social-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: toImport }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to extract video information.');
      } else {
        setResult(data);
        setCustomTitle(data.suggested_slide?.title || data.title || '');
        setCustomSubtitle(data.suggested_slide?.subtitle || '');
        setCustomCaption(data.suggested_slide?.caption || `${data.platformLabel?.toUpperCase()} MEDIA`);
        setCustomCtaText(data.suggested_slide?.ctaText || 'Explore');
        setCustomCtaLink(data.suggested_slide?.ctaLink || toImport);
        setSlideType(data.suggested_slide?.type || (data.platform === 'youtube' ? 'youtube' : 'image'));
      }
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.startsWith('http')) {
          setUrl(text);
          handleImport(text);
        }
      }
    } catch { /* clipboard permission rejected */ }
  };

  const handleAddDirect = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const slide: SocialImportedSlide = {
        id: `slide_social_${Date.now()}`,
        title: customTitle || result.title,
        subtitle: customSubtitle || result.suggested_slide.subtitle,
        caption: customCaption || result.suggested_slide.caption,
        mediaUrl: slideType === 'youtube' ? result.originalUrl : (result.videoUrl || result.thumbnail || result.suggested_slide.mediaUrl),
        type: slideType,
        ctaText: customCtaText || result.suggested_slide.ctaText,
        ctaLink: customCtaLink || result.suggested_slide.ctaLink,
        displayOrder: 0,
        imageFit: 'cover',
        imagePosition: 'center',
        bgColor: '#000000',
        overlayOpacity: 0.4,
        animation: 'kenburns',
        titleColor: '#FFFFFF',
        titleSize: 0,
        subtitleSize: 0,
        textAlign: 'center',
        _source: 'business',
        _platform: result.platform,
        _originalUrl: result.originalUrl,
      };

      await onAddSlideDirectly(slide);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to add slide to carousel');
    } finally {
      setSaving(false);
    }
  };

  const handlePopulateForm = () => {
    if (!result || !onPopulateInEditor) return;
    onPopulateInEditor({
      title: customTitle || result.title,
      subtitle: customSubtitle || result.suggested_slide.subtitle,
      caption: customCaption || result.suggested_slide.caption,
      mediaUrl: slideType === 'youtube' ? result.originalUrl : (result.videoUrl || result.thumbnail || result.suggested_slide.mediaUrl),
      type: slideType,
      ctaText: customCtaText || result.suggested_slide.ctaText,
      ctaLink: customCtaLink || result.suggested_slide.ctaLink,
      _platform: result.platform,
      _originalUrl: result.originalUrl,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '24px', width: '100%',
        maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
      }}>
        {/* HEADER */}
        <div style={{
          padding: '1.5rem 1.75rem', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderTopLeftRadius: '23px', borderTopRightRadius: '23px', color: '#ffffff',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📲</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.3px', color: '#ffffff' }}>
                Import Social Media Video to Carousel
              </h2>
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Adding slide to: <strong style={{ color: '#D4AF37' }}>{targetTitle}</strong> (`{targetSiteId}`)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff',
              width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
              transition: 'background 0.2s',
            }}
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* SUPPORTED PLATFORMS BADGES */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '0.5rem' }}>
              SUPPORTED MEDIA NETWORKS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {PLATFORMS.map(p => {
                const isSelected = detectedPlatform?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (!url) {
                        setUrl(p.placeholder.split(' ')[0]);
                      }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: '5px 11px', borderRadius: '50px', fontSize: '0.75rem',
                      fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                      background: isSelected ? p.color : '#f8fafc',
                      color: isSelected ? '#ffffff' : '#475569',
                      border: `1px solid ${isSelected ? p.color : '#e2e8f0'}`,
                      boxShadow: isSelected ? '0 4px 10px rgba(0,0,0,0.15)' : 'none',
                    }}
                  >
                    <i className={p.icon} style={{ color: isSelected ? '#ffffff' : p.color }} />
                    <span>{p.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* INPUT BAR */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
              PASTE VIDEO OR POST LINK
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="url"
                  value={url}
                  onChange={e => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleImport()}
                  placeholder={detectedPlatform?.placeholder || 'Paste TikTok, Instagram Reel, YouTube, Facebook, or video link…'}
                  style={{
                    width: '100%', padding: '0.85rem 1rem', paddingRight: '2.5rem',
                    borderRadius: '12px', border: `2px solid ${detectedPlatform ? detectedPlatform.color : '#cbd5e1'}`,
                    outline: 'none', fontSize: '0.88rem', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                />
                {url && (
                  <button
                    onClick={() => { setUrl(''); setResult(null); setError(null); }}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handlePasteClipboard}
                title="Paste from clipboard"
                style={{
                  padding: '0.85rem 1rem', borderRadius: '12px',
                  background: '#f1f5f9', border: '1px solid #cbd5e1',
                  color: '#334155', fontWeight: 800, fontSize: '0.85rem',
                  cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                📋 Paste
              </button>

              <button
                type="button"
                onClick={() => handleImport()}
                disabled={loading || !url.trim()}
                style={{
                  padding: '0.85rem 1.4rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#ffffff', border: 'none', fontWeight: 900, fontSize: '0.88rem',
                  cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !url.trim() ? 0.6 : 1,
                  whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
                }}
              >
                {loading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-bolt" />}
                <span>{loading ? 'Fetching...' : 'Extract Media'}</span>
              </button>
            </div>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div style={{
              padding: '0.85rem 1rem', borderRadius: '12px',
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#991b1b', fontSize: '0.82rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <i className="fas fa-exclamation-triangle" />
              <span>{error}</span>
            </div>
          )}

          {/* RESULT PREVIEW & CUSTOMIZATION FORM */}
          {result && (
            <div style={{
              background: '#f8fafc', borderRadius: '18px', border: '1px solid #e2e8f0',
              padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
            }}>
              {/* Media Card */}
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {result.thumbnail && (
                  <div style={{ position: 'relative', width: '180px', height: '110px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute', top: '8px', left: '8px',
                      background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 8px',
                      borderRadius: '50px', fontSize: '0.65rem', fontWeight: 800,
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <span>{result.platformIcon}</span>
                      <span>{result.platformLabel}</span>
                    </div>
                  </div>
                )}

                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{
                      background: '#dbeafe', color: '#1e40af', padding: '2px 8px',
                      borderRadius: '50px', fontSize: '0.7rem', fontWeight: 800,
                    }}>
                      ✅ Extracted from {result.platformLabel}
                    </span>
                    {result.author && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>by @{result.author}</span>
                    )}
                  </div>
                  <h4 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                    {result.title}
                  </h4>
                  <a
                    href={result.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'underline', wordBreak: 'break-all' }}
                  >
                    {result.originalUrl}
                  </a>
                </div>
              </div>

              {/* SLIDE DETAILS CUSTOMIZATION */}
              <div style={{
                background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0',
                padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
              }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                    SLIDE DISPLAY FORMAT
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[
                      { id: 'image', label: '🖼️ Animated Image Slide (Fast, Ultra-Reliable)', desc: 'Plays Ken-Burns motion with direct link' },
                      ...(result.platform === 'youtube' ? [{ id: 'youtube', label: '▶️ Native YouTube Player Slide', desc: 'Streams HD video seamlessly' }] : []),
                      ...(result.platform === 'direct_video' ? [{ id: 'video', label: '🎥 HTML5 Video Slide', desc: 'Autoplays background video' }] : []),
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSlideType(t.id as any)}
                        style={{
                          padding: '0.6rem 1rem', borderRadius: '8px', border: '2px solid',
                          borderColor: slideType === t.id ? '#D4AF37' : '#e2e8f0',
                          background: slideType === t.id ? 'rgba(212,175,55,0.08)' : '#ffffff',
                          color: slideType === t.id ? '#1a1000' : '#475569',
                          fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                    SLIDE TITLE
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                    SUBTITLE
                  </label>
                  <input
                    type="text"
                    value={customSubtitle}
                    onChange={e => setCustomSubtitle(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                    BADGE / CAPTION
                  </label>
                  <input
                    type="text"
                    value={customCaption}
                    onChange={e => setCustomCaption(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                    CTA BUTTON TEXT
                  </label>
                  <input
                    type="text"
                    value={customCtaText}
                    onChange={e => setCustomCtaText(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                    CTA DESTINATION LINK (Clicking slide will open)
                  </label>
                  <input
                    type="text"
                    value={customCtaLink}
                    onChange={e => setCustomCtaLink(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {onPopulateInEditor && (
                  <button
                    type="button"
                    onClick={handlePopulateForm}
                    style={{
                      padding: '0.75rem 1.25rem', borderRadius: '10px',
                      background: '#f1f5f9', border: '1px solid #cbd5e1',
                      color: '#0f172a', fontWeight: 800, fontSize: '0.85rem',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    ✏️ Customize in Slide Editor
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAddDirect}
                  disabled={saving}
                  style={{
                    padding: '0.75rem 1.75rem', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: '#ffffff', border: 'none', fontWeight: 900, fontSize: '0.88rem',
                    cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(217,119,6,0.3)',
                  }}
                >
                  {saving ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-plus-circle" />}
                  <span>{saving ? 'Adding to Carousel...' : '⚡ Add Directly to Carousel'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
