import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { sectionAppliesToMarket } from '@/lib/section-registry';
import { businessPublicPath } from '@/lib/public-url';

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
      `SELECT b.id, b.name, b.slug, b.type_id, b.market_id, b.url_style, b.custom_data, bt.name as type_name, bt.icon
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
    let sectionQuery = `SELECT s.id, s.name, s.name_ar, s.icon, s.is_universal, s.options 
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
    const rawSections: any[] = await query(sectionQuery, sectionParams);
    // Comparison only ever lines a market's own pages up beside each other, so a
    // section another market switched on for itself is not offered as a column.
    const marketsInPlay = [...new Set(businesses.map(b => String(b.market_id || '')).filter(Boolean))];
    const sections: any[] = rawSections.filter(section =>
      marketsInPlay.length === 0 || marketsInPlay.some(market => sectionAppliesToMarket(section, market))
    );

    // 3. Get comparable fields
    // `form_fields` records the flag as `searchable` and has no `is_filterable`; the
    // old names made this whole query throw, so a comparison never returned a field.
    // Only a field an editor marked `is_comparable` becomes a row: a price per night
    // and a price per m² are not the same number and must not be lined up.
    const fieldsQuery = `
      SELECT DISTINCT 
        ff.id, ff.section_id, ff.name, ff.label, ff.label_ar, ff.field_type,
        ff.searchable AS is_searchable, ff.is_comparable,
        s.name as section_name, s.name_ar as section_name_ar
      FROM form_fields ff
      LEFT JOIN sections s ON ff.section_id = s.id
      WHERE ff.section_id IN (${sections.map(() => '?').join(',')})
        AND ff.is_comparable = 1
      ORDER BY ff.section_id, ff.sort_order ASC
    `;
    const fields: any[] = sections.length ? await query(fieldsQuery, sections.map(s => s.id)) : [];

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
              labelAr: field.label_ar || null,
              value: displayValue,
              rawValue: value,
              type: field.field_type,
              isSearchable: field.is_searchable,
              isComparable: field.is_comparable,
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
          slug: biz.slug,
          // The address is built server-side: a listing's URL style (flat or
          // market-prefixed) is a property of the row, not of this endpoint.
          publicPath: businessPublicPath(biz),
          typeName: biz.type_name,
          typeIcon: biz.icon,
          sections: sectionsData,
        };
      } catch (e) {
        console.error(`Error parsing custom_data for business ${biz.id}:`, e);
        return {
          id: biz.id,
          name: biz.name,
          slug: biz.slug,
          publicPath: businessPublicPath(biz),
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
        nameAr: s.name_ar || null,
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
