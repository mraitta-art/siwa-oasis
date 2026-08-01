import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Helper to get period filter SQL
function getPeriodFilter(period: string): { where: string; groupFormat: string } {
  switch (period) {
    case 'today':
      return { where: "created_at >= CURDATE()", groupFormat: "DATE_FORMAT(created_at, '%H:00')" };
    case '7d':
      return { where: "created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)", groupFormat: "DATE_FORMAT(created_at, '%Y-%m-%d')" };
    case '30d':
      return { where: "created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)", groupFormat: "DATE_FORMAT(created_at, '%Y-%m-%d')" };
    case '90d':
      return { where: "created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)", groupFormat: "DATE_FORMAT(created_at, '%Y-%m-%W')" };
    default:
      return { where: "created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)", groupFormat: "DATE_FORMAT(created_at, '%Y-%m-%d')" };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    const { where, groupFormat } = getPeriodFilter(period);

    // 1. Total hits & unique visitors
    const [summary] = await query<{ total_hits: number; unique_visitors: number; avg_duration: number }>(
      `SELECT
        COUNT(*) as total_hits,
        COUNT(DISTINCT session_id) as unique_visitors,
        COALESCE(AVG(duration_ms), 0) as avg_duration
       FROM page_views WHERE ${where}`,
      []
    ).then(r => r.length ? r : [{ total_hits: 0, unique_visitors: 0, avg_duration: 0 }]);

    // 2. Previous period for comparison
    let prevWhere = '';
    switch (period) {
      case 'today': prevWhere = "created_at >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND created_at < CURDATE()"; break;
      case '7d': prevWhere = "created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)"; break;
      case '30d': prevWhere = "created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)"; break;
      case '90d': prevWhere = "created_at >= DATE_SUB(NOW(), INTERVAL 180 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)"; break;
      default: prevWhere = "created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)";
    }
    const [prevSummary] = await query<{ total_hits: number; unique_visitors: number }>(
      `SELECT COUNT(*) as total_hits, COUNT(DISTINCT session_id) as unique_visitors FROM page_views WHERE ${prevWhere}`, []
    ).then(r => r.length ? r : [{ total_hits: 0, unique_visitors: 0 }]);

    // 3. Traffic over time (chart data)
    const trafficChart = await query<{ label: string; hits: number; visitors: number }>(
      `SELECT ${groupFormat} as label, COUNT(*) as hits, COUNT(DISTINCT session_id) as visitors
       FROM page_views WHERE ${where}
       GROUP BY label ORDER BY MIN(created_at) ASC`,
      []
    );

    // 4. Top pages
    const topPages = await query<{ page_path: string; page_type: string; hits: number; visitors: number }>(
      `SELECT page_path, page_type, COUNT(*) as hits, COUNT(DISTINCT session_id) as visitors
       FROM page_views WHERE ${where}
       GROUP BY page_path, page_type ORDER BY hits DESC LIMIT 15`,
      []
    );

    // 5. Top businesses (only business page views)
    const topBusinesses = await query<{ business_id: string; hits: number; visitors: number }>(
      `SELECT business_id, COUNT(*) as hits, COUNT(DISTINCT session_id) as visitors
       FROM page_views WHERE ${where} AND business_id IS NOT NULL
       GROUP BY business_id ORDER BY hits DESC LIMIT 10`,
      []
    );

    // Enrich with business names
    let enrichedBusinesses: any[] = [];
    if (topBusinesses.length > 0) {
      const ids = topBusinesses.map(b => b.business_id);
      const placeholders = ids.map(() => '?').join(',');
      try {
        const businesses = await query<{ id: string; name: string; slug: string }>(
          `SELECT id, name, slug FROM businesses WHERE id IN (${placeholders})`, ids
        );
        const nameMap = new Map(businesses.map(b => [b.id, b]));
        enrichedBusinesses = topBusinesses.map(tb => ({
          ...tb,
          name: nameMap.get(tb.business_id)?.name || 'Unknown',
          slug: nameMap.get(tb.business_id)?.slug || '',
        }));
      } catch {
        enrichedBusinesses = topBusinesses.map(tb => ({ ...tb, name: 'Unknown', slug: '' }));
      }
    }

    // 6. Device breakdown
    const devices = await query<{ device_type: string; count: number }>(
      `SELECT device_type, COUNT(*) as count FROM page_views WHERE ${where} GROUP BY device_type ORDER BY count DESC`,
      []
    );

    // 7. Referrer sources
    const referrers = await query<{ source: string; count: number }>(
      `SELECT
        CASE
          WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
          WHEN referrer LIKE '%google%' THEN 'Google'
          WHEN referrer LIKE '%facebook%' OR referrer LIKE '%fb.%' THEN 'Facebook'
          WHEN referrer LIKE '%instagram%' THEN 'Instagram'
          WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'Twitter/X'
          WHEN referrer LIKE '%youtube%' THEN 'YouTube'
          WHEN referrer LIKE '%tiktok%' THEN 'TikTok'
          WHEN referrer LIKE '%whatsapp%' THEN 'WhatsApp'
          WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
          ELSE 'Other'
        END as source,
        COUNT(*) as count
       FROM page_views WHERE ${where}
       GROUP BY source ORDER BY count DESC`,
      []
    );

    // 8. Page type breakdown
    const pageTypes = await query<{ page_type: string; count: number }>(
      `SELECT page_type, COUNT(*) as count FROM page_views WHERE ${where} GROUP BY page_type ORDER BY count DESC`,
      []
    );

    return NextResponse.json({
      success: true,
      period,
      summary: {
        totalHits: summary.total_hits,
        uniqueVisitors: summary.unique_visitors,
        avgDuration: Math.round(summary.avg_duration),
        prevHits: prevSummary.total_hits,
        prevVisitors: prevSummary.unique_visitors,
      },
      trafficChart,
      topPages,
      topBusinesses: enrichedBusinesses,
      devices,
      referrers,
      pageTypes,
    });
  } catch (err: any) {
    console.error('[Analytics Stats Error]', err.message);
    return NextResponse.json({
      success: false,
      error: err.message,
      summary: { totalHits: 0, uniqueVisitors: 0, avgDuration: 0, prevHits: 0, prevVisitors: 0 },
      trafficChart: [],
      topPages: [],
      topBusinesses: [],
      devices: [],
      referrers: [],
      pageTypes: [],
    });
  }
}
