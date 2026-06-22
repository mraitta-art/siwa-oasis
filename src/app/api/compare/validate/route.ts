import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

/**
 * POST /api/compare/validate
 * Checks if a group of businesses can be compared
 * 
 * Body:
 * {
 *   businessIds: string[] // ["biz-1", "biz-2"]
 * }
 * 
 * Response:
 * {
 *   canCompare: boolean,
 *   reason?: string,
 *   comparisonType: 'same-type' | 'universal-sections' | 'not-allowed',
 *   businessTypes: { id, name }[],
 *   commonSections: { id, name }[]
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessIds } = body;

    if (!businessIds || !Array.isArray(businessIds) || businessIds.length < 2) {
      return NextResponse.json({
        canCompare: false,
        reason: 'At least 2 businesses required for comparison',
        comparisonType: 'not-allowed',
        businessTypes: [],
        commonSections: [],
      });
    }

    // Fetch business types
    const placeholders = businessIds.map(() => '?').join(',');
    const businesses: any[] = await query(
      `SELECT DISTINCT b.type_id, bt.id, bt.name
       FROM businesses b
       LEFT JOIN business_types bt ON b.type_id = bt.id
       WHERE b.id IN (${placeholders}) AND b.active = 1`,
      businessIds
    );

    if (businesses.length === 0) {
      return NextResponse.json({
        canCompare: false,
        reason: 'No active businesses found',
        comparisonType: 'not-allowed',
        businessTypes: [],
        commonSections: [],
      });
    }

    // Check if all same type
    const typeIds = new Set(businesses.map(b => b.type_id));
    const isSameType = typeIds.size === 1;

    let commonSections: any[] = [];
    let comparisonType: 'same-type' | 'universal-sections' | 'not-allowed' = 'not-allowed';

    if (isSameType) {
      // Same type: get all sections for this type
      const typeId = Array.from(typeIds)[0];
      commonSections = await query(
        `SELECT id, name, icon, is_universal FROM sections 
         WHERE active = 1 
         AND (is_universal = 1 OR business_type_id = ?)
         ORDER BY display_order ASC`,
        [typeId]
      );
      comparisonType = 'same-type';
    } else {
      // Mixed types: get only universal sections (Vibe, Experience, Investment Opportunity)
      commonSections = await query(
        `SELECT id, name, icon, is_universal FROM sections 
         WHERE active = 1 AND is_universal = 1
         ORDER BY display_order ASC`
      );
      
      // Allow mixed types only if there are universal sections
      if (commonSections.length > 0) {
        comparisonType = 'universal-sections';
      }
    }

    return NextResponse.json({
      canCompare: commonSections.length > 0,
      reason: commonSections.length === 0 
        ? 'No comparable sections available' 
        : undefined,
      comparisonType,
      businessTypes: businesses.map(b => ({ id: b.id, name: b.name })),
      commonSections: commonSections.map(s => ({ 
        id: s.id, 
        name: s.name, 
        icon: s.icon,
        isUniversal: s.is_universal 
      })),
    });
  } catch (error: any) {
    console.error('Comparison Validation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Validation failed' },
      { status: 500 }
    );
  }
}
