import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * VENDOR STORYTELLER API
 * Handles the merging of DNA Blueprint structure with actual Business Content.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.businessId) {
      return NextResponse.json({ error: 'No business linked to this account' }, { status: 404 });
    }

    // 1. Fetch Business and its Typology
    const business = (await query('SELECT * FROM businesses WHERE id = ?', [user.businessId])) as any[];
    if (business.length === 0) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    const biz = business[0];

    // 2. Fetch full typology chain (child → parent)
    const typesToFetch: string[] = [];
    let currentTypeId = biz.type_id;
    let childType: any = null;
    let parentType: any = null;

    while (currentTypeId) {
      const typeRes = (await query(
        'SELECT id, name, icon, icon_color, parent_id, is_parent FROM business_types WHERE id = ?',
        [currentTypeId]
      )) as any[];
      if (typeRes.length === 0) break;
      const t = typeRes[0];
      typesToFetch.push(t.id);
      if (!childType) childType = t;          // first iteration = the direct typology
      if (!t.parent_id) parentType = t;       // no parent = this IS the parent
      else {
        // look up the parent info
        const pRes = (await query(
          'SELECT id, name, icon, icon_color FROM business_types WHERE id = ?',
          [t.parent_id]
        )) as any[];
        if (pRes.length > 0) parentType = pRes[0];
      }
      currentTypeId = t.parent_id;
    }
    // Always include the SECTION_TEMPLATE for universal DNA
    typesToFetch.push('SECTION_TEMPLATE');

    // 3. Fetch the Form Fields (The Structure/DNA)
    const fields = (await query(
      'SELECT f.*, s.name as section_name, s.icon as section_icon ' +
      'FROM form_fields f ' +
      'JOIN sections s ON f.section_id = s.id ' +
      'WHERE f.business_type_id IN (?) ' +
      'ORDER BY s.sort_order ASC, f.sort_order ASC',
      [typesToFetch]
    )) as any[];

    // 4. Parse custom_data
    const currentData = biz.custom_data ? (typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data) : {};

    // 5. Group fields by section for the UI
    const sections: Record<string, any> = {};
    fields.forEach(f => {
      if (!sections[f.section_id]) {
        sections[f.section_id] = {
          id: f.section_id,
          name: f.section_name,
          icon: f.section_icon,
          fields: []
        };
      }
      
      // Merge current value into field definition
      const value = currentData[f.section_id]?.[f.name] || '';
      sections[f.section_id].fields.push({
        ...f,
        value,
        options: f.options ? (typeof f.options === 'string' ? JSON.parse(f.options) : f.options) : null
      });
    });

    // 6. Fetch Tier Features
    const tierResult = (await query('SELECT features FROM subscription_tiers WHERE id = ?', [biz.subscription_tier])) as any[];
    const tierFeatures = tierResult.length > 0 ? (typeof tierResult[0].features === 'string' ? JSON.parse(tierResult[0].features) : tierResult[0].features) : {};

    return NextResponse.json({
      business: {
        id: biz.id,
        name: biz.name,
        type_id: biz.type_id,
        status: biz.status,
        published: biz.published,
        tier: biz.subscription_tier
      },
      // ── TYPOLOGY IDENTITY ─────────────────────────────────
      typology: {
        child: childType  ? { id: childType.id,  name: childType.name,  icon: childType.icon,  color: childType.icon_color  } : null,
        parent: parentType? { id: parentType.id, name: parentType.name, icon: parentType.icon, color: parentType.icon_color } : null,
      },
      tierFeatures,
      structure: Object.values(sections)
    });

  } catch (error) {
    console.error('Vendor API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await req.json(); // Data should be grouped by section_id

    await execute(
      'UPDATE businesses SET custom_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(data), user.businessId]
    );

    return NextResponse.json({ success: true, message: 'Story updated and live!' });

  } catch (error) {
    console.error('Vendor Update Error:', error);
    return NextResponse.json({ error: 'Failed to save changes' }, { status: 500 });
  }
}
