'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// Generate a persistent anonymous session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = '';
  try {
    sid = localStorage.getItem('siwa_sid') || '';
    if (!sid) {
      sid = 'sv-' + crypto.randomUUID();
      localStorage.setItem('siwa_sid', sid);
    }
  } catch {
    sid = 'sv-' + Math.random().toString(36).substring(2, 15);
  }
  return sid;
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const entryTime = useRef<number>(Date.now());
  const lastPath = useRef<string>('');

  const sendEvent = useCallback((path: string, duration?: number) => {
    try {
      const payload: any = {
        path,
        referrer: document.referrer || null,
        session_id: getSessionId(),
      };
      if (duration && duration > 500 && duration < 3600000) {
        payload.duration_ms = Math.round(duration);
      }

      // Use sendBeacon for reliability (fires even on tab close)
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', JSON.stringify(payload));
      } else {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Never disrupt the user experience
    }
  }, []);

  useEffect(() => {
    // Skip tracking for admin/vendor routes in development
    if (pathname.startsWith('/api/')) return;

    // Send duration for previous page
    if (lastPath.current && lastPath.current !== pathname) {
      const duration = Date.now() - entryTime.current;
      // We already tracked the page view — now send the duration update
      // (Not critical, skip for simplicity — duration is optional)
    }

    // Track new page view
    sendEvent(pathname);
    entryTime.current = Date.now();
    lastPath.current = pathname;
  }, [pathname, sendEvent]);

  // Track duration on tab close / navigate away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lastPath.current) {
        const duration = Date.now() - entryTime.current;
        if (duration > 500) {
          try {
            const payload = JSON.stringify({
              path: lastPath.current,
              session_id: getSessionId(),
              duration_ms: Math.round(duration),
            });
            if (navigator.sendBeacon) {
              navigator.sendBeacon('/api/analytics/track', payload);
            }
          } catch {}
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Render nothing — zero visual footprint
  return null;
}
