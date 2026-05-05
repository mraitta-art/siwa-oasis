import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * DNA DISCOVERY SEARCH
 * Searches businesses by their 8-chapter metadata (Era, Material, Vibe, etc.)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const era = searchParams.get('era');
    const material = searchParams.get('material');
    const vibe = searchParams.get('vibe');
    const experience = searchParams.get('experience');
    const businessType = searchParams.get('type');

    let sql = `
      SELECT b.*, t.name as type_name, s.features as tier_features
      FROM businesses b
      LEFT JOIN business_types t ON b.type_id = t.id
      LEFT JOIN subscription_tiers s ON b.subscription_tier = s.id
      WHERE b.status = 'active'
    `;
    const params: any[] = [];

    if (businessType) {
      sql += " AND b.type_id = ?";
      params.push(businessType);
    }

    // JSON Filtering for DNA fields
    // Note: We use LIKE search on the JSON string for flexibility across different database types (TiDB/MySQL)
    if (era) {
      sql += " AND b.custom_data LIKE ?";
      params.push(`%${era}%`);
    }
    if (material) {
      sql += " AND b.custom_data LIKE ?";
      params.push(`%${material}%`);
    }
    if (vibe) {
      sql += " AND b.custom_data LIKE ?";
      params.push(`%${vibe}%`);
    }
    if (experience) {
      sql += " AND b.custom_data LIKE ?";
      params.push(`%${experience}%`);
    }

    // Prioritize Gold Premier members
    sql += " ORDER BY CASE WHEN b.subscription_tier = 'gold' THEN 0 ELSE 1 END, b.created_at DESC";

    const results = await query(sql, params);

    return NextResponse.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
