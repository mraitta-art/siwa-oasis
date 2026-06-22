import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';

/**
 * POST /api/compare/businesses
 * Compare multiple businesses side-by-side by their section data
 * 
 * Body:
 * {
 *   businessIds: string[],           // ["biz-1", "biz-2", "biz-3"]
 *   sectionIds?: string[]            // Optional: limit to specific sections
 * }
 * 
 * Response:
 * {
 *   businesses: [
 *     {
 *       id, name, type_name, icon,
 *       sections: {
 *         "pricing": { fields with values },
 *         "amenities": { fields with values }
 *       }
 *     },
 *     ...
 *   ],
 *   sections: [
 *     { id, name, icon, is_comparable }
 *   ],
 *   fields: [
 *     { section_id, name, label, type }
 *   ]
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessIds, sectionIds, allowMixedTypes } = body;

    if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid businessIds' },
        { status: 400 }
      );
    }

    if (businessIds.length > 10) {
      return NextResponse.json(
        { error: 'Cannot compare more than 10 businesses' },
        { status: 400 }
      );
    }

    // 1. Fetch all businesses with their basic info
    const placeholders = businessIds.map(() => '?').join(',');
    const businesses: any[] = await query(
      `SELECT b.id, b.name, b.type_id, b.custom_data, bt.name as type_name, bt.icon
       FROM businesses b
       LEFT JOIN business_types bt ON b.type_id = bt.id
       WHERE b.id IN (${placeholders}) AND b.active = 1`,
      businessIds
    );

    if (businesses.length === 0) {
      return NextResponse.json(
        { error: 'No active businesses found with provided IDs' },
        { status: 404 }
      );
    }

    // 2. VALIDATION: Check if all businesses are same type OR allow mixed types with common sections
    const businessTypes = new Set(businesses.map(b => b.type_id));
    const isSameType = businessTypes.size === 1;

    if (!isSameType && !allowMixedTypes) {
      // Get type names for better error message
      const typeNames = Array.from(businessTypes)
        .map(typeId => businesses.find(b => b.type_id === typeId)?.type_name)
        .join(', ');

      return NextResponse.json(
        { 
          error: 'Cannot compare businesses of different types',
          detail: `Found types: ${typeNames}. Use common sections (Vibe, Experience) or select businesses of same type.`,
          typesFound: Array.from(businessTypes)
        },
        { status: 400 }
      );
    }

    // 3. Get comparable sections
    // Strategy: If same type, get all sections for that type
    //           If mixed types, only get universal/common sections (Vibe, Experience, Investment Opportunity)
    let sectionQuery = `SELECT s.id, s.name, s.icon, s.is_universal 
                        FROM sections s 
                        WHERE s.active = 1`;
    let sectionParams: any[] = [];

    if (isSameType) {
      // Same type: get all sections for this business type
      const typeId = Array.from(businessTypes)[0];
      sectionQuery += ` AND (s.is_universal = 1 OR s.business_type_id = ?)`;
      sectionParams = [typeId];
    } else {
      // Mixed types: only universal sections (Vibe, Experience, Investment Opportunity)
      sectionQuery += ` AND s.is_universal = 1`;
    }

    if (sectionIds && Array.isArray(sectionIds) && sectionIds.length > 0) {
      const sectionPlaceholders = sectionIds.map(() => '?').join(',');
      sectionQuery += ` AND s.id IN (${sectionPlaceholders})`;
      sectionParams.push(...sectionIds);
    }

    sectionQuery += ` ORDER BY s.display_order ASC`;
    const sections: any[] = await query(sectionQuery, sectionParams);

    // 3. Get comparable fields (mark as is_comparable, is_searchable, etc.)
    const fieldsQuery = `
      SELECT DISTINCT 
        ff.id, ff.section_id, ff.name, ff.label, ff.field_type,
        ff.is_searchable, ff.is_filterable,
        s.name as section_name
      FROM form_fields ff
      LEFT JOIN sections s ON ff.section_id = s.id
      WHERE ff.section_id IN (${sections.map(() => '?').join(',')})
      ORDER BY ff.section_id, ff.sort_order ASC
    `;
    const fields: any[] = await query(fieldsQuery, sections.map(s => s.id));

    // 4. Extract section data from each business
    const formattedBusinesses = businesses.map(biz => {
      try {
        const customData = typeof biz.custom_data === 'string' 
          ? JSON.parse(biz.custom_data) 
          : (biz.custom_data || {});

        // Build sections object - only for requested sections
        const sectionsData: Record<string, any> = {};

        for (const section of sections) {
          const sectionId = section.id;
          const sectionFields = fields.filter(f => f.section_id === sectionId);

          if (sectionFields.length === 0) {
            sectionsData[sectionId] = { name: section.name, fields: {} };
            continue;
          }

          const fieldValues: Record<string, any> = {};
          const sectionCustomData = customData[sectionId] || {};

          // Extract field values for this section
          for (const field of sectionFields) {
            const value = sectionCustomData[field.name];
            
            // Format value based on type
            let displayValue = value;
            if (value === null || value === undefined) {
              displayValue = '—';
            } else if (typeof value === 'object') {
              displayValue = Array.isArray(value) ? value.join(', ') : JSON.stringify(value);
            } else if (typeof value === 'boolean') {
              displayValue = value ? '✓ Yes' : '✗ No';
            }

            fieldValues[field.name] = {
              label: field.label || field.name,
              value: displayValue,
              rawValue: value,
              type: field.field_type,
              isSearchable: field.is_searchable,
              isFilterable: field.is_filterable,
            };
          }

          sectionsData[sectionId] = {
            name: section.name,
            icon: section.icon,
            fields: fieldValues,
          };
        }

        return {
          id: biz.id,
          name: biz.name,
          typeName: biz.type_name,
          typeIcon: biz.icon,
          sections: sectionsData,
        };
      } catch (e) {
        console.error(`Error parsing custom_data for business ${biz.id}:`, e);
        return {
          id: biz.id,
          name: biz.name,
          typeName: biz.type_name,
          typeIcon: biz.icon,
          sections: {},
        };
      }
    });

    // 5. Return comparison data
    return NextResponse.json({
      success: true,
      businesses: formattedBusinesses,
      sections: sections.map(s => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
      })),
      fieldCount: fields.length,
      comparisonCount: formattedBusinesses.length,
      comparisonType: isSameType ? 'same-type' : 'universal-sections',
      businessTypes: Array.from(businessTypes),
    });
  } catch (error: any) {
    console.error('Comparison Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compare businesses' },
      { status: 500 }
    );
  }
}
