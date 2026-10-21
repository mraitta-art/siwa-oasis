'use client';

import React, { useEffect, useState } from 'react';

interface CRMAnnouncement {
  id: string;
  kind: 'ribbon' | 'news';
  title_ar: string;
  title_en?: string | null;
  body_ar: string;
  body_en?: string | null;
  cta_text_ar?: string | null;
  cta_text_en?: string | null;
  cta_url?: string | null;
  published_at: string;
}

export default function VendorCRMAnnouncements({ businessId }: { businessId: string }) {
  const [announcements, setAnnouncements] = useState<CRMAnnouncement[]>([]);

  useEffect(() => {
    if (!businessId) return;
    const controller = new AbortController();
    fetch(`/api/vendor/crm-announcements?businessId=${encodeURIComponent(businessId)}`, { signal: controller.signal })
      .then(async response => {
        if (response.status === 401 || response.status === 403) return { announcements: [] };
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load announcements.');
        return data;
      })
      .then(data => setAnnouncements(data.announcements || []))
      .catch(error => {
        if (error.name !== 'AbortError') console.error('Failed to load CRM announcements:', error);
      });
    return () => controller.abort();
  }, [businessId]);

  if (!announcements.length) return null;
  return (
    <section aria-label="Group announcements" style={{ display: 'grid', gap: '0.75rem', margin: '1rem 0' }}>
      {announcements.map(announcement => (
        <article key={announcement.id} style={{
          background: announcement.kind === 'ribbon' ? 'linear-gradient(135deg, #fff8e6, #ffffff)' : '#f8fafc',
          border: `1px solid ${announcement.kind === 'ribbon' ? '#f2d38b' : '#dbe3ee'}`,
          borderRight: `4px solid ${announcement.kind === 'ribbon' ? '#d4af37' : '#2563eb'}`,
          borderRadius: 12,
          padding: '0.9rem 1rem',
        }}>
          <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 900, letterSpacing: 1, marginBottom: 4 }}>
            {announcement.kind === 'ribbon' ? 'تنبيه للمجموعة' : 'أخبار الشركاء'}
          </div>
          <h2 style={{ margin: '0 0 0.35rem', color: '#0f172a', fontSize: '1rem', fontWeight: 900 }}>{announcement.title_ar}</h2>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.84rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{announcement.body_ar}</p>
          {announcement.cta_url && announcement.cta_text_ar && (
            <a
              href={announcement.cta_url}
              target={announcement.cta_url.startsWith('http') ? '_blank' : undefined}
              rel={announcement.cta_url.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{ display: 'inline-block', marginTop: '0.65rem', color: '#1d4ed8', fontWeight: 800, fontSize: '0.8rem' }}
            >
              {announcement.cta_text_ar}
            </a>
          )}
        </article>
      ))}
    </section>
  );
}
