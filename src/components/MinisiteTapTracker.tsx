'use client';

import { useEffect } from 'react';
import { trackMinisiteTap, type TapChannel } from '@/lib/tap-track';

/**
 * One delegated click listener for the whole minisite instead of touch-ups on
 * every `tel:` / `wa.me` anchor. The contact markup exists in half a dozen
 * blocks (sticky bar, hero, booking offers, footer) and keeps changing, so
 * attaching at the document level is the only version that does not rot.
 */

function channelFor(anchor: HTMLAnchorElement): TapChannel | null {
  const href = (anchor.getAttribute('href') || '').toLowerCase().trim();
  if (!href) return null;
  if (href.startsWith('tel:')) return 'call';
  if (href.startsWith('mailto:')) return 'email';
  if (href.startsWith('https://wa.me') || href.includes('api.whatsapp.com') || href.includes('web.whatsapp.com')) return 'whatsapp';
  if (/google\.[a-z.]+\/maps|maps\.google|maps\.apple|goo\.gl\/maps/.test(href)) return 'directions';
  return null;
}

export default function MinisiteTapTracker({ slug, src }: { slug: string; src?: string }) {
  useEffect(() => {
    if (!slug) return;

    // Owner channel tag survives on the shared URL: /<slug>?src=qr|airbnb|bio
    const tagged = src || new URLSearchParams(window.location.search).get('src') || undefined;

    const handleClick = (event: MouseEvent) => {
      const node = event.target as Element | null;
      const anchor = node?.closest ? (node.closest('a') as HTMLAnchorElement | null) : null;
      if (!anchor) return;
      const channel = channelFor(anchor);
      if (channel) trackMinisiteTap(slug, channel, tagged);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [slug, src]);

  return null;
}
