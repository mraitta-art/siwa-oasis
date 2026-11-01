'use client';

import { useEffect, useState } from 'react';

/**
 * Copy the current compare URL to the clipboard.
 *
 * Every compare route (`/compare/projects`, `/compare/units`, `/compare/stays`,
 * `/compare/markets`) keeps its shortlist in `?ids=…` and its filter in
 * `?kind=…`, so the URL *is* the saved state. The share button turns that into
 * one click for the visitor — they paste it into WhatsApp or an email and the
 * receiver opens the exact same table.
 *
 * The button reads `window.location.href` at click time, not at render time,
 * because the URL mutates as the picker ticks boxes. On SSR the button renders
 * disabled so we never ship a "copy" action that would resolve to a stale path.
 *
 * Feedback is a two-second "Copied" state — the clipboard write itself has no
 * observable end, and a bare `navigator.clipboard.writeText` fails silently on
 * non-HTTPS or on permission-denied, so we swallow that into a "Copied?" label
 * and let the visitor retry.
 */

const L = {
  ar: {
    idle: 'انسخ رابط المقارنة',
    copied: 'تم النسخ ✓',
    failed: 'تعذّر النسخ — انسخ الرابط يدويًا',
  },
  en: {
    idle: 'Copy compare link',
    copied: 'Copied ✓',
    failed: 'Copy failed — copy the URL manually',
  },
} as const;

export default function CompareShareButton({ ar = false }: { ar?: boolean }) {
  const t = L[ar ? 'ar' : 'en'];
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [mounted, setMounted] = useState(false);

  // The click handler can only run in the browser. On the server the button
  // renders but is visually muted so it does not promise an action the page
  // cannot deliver until hydration completes.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (state === 'idle') return;
    const id = setTimeout(() => setState('idle'), 2200);
    return () => clearTimeout(id);
  }, [state]);

  const onClick = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (!url) {
        setState('failed');
        return;
      }
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        setState('copied');
        return;
      }
      // Fallback path for browsers without async clipboard (older Safari
      // private mode, some embedded webviews). Uses a temporary textarea +
      // document.execCommand. It is deprecated but still functional, and it
      // is better than a broken button on the smallest segment of traffic.
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      setState(ok ? 'copied' : 'failed');
    } catch {
      setState('failed');
    }
  };

  const accent = state === 'copied' ? '#0F4C81' : state === 'failed' ? '#B45309' : '#475569';
  const bg = state === 'copied' ? '#E8F1F8' : '#FFFFFF';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!mounted}
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.4rem 0.8rem',
        borderRadius: 999,
        border: `1px solid ${state === 'idle' ? '#E2E8F0' : accent}`,
        background: bg,
        color: accent,
        fontSize: '0.75rem',
        fontWeight: 900,
        cursor: mounted ? 'pointer' : 'default',
        opacity: mounted ? 1 : 0.6,
      }}
    >
      <span aria-hidden="true">{state === 'copied' ? '🔗✓' : '🔗'}</span>
      <span>{state === 'copied' ? t.copied : state === 'failed' ? t.failed : t.idle}</span>
    </button>
  );
}
