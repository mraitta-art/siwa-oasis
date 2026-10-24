/**
 * Minisite tap beacon (browser-only, side-effect free).
 *
 * A "view" proves the page was reachable. A "tap" proves the vendor's page
 * actually produced contact intent — the only number that can be sold back to
 * a vendor as value. Fire-and-forget: a failed beacon must never block the
 * WhatsApp / call / directions action it is attached to.
 */

export type TapChannel = 'whatsapp' | 'call' | 'directions' | 'email' | 'share' | 'book';

const SESSION_KEY = 'siwa_sid';

/** Same anonymous session id already used by AnalyticsTracker, so views and taps join. */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sid = window.localStorage.getItem(SESSION_KEY) || '';
    if (!sid) {
      sid = 'sv-' + (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15));
      window.localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return '';
  }
}

export function trackMinisiteTap(slug: string, channel: TapChannel, src?: string) {
  if (typeof window === 'undefined') return;
  const clean = String(slug || '').trim();
  if (!clean) return;

  const payload = JSON.stringify({
    slug: clean,
    channel,
    src: src || undefined,
    session_id: getSessionId(),
  });

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon('/api/analytics/tap', blob)) return;
    }
    void fetch('/api/analytics/tap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never throw from a tracking call */
  }
}
