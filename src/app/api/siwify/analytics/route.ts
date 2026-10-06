import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';

async function ensureAnalyticsTable() {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS minisite_analytics (
        id VARCHAR(100) PRIMARY KEY,
        business_id VARCHAR(100) NOT NULL,
        slug VARCHAR(200) NOT NULL,
        utm_source VARCHAR(100) DEFAULT NULL,
        utm_medium VARCHAR(100) DEFAULT NULL,
        utm_campaign VARCHAR(100) DEFAULT NULL,
        referrer VARCHAR(500) DEFAULT NULL,
        visitor_date DATE NOT NULL,
        hit_count INT DEFAULT 1,
        UNIQUE KEY uniq_daily_source (business_id, utm_source, utm_medium, visitor_date),
        INDEX idx_biz_date (business_id, visitor_date),
        INDEX idx_slug (slug)
      )
    `);
  } catch { /* table may already exist */ }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAnalyticsTable();
    const body = await request.json();
    const { businessId, slug, utm_source, utm_medium, utm_campaign, referrer } = body;

    if (!businessId && !slug) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const id = `analytics_${businessId || slug}_${utm_source || 'direct'}_${Date.now()}`;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Upsert: increment hit count for same source on same day
    await execute(
      `INSERT INTO minisite_analytics (id, business_id, slug, utm_source, utm_medium, utm_campaign, referrer, visitor_date, hit_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE hit_count = hit_count + 1`,
      [
        id,
        businessId || '',
        slug || '',
        utm_source || 'direct',
        utm_medium || 'none',
        utm_campaign || 'minisite',
        (referrer || '').substring(0, 500),
        today
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    // Silently fail — analytics must never break the minisite
    console.error('Analytics error:', error?.message);
    return NextResponse.json({ ok: false }, { status: 200 }); // always 200
  }
}

// GET analytics summary for admin/vendor dashboard
export async function GET(request: NextRequest) {
  try {
    await ensureAnalyticsTable();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const slug = searchParams.get('slug');
    const days = Math.min(90, parseInt(searchParams.get('days') || '30'));

    if (!businessId && !slug) {
      return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
    }

    const whereClause = businessId
      ? `business_id = ? AND visitor_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`
      : `slug = ? AND visitor_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`;
    const params = [businessId || slug, days];

    const rows = await import('@/lib/db').then(({ query }) =>
      query(
        `SELECT utm_source, utm_medium, SUM(hit_count) as total_hits, visitor_date
         FROM minisite_analytics
         WHERE ${whereClause}
         GROUP BY utm_source, utm_medium, visitor_date
         ORDER BY visitor_date DESC`,
        params
      )
    );

    // Aggregate by source
    const bySource: Record<string, number> = {};
    let totalHits = 0;
    for (const row of (rows as any[])) {
      const src = row.utm_source || 'direct';
      bySource[src] = (bySource[src] || 0) + Number(row.total_hits);
      totalHits += Number(row.total_hits);
    }

    const icons: Record<string, string> = {
      instagram: '📸',
      tiktok: '🎵',
      facebook: '📘',
      twitter: '🐦',
      whatsapp: '💬',
      direct: '🔗',
      google: '🔍',
    };

    const summary = Object.entries(bySource)
      .sort(([, a], [, b]) => b - a)
      .map(([source, hits]) => ({
        source,
        hits,
        percent: totalHits > 0 ? Math.round((hits / totalHits) * 100) : 0,
        icon: icons[source.toLowerCase()] || '🌐',
      }));

    return NextResponse.json({ totalHits, bySource: summary, periodDays: days });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
