import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { requireAdmin, getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

/**
 * AUTO-HEAL: Ensure unified marketplace_items & package_business_assignments tables exist
 */
async function ensureMarketplaceTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS marketplace_items (
      id VARCHAR(100) PRIMARY KEY,
      business_id VARCHAR(100) DEFAULT NULL,
      section_id VARCHAR(100) DEFAULT 'sec_9_marketplace_catalog',
      title VARCHAR(255) NOT NULL,
      title_ar VARCHAR(255) DEFAULT '',
      slug VARCHAR(255) NOT NULL,
      item_type VARCHAR(50) DEFAULT 'package',
      category_id VARCHAR(100) DEFAULT 'general',
      description TEXT,
      description_ar TEXT,
      duration_type VARCHAR(30) DEFAULT 'hours',
      duration_value INT DEFAULT 1,
      price_amount DECIMAL(10,2) DEFAULT 0.00,
      original_price DECIMAL(10,2) DEFAULT NULL,
      discount_percentage INT DEFAULT 0,
      discount_type VARCHAR(50) DEFAULT 'none',
      coupon_code VARCHAR(50) DEFAULT '',
      pricing_unit VARCHAR(50) DEFAULT 'per_person',
      currency VARCHAR(10) DEFAULT 'EGP',
      itinerary JSON DEFAULT NULL,
      included_features JSON DEFAULT NULL,
      excluded_features JSON DEFAULT NULL,
      media JSON DEFAULT NULL,
      status VARCHAR(30) DEFAULT 'approved',
      publish_on_minisite BOOLEAN DEFAULT 1,
      publish_on_main_portal BOOLEAN DEFAULT 1,
      is_featured BOOLEAN DEFAULT 0,
      booking_cta_type VARCHAR(50) DEFAULT 'whatsapp',
      booking_cta_url VARCHAR(255) DEFAULT '',
      target_scope VARCHAR(50) DEFAULT 'platform',
      target_type_id VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_biz (business_id),
      INDEX idx_sec (section_id),
      INDEX idx_status (status),
      INDEX idx_type (item_type),
      INDEX idx_featured (is_featured),
      INDEX idx_scope (target_scope)
    )
  `);

  try {
    await execute(`ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS target_scope VARCHAR(50) DEFAULT 'platform'`);
    await execute(`ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS target_type_id VARCHAR(100) DEFAULT NULL`);
  } catch {}

  await execute(`
    CREATE TABLE IF NOT EXISTS package_business_assignments (
      id VARCHAR(100) PRIMARY KEY,
      item_id VARCHAR(100) NOT NULL,
      business_id VARCHAR(100) NOT NULL,
      business_role VARCHAR(50) DEFAULT 'partner',
      revenue_share_percentage DECIMAL(5,2) DEFAULT NULL,
      vendor_acceptance_status VARCHAR(30) DEFAULT 'accepted',
      visible_on_minisite BOOLEAN DEFAULT 1,
      assigned_by VARCHAR(100) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_item (item_id),
      INDEX idx_biz (business_id),
      INDEX idx_status (vendor_acceptance_status)
    )
  `);
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0621-\u064A-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * Sync assignments table when item is saved
 */
async function syncItemAssignments(itemId: string, targetScope: string, targetTypeId: string | null, assignments: any[], userId: string) {
  try {
    // Delete existing assignments
    await execute('DELETE FROM package_business_assignments WHERE item_id = ?', [itemId]);

    if (targetScope === 'parent_category' && targetTypeId) {
      // Find all businesses under parent category
      const bizList = await query(`
        SELECT id FROM businesses WHERE active = 1 AND type_id IN (
          SELECT id FROM business_types WHERE parent_id = ? OR id = ?
        )
      `, [targetTypeId, targetTypeId]) as any[];

      for (const b of bizList) {
        const pId = crypto.randomUUID();
        await execute(`
          INSERT INTO package_business_assignments (id, item_id, business_id, business_role, vendor_acceptance_status, visible_on_minisite, assigned_by)
          VALUES (?, ?, ?, 'partner', 'accepted', 1, ?)
        `, [pId, itemId, b.id, userId]);
      }
    } else if (targetScope === 'child_typology' && targetTypeId) {
      // Find all businesses in child typology
      const bizList = await query(`
        SELECT id FROM businesses WHERE active = 1 AND type_id = ?
      `, [targetTypeId]) as any[];

      for (const b of bizList) {
        const pId = crypto.randomUUID();
        await execute(`
          INSERT INTO package_business_assignments (id, item_id, business_id, business_role, vendor_acceptance_status, visible_on_minisite, assigned_by)
          VALUES (?, ?, ?, 'partner', 'accepted', 1, ?)
        `, [pId, itemId, b.id, userId]);
      }
    } else if (Array.isArray(assignments) && assignments.length > 0) {
      for (const a of assignments) {
        if (!a.business_id) continue;
        const pId = crypto.randomUUID();
        await execute(`
          INSERT INTO package_business_assignments (
            id, item_id, business_id, business_role, revenue_share_percentage,
            vendor_acceptance_status, visible_on_minisite, assigned_by
          ) VALUES (?, ?, ?, ?, ?, 'accepted', ?, ?)
        `, [
          pId,
          itemId,
          a.business_id,
          a.business_role || 'partner',
          a.revenue_share_percentage ? Number(a.revenue_share_percentage) : null,
          a.visible_on_minisite !== false ? 1 : 0,
          userId
        ]);
      }
    }
  } catch (err) {
    console.error('Error syncing item assignments:', err);
  }
}

/**
 * GET /api/jana/marketplace
 * Retrieve marketplace items with flexible filtering & multi-business syndication:
 *   ?businessId=<id>        — filter by specific business (or 'platform' for global items)
 *   ?sectionId=<sec_id>     — filter by section (e.g. sec_5_experiences, sec_9_marketplace_catalog)
 *   ?type=<item_type>       — package, tour, activity, discount_offer, room_bundle
 *   ?status=<status>        — draft, pending_approval, approved, suspended, all
 *   ?scope=<target_scope>   — platform, parent_category, child_typology, multi_business
 *   ?featured=true          — only featured items
 *   ?portal=true            — public main portal items only (status=approved, publish_on_main_portal=1)
 */
export async function GET(req: NextRequest) {
  try {
    await ensureMarketplaceTable();
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const sectionId = searchParams.get('sectionId');
    const itemType = searchParams.get('type');
    const status = searchParams.get('status') || 'all';
    const targetScope = searchParams.get('scope');
    const featured = searchParams.get('featured') === 'true';
    const isPublicPortal = searchParams.get('portal') === 'true';
    const id = searchParams.get('id');

    // Single item fetch
    if (id) {
      const item = await queryOne(
        `SELECT m.*, b.name as business_name, b.slug as business_slug, b.type_id as business_type_id,
                bt.name as business_type_name
         FROM marketplace_items m
         LEFT JOIN businesses b ON m.business_id = b.id
         LEFT JOIN business_types bt ON b.type_id = bt.id
         WHERE m.id = ? LIMIT 1`,
        [id]
      ) as any;

      if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      
      const parsed = parseItemJson(item);
      // Fetch assignments
      try {
        const assignments = await query(`
          SELECT pba.*, b.name as business_name, b.slug as business_slug,
                 b.subscription_tier as business_tier, bt.name as business_type_name
          FROM package_business_assignments pba
          LEFT JOIN businesses b ON pba.business_id = b.id
          LEFT JOIN business_types bt ON b.type_id = bt.id
          WHERE pba.item_id = ?
        `, [id]) as any[];
        parsed.assignments = assignments;
      } catch {
        parsed.assignments = [];
      }

      return NextResponse.json(parsed);
    }

    let sql = `
      SELECT m.*, b.name as business_name, b.slug as business_slug, b.type_id as business_type_id,
             bt.name as business_type_name
      FROM marketplace_items m
      LEFT JOIN businesses b ON m.business_id = b.id
      LEFT JOIN business_types bt ON b.type_id = bt.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (isPublicPortal) {
      sql += ` AND m.status = 'approved' AND m.publish_on_main_portal = 1 `;
    } else if (status !== 'all') {
      sql += ` AND m.status = ? `;
      params.push(status);
    }

    if (businessId === 'platform') {
      sql += ` AND m.business_id IS NULL `;
    } else if (businessId) {
      // Include direct items OR items syndicated/assigned to this business
      sql += ` AND (m.business_id = ? OR m.id IN (SELECT item_id FROM package_business_assignments WHERE business_id = ?)) `;
      params.push(businessId, businessId);
    }

    if (sectionId) {
      sql += ` AND m.section_id = ? `;
      params.push(sectionId);
    }

    if (itemType && itemType !== 'all') {
      sql += ` AND m.item_type = ? `;
      params.push(itemType);
    }

    if (targetScope && targetScope !== 'all') {
      sql += ` AND m.target_scope = ? `;
      params.push(targetScope);
    }

    if (featured) {
      sql += ` AND m.is_featured = 1 `;
    }

    sql += ` ORDER BY m.is_featured DESC, m.created_at DESC `;

    const rows = await query(sql, params) as any[];
    const items = rows.map(parseItemJson);

    // Fetch assignments for all returned items
    if (items.length > 0) {
      try {
        const itemIds = items.map(i => i.id);
        const placeholders = itemIds.map(() => '?').join(',');
        const allAssignments = await query(`
          SELECT pba.*, b.name as business_name, b.slug as business_slug,
                 b.subscription_tier as business_tier, bt.name as business_type_name
          FROM package_business_assignments pba
          LEFT JOIN businesses b ON pba.business_id = b.id
          LEFT JOIN business_types bt ON b.type_id = bt.id
          WHERE pba.item_id IN (${placeholders})
        `, itemIds) as any[];

        const map: Record<string, any[]> = {};
        for (const a of allAssignments) {
          if (!map[a.item_id]) map[a.item_id] = [];
          map[a.item_id].push(a);
        }

        for (const it of items) {
          it.assignments = map[it.id] || [];
        }
      } catch {
        for (const it of items) it.assignments = [];
      }
    }

    return NextResponse.json(items);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/jana/marketplace
 * Create a new Tour, Package, Program, Activity, or Discount Offer with Target Scope & Multi-Vendor Assignment
 */
export async function POST(req: NextRequest) {
  try {
    await ensureMarketplaceTable();
    const user = await requireAdmin();
    const body = await req.json();

    const {
      business_id = null,
      section_id = 'sec_9_marketplace_catalog',
      title,
      title_ar = '',
      item_type = 'package',
      category_id = 'general',
      description = '',
      description_ar = '',
      duration_type = 'hours',
      duration_value = 1,
      price_amount = 0,
      original_price = null,
      discount_percentage = 0,
      discount_type = 'none',
      coupon_code = '',
      pricing_unit = 'per_person',
      currency = 'EGP',
      itinerary = [],
      included_features = [],
      excluded_features = [],
      media = [],
      status = 'approved',
      publish_on_minisite = true,
      publish_on_main_portal = true,
      is_featured = false,
      booking_cta_type = 'whatsapp',
      booking_cta_url = '',
      target_scope = 'platform',
      target_type_id = null,
      assignments = []
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const slug = `${slugify(title)}-${id.slice(0, 6)}`;

    await execute(
      `INSERT INTO marketplace_items (
        id, business_id, section_id, title, title_ar, slug, item_type, category_id,
        description, description_ar, duration_type, duration_value, price_amount,
        original_price, discount_percentage, discount_type, coupon_code, pricing_unit,
        currency, itinerary, included_features, excluded_features, media, status,
        publish_on_minisite, publish_on_main_portal, is_featured, booking_cta_type, booking_cta_url,
        target_scope, target_type_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        business_id || null,
        section_id || 'sec_9_marketplace_catalog',
        title.trim(),
        title_ar?.trim() || '',
        slug,
        item_type,
        category_id,
        description,
        description_ar,
        duration_type,
        Number(duration_value) || 1,
        Number(price_amount) || 0,
        original_price ? Number(original_price) : null,
        Number(discount_percentage) || 0,
        discount_type,
        coupon_code?.trim() || '',
        pricing_unit,
        currency,
        JSON.stringify(itinerary || []),
        JSON.stringify(included_features || []),
        JSON.stringify(excluded_features || []),
        JSON.stringify(media || []),
        status,
        publish_on_minisite ? 1 : 0,
        publish_on_main_portal ? 1 : 0,
        is_featured ? 1 : 0,
        booking_cta_type,
        booking_cta_url || '',
        target_scope,
        target_type_id || null
      ]
    );

    // Sync assignments for Parent, Child, or Multi-Business Combos
    await syncItemAssignments(id, target_scope, target_type_id, assignments, user.id);

    return NextResponse.json({ success: true, id, slug }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PUT /api/jana/marketplace
 * Full update of an existing item including Target Scope & Multi-Vendor Assignments
 */
export async function PUT(req: NextRequest) {
  try {
    await ensureMarketplaceTable();
    const user = await requireAdmin();
    const body = await req.json();
    const { id, target_scope, target_type_id, assignments, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });

    const sets: string[] = [];
    const params: any[] = [];

    const stringFields = [
      'business_id', 'section_id', 'title', 'title_ar', 'item_type', 'category_id',
      'description', 'description_ar', 'duration_type', 'discount_type',
      'coupon_code', 'pricing_unit', 'currency', 'status', 'booking_cta_type', 'booking_cta_url',
      'target_scope', 'target_type_id'
    ];

    if (target_scope !== undefined) updates.target_scope = target_scope;
    if (target_type_id !== undefined) updates.target_type_id = target_type_id;

    stringFields.forEach((field) => {
      if (updates[field] !== undefined) {
        sets.push(`${field} = ?`);
        params.push(updates[field] === '' && (field === 'business_id' || field === 'target_type_id') ? null : updates[field]);
      }
    });

    const numFields = ['duration_value', 'price_amount', 'original_price', 'discount_percentage'];
    numFields.forEach((field) => {
      if (updates[field] !== undefined) {
        sets.push(`${field} = ?`);
        params.push(updates[field] === null ? null : Number(updates[field]));
      }
    });

    const boolFields = ['publish_on_minisite', 'publish_on_main_portal', 'is_featured'];
    boolFields.forEach((field) => {
      if (updates[field] !== undefined) {
        sets.push(`${field} = ?`);
        params.push(updates[field] ? 1 : 0);
      }
    });

    const jsonFields = ['itinerary', 'included_features', 'excluded_features', 'media'];
    jsonFields.forEach((field) => {
      if (updates[field] !== undefined) {
        sets.push(`${field} = ?`);
        params.push(typeof updates[field] === 'string' ? updates[field] : JSON.stringify(updates[field]));
      }
    });

    if (updates.title) {
      sets.push('slug = ?');
      params.push(`${slugify(updates.title)}-${id.slice(0, 6)}`);
    }

    if (sets.length > 0) {
      params.push(id);
      await execute(`UPDATE marketplace_items SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    // If assignments or target scope was passed, re-sync assignments
    if (target_scope !== undefined || assignments !== undefined) {
      await syncItemAssignments(
        id,
        target_scope || updates.target_scope || 'platform',
        target_type_id !== undefined ? target_type_id : updates.target_type_id,
        assignments || [],
        user.id
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PATCH /api/jana/marketplace
 * Quick status toggles (approve, suspend, feature, toggle visibility)
 */
export async function PATCH(req: NextRequest) {
  try {
    await ensureMarketplaceTable();
    await requireAdmin();
    const body = await req.json();
    const { id, status, is_featured, publish_on_minisite, publish_on_main_portal } = body;

    if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });

    const sets: string[] = [];
    const params: any[] = [];

    if (status !== undefined) {
      sets.push('status = ?');
      params.push(status);
    }
    if (is_featured !== undefined) {
      sets.push('is_featured = ?');
      params.push(is_featured ? 1 : 0);
    }
    if (publish_on_minisite !== undefined) {
      sets.push('publish_on_minisite = ?');
      params.push(publish_on_minisite ? 1 : 0);
    }
    if (publish_on_main_portal !== undefined) {
      sets.push('publish_on_main_portal = ?');
      params.push(publish_on_main_portal ? 1 : 0);
    }

    if (sets.length > 0) {
      params.push(id);
      await execute(`UPDATE marketplace_items SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    return NextResponse.json({ success: true, message: 'Item updated successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/jana/marketplace?id=<id>
 */
export async function DELETE(req: NextRequest) {
  try {
    await ensureMarketplaceTable();
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await execute('DELETE FROM package_business_assignments WHERE item_id = ?', [id]);
    await execute('DELETE FROM marketplace_items WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Item and assignments deleted' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function parseItemJson(item: any) {
  if (!item) return item;
  try { item.itinerary = typeof item.itinerary === 'string' ? JSON.parse(item.itinerary) : item.itinerary || []; } catch {}
  try { item.included_features = typeof item.included_features === 'string' ? JSON.parse(item.included_features) : item.included_features || []; } catch {}
  try { item.excluded_features = typeof item.excluded_features === 'string' ? JSON.parse(item.excluded_features) : item.excluded_features || []; } catch {}
  try { item.media = typeof item.media === 'string' ? JSON.parse(item.media) : item.media || []; } catch {}
  item.publish_on_minisite = Boolean(item.publish_on_minisite);
  item.publish_on_main_portal = Boolean(item.publish_on_main_portal);
  item.is_featured = Boolean(item.is_featured);
  return item;
}
