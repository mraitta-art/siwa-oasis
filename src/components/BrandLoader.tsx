import React from 'react';
import { BRAND_MARK_URL, BRAND_ACCENT } from '@/lib/brand-assets';

interface BrandLoaderProps {
  /** Emblem diameter in px. */
  size?: number;
  /** Golden headline, e.g. "Uploading logo…". */
  label?: string;
  /** Muted supporting line, e.g. "Keep this tab open". */
  sublabel?: string;
  /** Cover the whole viewport (route transitions, long uploads). */
  overlay?: boolean;
  /** Determinate progress 0-100; omit for an indeterminate sweep. */
  progress?: number | null;
}

const KEYFRAMES = `
  @keyframes siwifyLoaderSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes siwifyLoaderPulse {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(212,175,55,0.35)); }
    50% { transform: scale(1.05); filter: drop-shadow(0 0 28px rgba(212,175,55,0.7)); }
  }
  @keyframes siwifyLoaderSweep {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(320%); }
  }
`;

/**
 * The SiWiFy emblem used as the platform's single loading / uploading mark.
 * Slowness is communicated by the emblem itself instead of a generic spinner.
 */
export default function BrandLoader({
  size = 96,
  label,
  sublabel,
  overlay = false,
  progress = null,
}: BrandLoaderProps) {
  const determinate = typeof progress === 'number' && Number.isFinite(progress);

  const content = (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.1rem',
        padding: '1rem',
        textAlign: 'center',
      }}
    >
      <style>{KEYFRAMES}</style>

      <div style={{ position: 'relative', width: size, height: size }}>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -Math.max(6, Math.round(size * 0.09)),
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: BRAND_ACCENT,
            borderRightColor: '#F59E0B',
            animation: 'siwifyLoaderSpin 1.1s linear infinite',
          }}
        />
        <img
          src={BRAND_MARK_URL}
          alt=""
          aria-hidden="true"
          width={size}
          height={size}
          style={{
            width: size,
            height: size,
            objectFit: 'contain',
            animation: 'siwifyLoaderPulse 2s ease-in-out infinite',
          }}
        />
      </div>

      {determinate && (
        <div
          style={{
            width: Math.max(120, size * 1.6),
            height: 4,
            borderRadius: 999,
            background: 'rgba(212,175,55,0.18)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(0, progress as number))}%`,
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #B8860B, #F59E0B)',
              transition: 'width 0.25s ease',
            }}
          />
        </div>
      )}

      {label && (
        <div style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: '3px', color: BRAND_ACCENT, textTransform: 'uppercase' }}>
          {label}
        </div>
      )}
      {sublabel && (
        <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(148,163,184,0.85)' }}>
          {sublabel}
        </div>
      )}
    </div>
  );

  if (!overlay) return content;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'radial-gradient(circle at 50% 38%, #16203a 0%, #070b12 72%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {content}
    </div>
  );
}
