import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';
import { createBusinessEntity } from '@/lib/business-creation';
import { syncManifestFromLegacyData } from '@/lib/minisite-manifest';
import { isReservedSlug } from '@/lib/market-routes';

/**
 * A listing's public URL must never move by accident. Renaming a business used
 * to rewrite its slug in the same statement, which quietly killed every QR code
 * already printed with the old address. A slug now changes only when an admin
 * sends one explicitly, and only into a namespace where it is still free.
 */
async function planSlugChange(id: string, requested: string, nextStyle?: string) {
  const next = slugify(requested);
  if (!next) return { error: 'Slug cannot be empty', status: 400 };
  if (isReservedSlug(next)) return { error: `"${next}" is already a route. Pick another slug.`, status: 400 };

  const current = await queryOne('SELECT slug, market_id, url_style FROM businesses WHERE id = ?', [id]) as any;
  const style = String(nextStyle || current?.url_style || 'root') === 'market' ? 'market' : 'root';
  const clash = style === 'market'
    ? await queryOne('SELECT id FROM businesses WHERE market_id = ? AND slug = ? AND id <> ? LIMIT 1', [current?.market_id, next, id])
    : await queryOne('SELECT id FROM businesses WHERE slug = ? AND id <> ? LIMIT 1', [next, id]);
  if (clash) {
    return {
      error: style === 'market'
        ? `"${next}" is already used inside this market.`
        : `"${next}" is already the address of a listing in another market.`,
      status: 409,
    };
  }
  return { slug: next, previous: current?.slug as string | undefined };
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// GET all businesses
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const business = await queryOne(`
        SELECT b.*, bt.name as type_name, bt.icon as type_icon, bt.icon_color as type_icon_color,
           bt.parent_id as parent_type_id, bt.default_template_id as child_default_template_id,
           parent_bt.name as parent_type_name, parent_bt.default_template_id as parent_default_template_id,
           t.name as tier_name, t.features as tier_features,
               p.email as vendor_email, p.display_name as vendor_name
        FROM businesses b
        LEFT JOIN business_types bt ON b.type_id = bt.id
         LEFT JOIN business_types parent_bt ON parent_bt.id = bt.parent_id
        LEFT JOIN profiles p ON b.vendor_id = p.id
        LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id
        WHERE b.id = ? OR b.slug = ?
      `, [id, id]);
      
      if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      
      // Parse JSON fields
      const biz = business as any;
      if (biz.custom_data) biz.custom_data = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data;
      if (biz.curation_data) biz.curation_data = typeof biz.curation_data === 'string' ? JSON.parse(biz.curation_data) : biz.curation_data;
      
      return NextResponse.json(biz);
    }

    const includeType = searchParams.get('includeType') === 'true';
    const typeFilter = searchParams.get('type');
    const marketFilter = searchParams.get('market');
    // A picker wants names, not whole records: `light` skips custom_data so a
    // market with hundreds of listings still answers with a small payload.
    const light = searchParams.get('light') === '1';

    let queryStr = light
      ? `
      SELECT b.id, b.slug, b.name, b.name_ar, b.market_id, b.development_id, b.type_id, b.status
      FROM businesses b
    `
      : `
      SELECT b.*, bt.name as type_name, bt.icon as type_icon, bt.icon_color as type_icon_color,
             bt.parent_id as parent_type_id, parent_bt.name as parent_type_name,
             ${includeType ? 'bt.sections as type_sections, bt.own_sections as type_own_sections,' : ''}
             p.email as vendor_email, p.display_name as vendor_name,
             mt.name as template_name
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      LEFT JOIN business_types parent_bt ON parent_bt.id = bt.parent_id
      LEFT JOIN profiles p ON b.vendor_id = p.id
      LEFT JOIN minisite_templates mt ON b.template_id = mt.id
    `;
    const queryParams: any[] = [];
    
    if (typeFilter) {
      const typesList = await query(`
        SELECT id FROM business_types WHERE id = ? OR parent_id = ?
      `, [typeFilter, typeFilter]);
      
      const targetTypeIds = (typesList as any[]).map(t => t.id);
      
      if (targetTypeIds.length > 0) {
        queryStr += ` WHERE b.type_id IN (${targetTypeIds.map(() => '?').join(',')}) `;
        queryParams.push(...targetTypeIds);
      } else {
        queryStr += ` WHERE 1=0 `;
      }
    }

    // Compounds and pickers scope to one market; the screen never needs the
    // whole platform to answer "which listings live here".
    if (marketFilter) {
      queryStr += queryStr.includes(' WHERE ') ? ` AND b.market_id = ? ` : ` WHERE b.market_id = ? `;
      queryParams.push(marketFilter);
    }
    
    queryStr += ` ORDER BY b.created_at DESC `;
    
    const businesses = await query(queryStr, queryParams);

    if (includeType) {
      businesses.forEach((biz: any) => {
        for (const key of ['type_sections', 'type_own_sections']) {
          if (biz[key]) biz[key] = typeof biz[key] === 'string' ? JSON.parse(biz[key]) : biz[key];
        }
      });
    }

    return NextResponse.json(businesses);
  } catch (e: any) {
    // Auto-heal: add template_id and is_standalone if missing
    if (e.message.includes("template_id") || e.message.includes("minisite_templates") || e.message.includes("is_standalone")) {
      await execute(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS template_id VARCHAR(100) DEFAULT NULL`);
      await execute(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_standalone BOOLEAN DEFAULT FALSE`);
      const businesses = await query(`SELECT b.*, bt.name as type_name, bt.icon as type_icon, bt.icon_color as type_icon_color, p.email as vendor_email FROM businesses b LEFT JOIN business_types bt ON b.type_id = bt.id LEFT JOIN profiles p ON b.vendor_id = p.id ORDER BY b.created_at DESC`);
      return NextResponse.json(businesses);
    }
    return NextResponse.json({ error: e.message }, { status: e.message.includes('authenticated') ? 401 : 500 });
  }
}

// POST create a new business
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const result = await createBusinessEntity({ ...body, actor_id: user.id, source: body.source || 'admin_orchestrator' });
    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE a business
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const biz = await queryOne('SELECT name FROM businesses WHERE id = ?', [id]);
    await execute('DELETE FROM businesses WHERE id = ?', [id]);

    try {
      await execute('INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)', [
        crypto.randomUUID(), user.id, user.email, user.role, 'delete_business', `Deleted: ${biz?.name || id}`
      ]);
    } catch (e) {
      console.warn('Audit Logging skipped for delete_business');
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT update a business
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (updates.template_id) {
      const business = await queryOne(
        `SELECT bt.parent_id
         FROM businesses b LEFT JOIN business_types bt ON bt.id = b.type_id
         WHERE b.id = ?`,
        [id]
      ) as any;
      if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

      const template = await queryOne(
        'SELECT id, category_id FROM minisite_templates WHERE id = ?',
        [updates.template_id]
      ) as any;
      if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      if (template.category_id && template.category_id !== business.parent_id) {
        return NextResponse.json({ error: 'Template is not available for this business parent category.' }, { status: 400 });
      }
    }

    // RULE 1: If type_id is being changed, ensure the new type is a child type
    if (updates.type_id) {
      const selectedType = await queryOne(
        'SELECT id, name, is_parent, parent_id, market_id FROM business_types WHERE id = ?',
        [updates.type_id]
      ) as any;
      if (!selectedType) {
        return NextResponse.json({ error: `Business type "${updates.type_id}" not found.` }, { status: 400 });
      }
      if (selectedType.is_parent || !selectedType.parent_id) {
        return NextResponse.json({
          error: `❌ Rule violation: "${selectedType.name}" is a parent/category type. Only child types can hold business registrations.`,
          rule: 'PARENT_TYPE_NO_REGISTRATION'
        }, { status: 400 });
      }
      // Rule 2: the typology must be offered in the market the listing lives in.
      const targetMarket = updates.market_id
        || (await queryOne('SELECT market_id FROM businesses WHERE id = ?', [id]) as any)?.market_id
        || 'siwa';
      if (selectedType.market_id && String(selectedType.market_id) !== String(targetMarket)) {
        return NextResponse.json({
          error: `"${selectedType.name}" is not offered in ${targetMarket}.`,
          rule: 'TYPE_NOT_IN_MARKET'
        }, { status: 400 });
      }
    }

    const sets: string[] = [];
    const params: any[] = [];
    const dbColumns = [
      'name', 'name_ar', 'type_id', 'subscription_tier', 'status', 'published',
      'vendor_id', 'approved_by_vendor', 'template_id',
      'is_standalone', 'is_recommended', 'is_trusted', 'is_featured', 'is_master', 'is_shared', 'is_claimed',
      'active', 'location_id', 'market_id', 'development_id', 'custom_domain', 'url_style'
    ];
    const boolFields = ['is_standalone', 'is_recommended', 'is_trusted', 'is_featured', 'is_master', 'is_shared', 'is_claimed', 'active'];

    // If logo or contact fields are passed at root level, ensure they are stored in custom_data
    let customDataToSave = updates.custom_data;
    if (updates.logo_url || updates.cover_image || updates.phone || updates.email || updates.website || updates.description) {
      const existingBiz = await queryOne('SELECT custom_data FROM businesses WHERE id = ?', [id]) as any;
      let cur = {};
      try { cur = typeof existingBiz?.custom_data === 'string' ? JSON.parse(existingBiz.custom_data) : existingBiz?.custom_data || {}; } catch {}
      const base = (typeof customDataToSave === 'object' && customDataToSave !== null) ? { ...cur, ...customDataToSave } : { ...cur };
      if (!base.basic) base.basic = {};
      if (!base.sec_1_identity) base.sec_1_identity = {};
      if (!base.business_info) base.business_info = {};
      if (updates.logo_url) {
        base.basic.business_logo = updates.logo_url;
        base.basic.logo = updates.logo_url;
        base.business_info.business_logo = updates.logo_url;
        base.business_info.logo = updates.logo_url;
        base.sec_1_identity.business_logo = updates.logo_url;
        base.sec_1_identity.logo = updates.logo_url;
        base.business_logo = updates.logo_url;
      }
      if (updates.cover_image) { base.basic.cover_image = updates.cover_image; base.business_info.cover_image = updates.cover_image; base.sec_1_identity.cover_image = updates.cover_image; }
      if (updates.phone) { base.basic.phone = updates.phone; base.business_info.phone = updates.phone; base.sec_1_identity.phone = updates.phone; }
      if (updates.email) { base.basic.email = updates.email; base.business_info.email = updates.email; base.sec_1_identity.email = updates.email; }
      if (updates.website) { base.basic.website = updates.website; base.business_info.website = updates.website; base.sec_1_identity.website = updates.website; }
      if (updates.description) { base.basic.description = updates.description; base.business_info.description = updates.description; }
      customDataToSave = base;
    }

    for (const [key, value] of Object.entries(updates)) {
      if (dbColumns.includes(key)) {
        sets.push(`${key} = ?`);
        params.push(boolFields.includes(key) ? (value ? 1 : 0) : value);
      }
    }

    // The slug is deliberately not derived from the name here: see planSlugChange.
    let slugNote = '';
    if (typeof updates.slug === 'string' && updates.slug.trim()) {
      const plan = await planSlugChange(id, updates.slug, updates.url_style);
      if ('error' in plan) return NextResponse.json({ error: plan.error }, { status: plan.status as number });
      sets.push('slug = ?');
      params.push(plan.slug);
      slugNote = ` slug: ${plan.previous} -> ${plan.slug}`;
    }

    if (customDataToSave !== undefined) {
      sets.push(`custom_data = ?`);
      params.push(typeof customDataToSave === 'object' && customDataToSave !== null ? JSON.stringify(customDataToSave) : customDataToSave);
    }
    if (updates.draft_data !== undefined) {
      sets.push(`draft_data = ?`);
      params.push(typeof updates.draft_data === 'object' && updates.draft_data !== null ? JSON.stringify(updates.draft_data) : updates.draft_data);
    }
    if (updates.curation_data !== undefined) {
      sets.push(`curation_data = ?`);
      params.push(typeof updates.curation_data === 'object' && updates.curation_data !== null ? JSON.stringify(updates.curation_data) : updates.curation_data);
    }

    if (sets.length) {
      params.push(id);
      await execute(`UPDATE businesses SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    try {
      await execute('INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)', [
        crypto.randomUUID(), user.id, user.email, user.role, 'update_business', `Updated business: ${id}${slugNote}`
      ]);
    } catch (e) {
       console.warn('Audit Logging skipped for update_business');
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Update business error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH update a business (Deep Merge for custom_data)
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // 1. Fetch existing business data to perform merge
    const existing = await queryOne('SELECT custom_data FROM businesses WHERE id = ?', [id]) as any;
    if (!existing) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    // A place must belong to the listing's own market, exactly as on create: a
    // Siwa shop cannot be filed inside an El Alamein town by a stale form.
    if ('location_id' in updates && updates.location_id) {
      const context = (await queryOne(
        `SELECT b.market_id, l.path AS city_path
           FROM businesses b
           LEFT JOIN markets m ON m.slug = b.market_id
           LEFT JOIN locations l ON l.id = m.location_id
          WHERE b.id = ? LIMIT 1`,
        [id]
      )) as any;
      const place = (await queryOne('SELECT id, path, market_id FROM locations WHERE id = ? LIMIT 1', [
        updates.location_id,
      ])) as any;
      if (!place) return NextResponse.json({ error: 'That place does not exist.' }, { status: 404 });

      const cityPath = context?.city_path ? String(context.city_path) : '';
      const placePath = String(place.path || place.id);
      const insideCity =
        Boolean(cityPath) && (placePath === cityPath || placePath.startsWith(`${cityPath}/`));
      const ownedByMarket =
        Boolean(place.market_id) && String(place.market_id) === String(context?.market_id);
      if (!insideCity && !ownedByMarket) {
        return NextResponse.json(
          { error: `"${placePath}" is not inside the ${context?.market_id} market's geography.` },
          { status: 400 }
        );
      }
    }

    let currentData: Record<string, any> = {};
    try {
      currentData = typeof existing.custom_data === 'string' ? JSON.parse(existing.custom_data) : existing.custom_data || {};
    } catch (e) { currentData = {}; }

    const sets: string[] = [];
    const params: any[] = [];
    const patchDbColumns = [
      'name', 'name_ar', 'type_id', 'subscription_tier', 'status', 'published',
      'vendor_id', 'approved_by_vendor', 'template_id',
      'is_standalone', 'is_recommended', 'is_trusted', 'is_featured', 'is_master', 'is_shared', 'is_claimed',
      'active', 'location_id', 'market_id', 'development_id', 'custom_domain', 'url_style'
    ];
    const patchBoolFields = ['is_standalone', 'is_recommended', 'is_trusted', 'is_featured', 'is_master', 'is_shared', 'is_claimed', 'active'];

    for (const [key, value] of Object.entries(updates)) {
      if (patchDbColumns.includes(key)) {
        sets.push(`${key} = ?`);
        params.push(patchBoolFields.includes(key) ? (value ? 1 : 0) : value);
      }
    }

    // Same rule as PUT: a rename leaves the address alone.
    let slugNote = '';
    if (typeof updates.slug === 'string' && updates.slug.trim()) {
      const plan = await planSlugChange(id, updates.slug, updates.url_style);
      if ('error' in plan) return NextResponse.json({ error: plan.error }, { status: plan.status as number });
      sets.push('slug = ?');
      params.push(plan.slug);
      slugNote = `slug: ${plan.previous} -> ${plan.slug}`;
    }

    // Deep merge custom_data
    let mergedData: Record<string, any> = { ...currentData };
    if (updates.custom_data && typeof updates.custom_data === 'object') {
      mergedData = { ...currentData, ...updates.custom_data };
      for (const sectionId in updates.custom_data) {
        if (currentData[sectionId] && typeof updates.custom_data[sectionId] === 'object' && updates.custom_data[sectionId] !== null) {
          mergedData[sectionId] = { ...currentData[sectionId], ...updates.custom_data[sectionId] };
        }
      }
    }

    // Also map root fields like logo_url into mergedData
    if (updates.logo_url) {
      if (!mergedData.basic) mergedData.basic = {};
      if (!mergedData.sec_1_identity) mergedData.sec_1_identity = {};
      if (!mergedData.business_info) mergedData.business_info = {};
      mergedData.basic.business_logo = updates.logo_url;
      mergedData.basic.logo = updates.logo_url;
      mergedData.business_info.business_logo = updates.logo_url;
      mergedData.business_info.logo = updates.logo_url;
      mergedData.sec_1_identity.business_logo = updates.logo_url;
      mergedData.sec_1_identity.logo = updates.logo_url;
      mergedData.business_logo = updates.logo_url;
    }
    if (updates.cover_image) {
      if (!mergedData.basic) mergedData.basic = {};
      if (!mergedData.sec_1_identity) mergedData.sec_1_identity = {};
      if (!mergedData.business_info) mergedData.business_info = {};
      mergedData.basic.cover_image = updates.cover_image;
      mergedData.business_info.cover_image = updates.cover_image;
      mergedData.sec_1_identity.cover_image = updates.cover_image;
    }
    if (updates.phone) {
      if (!mergedData.basic) mergedData.basic = {};
      if (!mergedData.business_info) mergedData.business_info = {};
      if (!mergedData.sec_1_identity) mergedData.sec_1_identity = {};
      mergedData.basic.phone = updates.phone;
      mergedData.business_info.phone = updates.phone;
      mergedData.sec_1_identity.phone = updates.phone;
    }
    if (updates.email) {
      if (!mergedData.basic) mergedData.basic = {};
      if (!mergedData.business_info) mergedData.business_info = {};
      if (!mergedData.sec_1_identity) mergedData.sec_1_identity = {};
      mergedData.basic.email = updates.email;
      mergedData.business_info.email = updates.email;
      mergedData.sec_1_identity.email = updates.email;
    }
    if (updates.website) {
      if (!mergedData.basic) mergedData.basic = {};
      if (!mergedData.business_info) mergedData.business_info = {};
      if (!mergedData.sec_1_identity) mergedData.sec_1_identity = {};
      mergedData.basic.website = updates.website;
      mergedData.business_info.website = updates.website;
      mergedData.sec_1_identity.website = updates.website;
    }
    if (updates.description) {
      if (!mergedData.basic) mergedData.basic = {};
      if (!mergedData.business_info) mergedData.business_info = {};
      mergedData.basic.description = updates.description;
      mergedData.business_info.description = updates.description;
    }

    sets.push(`custom_data = ?`);
    params.push(JSON.stringify(mergedData));

    if (updates.draft_data !== undefined) {
      sets.push(`draft_data = ?`);
      params.push(typeof updates.draft_data === 'object' && updates.draft_data !== null ? JSON.stringify(updates.draft_data) : updates.draft_data);
    }
    if (updates.curation_data !== undefined) {
      sets.push(`curation_data = ?`);
      params.push(typeof updates.curation_data === 'object' && updates.curation_data !== null ? JSON.stringify(updates.curation_data) : updates.curation_data);
    }

    if (sets.length) {
      params.push(id);
      await execute(`UPDATE businesses SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    if (sets.some(set => set.startsWith('custom_data') || set.startsWith('curation_data') || set.startsWith('template_id'))) {
      try {
        await syncManifestFromLegacyData(id, 'business_patch', user.id);
      } catch (manifestError: any) {
        console.warn('[MANIFEST SYNC SKIPPED]', manifestError?.message || manifestError);
      }
    }

    return NextResponse.json({ success: true, message: 'Business DNA merged successfully', ...(slugNote ? { slug_change: slugNote } : {}) });
  } catch (e: any) {
    console.error('PATCH business error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
