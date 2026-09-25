import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';
import { createBusinessEntity } from '@/lib/business-creation';
import { syncManifestFromLegacyData } from '@/lib/minisite-manifest';

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
               p.email as vendor_email, p.display_name as vendor_name
        FROM businesses b
        LEFT JOIN business_types bt ON b.type_id = bt.id
         LEFT JOIN business_types parent_bt ON parent_bt.id = bt.parent_id
        LEFT JOIN profiles p ON b.vendor_id = p.id
        WHERE b.id = ?
      `, [id]);
      
      if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      
      // Parse JSON fields
      const biz = business as any;
      if (biz.custom_data) biz.custom_data = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data;
      if (biz.curation_data) biz.curation_data = typeof biz.curation_data === 'string' ? JSON.parse(biz.curation_data) : biz.curation_data;
      
      return NextResponse.json(biz);
    }

    const includeType = searchParams.get('includeType') === 'true';
    const typeFilter = searchParams.get('type');

    let queryStr = `
      SELECT b.*, bt.name as type_name, bt.icon as type_icon, bt.icon_color as type_icon_color,
             ${includeType ? 'bt.sections as type_sections, bt.own_sections as type_own_sections,' : ''}
             p.email as vendor_email, p.display_name as vendor_name,
             mt.name as template_name
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
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
    
    queryStr += ` ORDER BY b.created_at DESC `;
    
    const businesses = await query(queryStr, queryParams);

    if (includeType) {
      businesses.forEach((biz: any) => {
        if (biz.type_sections) biz.type_sections = typeof biz.type_sections === 'string' ? JSON.parse(biz.type_sections) : biz.type_sections;
        if (biz.type_own_sections) biz.type_own_sections = typeof biz.type_own_sections === 'string' ? JSON.parse(biz.type_own_sections) : biz.type_own_sections;
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
        'SELECT id, name, is_parent, parent_id FROM business_types WHERE id = ?',
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
    }

    const sets: string[] = [];
    const params: any[] = [];
    const scalarFields = [
      'name', 'type_id', 'subscription_tier', 'status', 'published',
      'vendor_id', 'approved_by_vendor', 'template_id',
      'is_standalone', 'is_recommended', 'is_trusted', 'is_featured', 'is_master', 'is_shared', 'is_claimed',
      'logo_url', 'cover_image', 'description', 'short_description',
      'phone', 'email', 'website', 'address', 'city', 'latitude', 'longitude'
    ];
    const boolFields = ['is_standalone', 'is_recommended', 'is_trusted', 'is_featured', 'is_master', 'is_shared', 'is_claimed'];

    for (const [key, value] of Object.entries(updates)) {
      if (scalarFields.includes(key)) {
        sets.push(`${key} = ?`);
        params.push(boolFields.includes(key) ? (value ? 1 : 0) : value);

        // Also update slug if name is changed
        if (key === 'name' && typeof value === 'string') {
          sets.push(`slug = ?`);
          params.push(slugify(value));
        }
      }
      if (['custom_data', 'draft_data', 'curation_data'].includes(key)) {
        sets.push(`${key} = ?`);
        params.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
      }
    }

    if (sets.length) {
      params.push(id);
      await execute(`UPDATE businesses SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    try {
      await execute('INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)', [
        crypto.randomUUID(), user.id, user.email, user.role, 'update_business', `Updated business: ${id}`
      ]);
    } catch (e) {
       console.warn('Audit Logging skipped for update_business');
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
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

    let currentData: Record<string, any> = {};
    try {
      currentData = typeof existing.custom_data === 'string' ? JSON.parse(existing.custom_data) : existing.custom_data || {};
    } catch (e) { currentData = {}; }

    const sets: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      const patchScalarFields = [
        'name', 'type_id', 'subscription_tier', 'status', 'published',
        'vendor_id', 'approved_by_vendor', 'template_id',
        'is_standalone', 'is_recommended', 'is_trusted', 'is_featured', 'is_master', 'is_shared', 'is_claimed',
        'logo_url', 'cover_image', 'description', 'short_description',
        'phone', 'email', 'website', 'address', 'city', 'latitude', 'longitude'
      ];
      const patchBoolFields = ['is_standalone', 'is_recommended', 'is_trusted', 'is_featured', 'is_master', 'is_shared', 'is_claimed'];

      if (patchScalarFields.includes(key)) {
        sets.push(`${key} = ?`);
        params.push(patchBoolFields.includes(key) ? (value ? 1 : 0) : value);

        if (key === 'name' && typeof value === 'string') {
          sets.push(`slug = ?`);
          params.push(slugify(value));
        }
      }

      if (key === 'custom_data' && value && typeof value === 'object') {
        // PERFORM DEEP MERGE: Merge the incoming custom_data with the existing one
        // This ensures that "promoting" or updating one section doesn't wipe others.
        const mergedData: Record<string, any> = { ...currentData, ...(value as object) };
        
        // Deep merge sections if they exist in both
        for (const sectionId in value as object) {
          if (currentData[sectionId] && typeof (value as any)[sectionId] === 'object') {
            mergedData[sectionId] = { ...currentData[sectionId], ...(value as any)[sectionId] };
          }
        }

        sets.push(`custom_data = ?`);
        params.push(JSON.stringify(mergedData));
      }
      
      if (key === 'draft_data') {
        sets.push(`${key} = ?`);
        params.push(JSON.stringify(value));
      }

      if (key === 'curation_data') {
        sets.push(`curation_data = ?`);
        params.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
      }
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

    return NextResponse.json({ success: true, message: 'Business DNA merged successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
