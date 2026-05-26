import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';

// GET all businesses
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const business = await queryOne(`
        SELECT b.*, bt.name as type_name, bt.icon as type_icon, bt.icon_color as type_icon_color,
               p.email as vendor_email, p.display_name as vendor_name
        FROM businesses b
        LEFT JOIN business_types bt ON b.type_id = bt.id
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
    const businesses = await query(`
      SELECT b.*, bt.name as type_name, bt.icon as type_icon, bt.icon_color as type_icon_color,
             ${includeType ? 'bt.sections as type_sections, bt.own_sections as type_own_sections,' : ''}
             p.email as vendor_email, p.display_name as vendor_name,
             mt.name as template_name
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      LEFT JOIN profiles p ON b.vendor_id = p.id
      LEFT JOIN minisite_templates mt ON b.template_id = mt.id
      ORDER BY b.created_at DESC
    `);

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

// Helper to create URL-friendly slugs
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

// POST create a new business
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    let { name, type_id, subscription_tier = 'free', vendor_id = null, template_id = null, custom_data = {}, status = 'active', is_standalone = false } = body;

    // Sanitize: Treat empty string as null for foreign key compliance
    if (vendor_id === '') vendor_id = null;
    if (template_id === '') template_id = null;

    if (!name || !type_id) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    // Generate Slug
    const slug = slugify(name);

    // AUTO-RESOLVE: If no template provided, get the default from the subscription tier
    if (!template_id) {
      try {
        const tierRow = await queryOne('SELECT default_template_id FROM subscription_tiers WHERE id = ?', [subscription_tier]) as any;
        if (tierRow?.default_template_id) {
          template_id = tierRow.default_template_id;
        }
      } catch (e) {}
    }
    
    if (!template_id && !is_standalone) {
      return NextResponse.json({ error: 'A Template must be assigned unless creating a Standalone Minisite.' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await execute(
      `INSERT INTO businesses (id, name, slug, type_id, subscription_tier, vendor_id, template_id, is_standalone, custom_data, status, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, slug, type_id, subscription_tier, vendor_id, template_id, is_standalone ? 1 : 0, JSON.stringify(custom_data), status, 1]
    );

    return NextResponse.json({ id, name, slug, type_id }, { status: 201 });
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

    const sets: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'type_id', 'subscription_tier', 'status', 'published', 'vendor_id', 'approved_by_vendor', 'template_id', 'is_standalone', 'is_recommended', 'is_trusted', 'is_featured'].includes(key)) {
        sets.push(`${key} = ?`);
        params.push(['is_standalone', 'is_recommended', 'is_trusted', 'is_featured'].includes(key) ? (value ? 1 : 0) : value);
        
        // Also update slug if name is changed
        if (key === 'name' && typeof value === 'string') {
          sets.push(`slug = ?`);
          params.push(slugify(value));
        }
      }
      if (['custom_data', 'draft_data'].includes(key)) {
        sets.push(`${key} = ?`);
        params.push(JSON.stringify(value));
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
      if (['name', 'type_id', 'subscription_tier', 'status', 'published', 'vendor_id', 'approved_by_vendor', 'template_id', 'is_standalone', 'is_recommended', 'is_trusted', 'is_featured'].includes(key)) {
        sets.push(`${key} = ?`);
        params.push(['is_standalone', 'is_recommended', 'is_trusted', 'is_featured'].includes(key) ? (value ? 1 : 0) : value);
        
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
    }

    if (sets.length) {
      params.push(id);
      await execute(`UPDATE businesses SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    return NextResponse.json({ success: true, message: 'Business DNA merged successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
