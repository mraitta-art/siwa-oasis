import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

/**
 * AUTO-HEAL: Ensure the unified package_studio_items table exists.
 * This extends marketplace_items concept with full rich content support:
 * - Rich blog HTML description (both AR & EN)
 * - Day-by-day itinerary blocks
 * - Media gallery: images, videos, YouTube embeds
 * - Included/excluded features
 * - Permission: admin always allowed; vendor if they have create_packages_permission = 1 on their business
 */
async function ensurePackageStudioTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS package_studio_items (
      id VARCHAR(100) PRIMARY KEY,
      business_id VARCHAR(100) DEFAULT NULL COMMENT 'NULL = platform-wide (admin only); SET = vendor-specific item',
      created_by VARCHAR(100) NOT NULL COMMENT 'profiles.id of the creator',
      creator_role VARCHAR(50) DEFAULT 'vendor',

      item_type ENUM('tour','package','program','activity','offer','discount') DEFAULT 'package',
      section_id VARCHAR(100) DEFAULT 'sec_9_marketplace_catalog',

      title VARCHAR(400) NOT NULL,
      title_ar VARCHAR(400) DEFAULT '',
      slug VARCHAR(400) NOT NULL,

      tagline VARCHAR(500) DEFAULT '',
      tagline_ar VARCHAR(500) DEFAULT '',

      description_html LONGTEXT COMMENT 'Rich HTML content (EN)',
      description_html_ar LONGTEXT COMMENT 'Rich HTML content (AR)',

      duration_type ENUM('hours','days','nights') DEFAULT 'days',
      duration_value SMALLINT UNSIGNED DEFAULT 1,

      max_guests SMALLINT UNSIGNED DEFAULT NULL,
      min_guests SMALLINT UNSIGNED DEFAULT 1,
      target_audience VARCHAR(200) DEFAULT 'All travelers',

      price_amount DECIMAL(10,2) DEFAULT 0.00,
      original_price DECIMAL(10,2) DEFAULT NULL,
      discount_percentage TINYINT UNSIGNED DEFAULT 0,
      discount_type ENUM('percentage','fixed','none') DEFAULT 'none',
      coupon_code VARCHAR(80) DEFAULT '',
      pricing_unit ENUM('per_person','per_group','per_night','flat') DEFAULT 'per_person',
      currency VARCHAR(10) DEFAULT 'EGP',

      itinerary JSON DEFAULT NULL COMMENT 'Array of {day, title, description, activities[]}',
      included_features JSON DEFAULT NULL COMMENT 'Array of strings',
      excluded_features JSON DEFAULT NULL COMMENT 'Array of strings',

      media JSON DEFAULT NULL COMMENT 'Array of {type: image|video|youtube, url, caption, caption_ar, cover: bool}',

      cover_image_url VARCHAR(800) DEFAULT '',

      booking_cta_type ENUM('whatsapp','link','email','form') DEFAULT 'whatsapp',
      booking_cta_url VARCHAR(500) DEFAULT '',
      booking_whatsapp VARCHAR(50) DEFAULT '',

      status ENUM('draft','pending_approval','approved','suspended','archived') DEFAULT 'draft',
      publish_on_minisite BOOLEAN DEFAULT 0,
      publish_on_main_portal BOOLEAN DEFAULT 0,
      is_featured BOOLEAN DEFAULT 0,
      admin_notes TEXT DEFAULT NULL,

      view_count INT DEFAULT 0,
      booking_count INT DEFAULT 0,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_biz (business_id),
      INDEX idx_type (item_type),
      INDEX idx_sec (section_id),
      INDEX idx_status (status),
      INDEX idx_creator (created_by),
      INDEX idx_featured (is_featured)
    )
  `);

  // Ensure businesses table has vendor package creation permission column
  try {
    await execute(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS can_create_packages TINYINT(1) DEFAULT 0`);
  } catch {
    // Column may already exist — ignore
  }
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0621-\u064A-]+/g, '')
    .replace(/--+/g, '-')
    .substring(0, 180);
}

function parseJson(row: any) {
  if (!row) return row;
  try { row.itinerary = typeof row.itinerary === 'string' ? JSON.parse(row.itinerary) : row.itinerary || []; } catch { row.itinerary = []; }
  try { row.included_features = typeof row.included_features === 'string' ? JSON.parse(row.included_features) : row.included_features || []; } catch { row.included_features = []; }
  try { row.excluded_features = typeof row.excluded_features === 'string' ? JSON.parse(row.excluded_features) : row.excluded_features || []; } catch { row.excluded_features = []; }
  try { row.media = typeof row.media === 'string' ? JSON.parse(row.media) : row.media || []; } catch { row.media = []; }
  row.publish_on_minisite = Boolean(row.publish_on_minisite);
  row.publish_on_main_portal = Boolean(row.publish_on_main_portal);
  row.is_featured = Boolean(row.is_featured);
  return row;
}

/**
 * Resolve permissions: returns { allowed, user, isAdmin, vendorBizId }
 * Vendors must have can_create_packages=1 on their business row.
 */
async function resolvePermissions(businessId?: string | null) {
  const user = await getCurrentUser();
  if (!user) return { allowed: false, user: null, isAdmin: false, vendorBizId: null };

  const adminRoles = ['super_admin', 'content_admin', 'sales_manager'];
  const isAdmin = adminRoles.includes(user.role);

  if (isAdmin) return { allowed: true, user, isAdmin: true, vendorBizId: businessId || null };

  if (user.role === 'vendor') {
    const bizId = businessId || user.businessId;
    if (!bizId) return { allowed: false, user, isAdmin: false, vendorBizId: null };

    const biz = await queryOne(
      `SELECT id, can_create_packages FROM businesses WHERE id = ?`,
      [bizId]
    ) as any;

    if (!biz) return { allowed: false, user, isAdmin: false, vendorBizId: null };
    if (!biz.can_create_packages) return { allowed: false, user, isAdmin: false, vendorBizId: bizId, reason: 'no_permission' };

    return { allowed: true, user, isAdmin: false, vendorBizId: bizId };
  }

  return { allowed: false, user, isAdmin: false, vendorBizId: null };
}

/**
 * GET /api/package-studio
 * Query params:
 *   ?id=<id>             — single item
 *   ?businessId=<id>     — all items for a vendor
 *   ?type=<item_type>
 *   ?status=<status>
 *   ?portal=true         — public approved items only
 *   ?featured=true
 */
export async function GET(req: NextRequest) {
  try {
    await ensurePackageStudioTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const businessId = searchParams.get('businessId');
    const itemType = searchParams.get('type');
    const status = searchParams.get('status') || 'all';
    const isPublicPortal = searchParams.get('portal') === 'true';
    const featured = searchParams.get('featured') === 'true';

    if (id) {
      const item = await queryOne(
        `SELECT p.*, b.name as business_name, b.slug as business_slug,
                pr.display_name as creator_name
         FROM package_studio_items p
         LEFT JOIN businesses b ON p.business_id = b.id
         LEFT JOIN profiles pr ON p.created_by = pr.id
         WHERE p.id = ?`,
        [id]
      ) as any;
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(parseJson(item));
    }

    let sql = `
      SELECT p.*, b.name as business_name, b.slug as business_slug,
             pr.display_name as creator_name
      FROM package_studio_items p
      LEFT JOIN businesses b ON p.business_id = b.id
      LEFT JOIN profiles pr ON p.created_by = pr.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (isPublicPortal) {
      sql += ` AND p.status = 'approved' AND p.publish_on_main_portal = 1 `;
    } else if (status !== 'all') {
      sql += ` AND p.status = ? `;
      params.push(status);
    }

    if (businessId) {
      if (businessId === 'platform') {
        sql += ` AND p.business_id IS NULL `;
      } else {
        sql += ` AND p.business_id = ? `;
        params.push(businessId);
      }
    }

    if (itemType && itemType !== 'all') {
      sql += ` AND p.item_type = ? `;
      params.push(itemType);
    }

    if (featured) {
      sql += ` AND p.is_featured = 1 `;
    }

    sql += ` ORDER BY p.is_featured DESC, p.created_at DESC LIMIT 200 `;

    const rows = await query(sql, params) as any[];
    return NextResponse.json(rows.map(parseJson));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/package-studio
 * Create a new studio item. Admin: always. Vendor: only if can_create_packages=1.
 */
export async function POST(req: NextRequest) {
  try {
    await ensurePackageStudioTable();
    const body = await req.json();
    const { allowed, user, isAdmin, vendorBizId, reason } = await resolvePermissions(body.business_id) as any;

    if (!allowed) {
      if (reason === 'no_permission') {
        return NextResponse.json({
          error: 'Your account does not have permission to create packages. Contact admin to enable this feature for your business.',
          code: 'VENDOR_NO_PACKAGE_PERMISSION'
        }, { status: 403 });
      }
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const {
      item_type = 'package',
      section_id = 'sec_9_marketplace_catalog',
      title,
      title_ar = '',
      tagline = '',
      tagline_ar = '',
      description_html = '',
      description_html_ar = '',
      duration_type = 'days',
      duration_value = 1,
      max_guests = null,
      min_guests = 1,
      target_audience = 'All travelers',
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
      cover_image_url = '',
      booking_cta_type = 'whatsapp',
      booking_cta_url = '',
      booking_whatsapp = '',
      // Vendors get draft status by default; admins can approve directly
      status: rawStatus,
      publish_on_minisite = false,
      publish_on_main_portal = false,
      is_featured = false,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Vendors always start in draft/pending_approval; only admins can set approved directly
    const finalStatus = isAdmin ? (rawStatus || 'approved') : 'pending_approval';
    const finalPublishMinisite = isAdmin ? (publish_on_minisite ? 1 : 0) : 0;
    const finalPublishPortal = isAdmin ? (publish_on_main_portal ? 1 : 0) : 0;
    const finalFeatured = isAdmin ? (is_featured ? 1 : 0) : 0;

    const id = crypto.randomUUID();
    const slug = `${slugify(title)}-${id.slice(0, 6)}`;

    await execute(
      `INSERT INTO package_studio_items (
        id, business_id, created_by, creator_role,
        item_type, section_id, title, title_ar, slug,
        tagline, tagline_ar, description_html, description_html_ar,
        duration_type, duration_value, max_guests, min_guests, target_audience,
        price_amount, original_price, discount_percentage, discount_type,
        coupon_code, pricing_unit, currency,
        itinerary, included_features, excluded_features, media, cover_image_url,
        booking_cta_type, booking_cta_url, booking_whatsapp,
        status, publish_on_minisite, publish_on_main_portal, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        vendorBizId || null,
        user!.id,
        user!.role,
        item_type,
        section_id,
        title.trim(),
        title_ar?.trim() || '',
        slug,
        tagline?.trim() || '',
        tagline_ar?.trim() || '',
        description_html || '',
        description_html_ar || '',
        duration_type,
        Number(duration_value) || 1,
        max_guests ? Number(max_guests) : null,
        Number(min_guests) || 1,
        target_audience || 'All travelers',
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
        cover_image_url?.trim() || '',
        booking_cta_type,
        booking_cta_url?.trim() || '',
        booking_whatsapp?.trim() || '',
        finalStatus,
        finalPublishMinisite,
        finalPublishPortal,
        finalFeatured,
      ]
    );

    return NextResponse.json({
      success: true,
      id,
      slug,
      status: finalStatus,
      message: isAdmin
        ? 'Item created and published'
        : 'Item submitted for admin approval'
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PUT /api/package-studio
 * Full update. Owner (admin or vendor who created it) can edit.
 */
export async function PUT(req: NextRequest) {
  try {
    await ensurePackageStudioTable();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await queryOne(`SELECT * FROM package_studio_items WHERE id = ?`, [id]) as any;
    if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const { allowed, user, isAdmin } = await resolvePermissions(existing.business_id) as any;
    if (!allowed) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    // Vendors can only edit their own items
    if (!isAdmin && existing.created_by !== user!.id) {
      return NextResponse.json({ error: 'You can only edit your own items' }, { status: 403 });
    }

    // Vendors cannot self-approve
    if (!isAdmin && updates.status === 'approved') {
      updates.status = 'pending_approval';
    }

    const stringFields = [
      'item_type', 'section_id', 'title', 'title_ar', 'tagline', 'tagline_ar',
      'description_html', 'description_html_ar',
      'duration_type', 'discount_type', 'coupon_code', 'pricing_unit', 'currency',
      'target_audience', 'cover_image_url', 'booking_cta_type', 'booking_cta_url',
      'booking_whatsapp', 'status', 'admin_notes'
    ];
    const numFields = ['duration_value', 'price_amount', 'original_price', 'discount_percentage', 'max_guests', 'min_guests'];
    const boolFields = ['publish_on_minisite', 'publish_on_main_portal', 'is_featured'];
    const jsonFields = ['itinerary', 'included_features', 'excluded_features', 'media'];

    const sets: string[] = [];
    const params: any[] = [];

    stringFields.forEach(f => {
      if (updates[f] !== undefined) { sets.push(`${f} = ?`); params.push(updates[f]); }
    });
    numFields.forEach(f => {
      if (updates[f] !== undefined) { sets.push(`${f} = ?`); params.push(updates[f] === null ? null : Number(updates[f])); }
    });
    boolFields.forEach(f => {
      if (updates[f] !== undefined && isAdmin) { sets.push(`${f} = ?`); params.push(updates[f] ? 1 : 0); }
    });
    jsonFields.forEach(f => {
      if (updates[f] !== undefined) { sets.push(`${f} = ?`); params.push(typeof updates[f] === 'string' ? updates[f] : JSON.stringify(updates[f])); }
    });

    if (updates.title) {
      sets.push('slug = ?');
      params.push(`${slugify(updates.title)}-${id.slice(0, 6)}`);
    }

    if (sets.length > 0) {
      params.push(id);
      await execute(`UPDATE package_studio_items SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PATCH /api/package-studio
 * Admin-only moderation: approve, suspend, feature, toggle visibility
 */
export async function PATCH(req: NextRequest) {
  try {
    await ensurePackageStudioTable();
    const { allowed, isAdmin } = await resolvePermissions() as any;
    if (!allowed || !isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json();
    const { id, status, is_featured, publish_on_minisite, publish_on_main_portal, admin_notes } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const sets: string[] = [];
    const params: any[] = [];

    if (status !== undefined) { sets.push('status = ?'); params.push(status); }
    if (is_featured !== undefined) { sets.push('is_featured = ?'); params.push(is_featured ? 1 : 0); }
    if (publish_on_minisite !== undefined) { sets.push('publish_on_minisite = ?'); params.push(publish_on_minisite ? 1 : 0); }
    if (publish_on_main_portal !== undefined) { sets.push('publish_on_main_portal = ?'); params.push(publish_on_main_portal ? 1 : 0); }
    if (admin_notes !== undefined) { sets.push('admin_notes = ?'); params.push(admin_notes); }

    if (sets.length > 0) {
      params.push(id);
      await execute(`UPDATE package_studio_items SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    return NextResponse.json({ success: true, message: 'Item moderated successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/package-studio?id=<id>
 */
export async function DELETE(req: NextRequest) {
  try {
    await ensurePackageStudioTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await queryOne(`SELECT * FROM package_studio_items WHERE id = ?`, [id]) as any;
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { allowed, user, isAdmin } = await resolvePermissions(existing.business_id) as any;
    if (!allowed) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    if (!isAdmin && existing.created_by !== user!.id) {
      return NextResponse.json({ error: 'Can only delete your own items' }, { status: 403 });
    }

    await execute(`DELETE FROM package_studio_items WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
