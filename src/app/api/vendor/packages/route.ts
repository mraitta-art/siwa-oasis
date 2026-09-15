import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireVendor } from '@/lib/auth';

async function ensureExperiencePackagesTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS experience_packages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      business_ids JSON NOT NULL,
      pricing JSON NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_business_ids (business_ids(255)),
      KEY idx_active (active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

function normalizePricing(input: any, fallback: Record<string, any> = {}) {
  const parsed = typeof input === 'string' ? JSON.parse(input) : (input || {});

  const basePrice = Number(parsed.base_price ?? fallback.base_price ?? parsed.price ?? fallback.price ?? 0) || 0;
  const packagePrice = Number(parsed.package_price ?? fallback.package_price ?? parsed.price ?? fallback.price ?? basePrice) || 0;
  const discountAmount = basePrice > packagePrice ? Math.round(((basePrice - packagePrice) / basePrice) * 100) : 0;

  return {
    ...parsed,
    ...fallback,
    base_price: basePrice,
    package_price: packagePrice,
    price: packagePrice,
    savings_percentage: Number(parsed.savings_percentage ?? fallback.savings_percentage ?? discountAmount) || 0,
    package_type: parsed.package_type ?? fallback.package_type ?? 'package',
    program_type: parsed.program_type ?? fallback.program_type ?? 'experience',
    duration_days: Number(parsed.duration_days ?? fallback.duration_days ?? 1) || 1,
    audience: parsed.audience ?? fallback.audience ?? 'All travelers',
    featured: Boolean(parsed.featured ?? fallback.featured ?? false),
    status: parsed.status ?? fallback.status ?? 'active',
  };
}

function normalizePackageRow(row: any) {
  const pricing = normalizePricing(row?.pricing || {}, {
    package_type: row?.package_type || row?.type || 'package',
    program_type: row?.program_type || 'experience',
    duration_days: row?.duration_days ?? 1,
    audience: row?.audience || 'All travelers',
    featured: Boolean(row?.is_featured),
    status: row?.status || 'active',
  });

  return {
    ...row,
    id: row?.id,
    package_name: row?.package_name || row?.name || 'Untitled package',
    name: row?.name || row?.package_name || 'Untitled package',
    description: row?.description || '',
    package_type: pricing.package_type,
    program_type: pricing.program_type,
    base_price: Number(pricing.base_price) || 0,
    package_price: Number(pricing.package_price) || 0,
    savings_percentage: Number(pricing.savings_percentage) || 0,
    status: pricing.status || 'active',
    is_featured: Boolean(pricing.featured),
    duration_days: Number(pricing.duration_days) || 1,
    audience: pricing.audience || 'All travelers',
    valid_until: row?.valid_until || '',
    quantity_sold: Number(row?.quantity_sold ?? 0) || 0,
    quantity_available: Number(row?.quantity_available ?? 0) || 0,
    approval_status: row?.approval_status || 'approved',
    pricing,
  };
}

function parseBusinessIds(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {}
    return value.split(',').map(v => v.trim()).filter(Boolean);
  }
  return [String(value)];
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireVendor();
    await ensureExperiencePackagesTable();

    const businessId = user.businessId;
    if (!businessId) {
      return NextResponse.json({ success: true, packages: [] });
    }

    const canonicalRows = await query(
      `SELECT tp.*, b.name AS business_name
       FROM tour_products tp
       LEFT JOIN businesses b ON b.id = tp.vendor_business_id
       WHERE tp.vendor_business_id = ? AND tp.is_active = 1
       ORDER BY tp.created_at DESC`,
      [String(businessId)]
    );
    const rows = await query(
      `SELECT * FROM experience_packages WHERE active = 1 AND JSON_CONTAINS(CAST(business_ids AS JSON), JSON_QUOTE(?), '$') ORDER BY created_at DESC`,
      [String(businessId)]
    );

    const canonicalPackages = canonicalRows.map((row: any) => normalizePackageRow({
      ...row,
      package_name: row.name,
      package_type: row.product_kind || 'package',
      base_price: row.base_price_usd || row.base_price_egp || 0,
      package_price: row.base_price_usd || row.base_price_egp || 0,
      status: row.status || 'draft',
      approval_status: row.approval_status || 'pending',
      is_featured: row.is_featured,
    }));

    return NextResponse.json({ success: true, packages: [...canonicalPackages, ...rows.map(normalizePackageRow)] });
  } catch (error: any) {
    console.error('[vendor packages GET]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireVendor();
    await ensureExperiencePackagesTable();

    const body = await request.json();
    const name = (body.name || body.package_name || '').trim();
    if (!name) {
      return NextResponse.json({ success: false, error: 'Package name is required' }, { status: 400 });
    }

    const businessId = user.businessId;
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'No business linked to this account' }, { status: 400 });
    }

    const packageType = body.package_type || body.type || 'package';
    const programType = body.program_type || 'experience';
    const durationDays = Number(body.duration_days ?? body.duration ?? 1) || 1;
    const audience = body.audience || body.target_segment || 'All travelers';
    const description = body.description || body.package_description || '';
    const pricing = normalizePricing(body.pricing || {
      base_price: body.base_price,
      package_price: body.package_price,
      savings_percentage: body.savings_percentage,
      package_type: packageType,
      program_type: programType,
      duration_days: durationDays,
      audience,
      featured: Boolean(body.is_featured),
      status: body.status || 'active',
    }, {
      package_type: packageType,
      program_type: programType,
      duration_days: durationDays,
      audience,
      featured: Boolean(body.is_featured),
      status: body.status || 'active',
    });
    const safeSlug = `${name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await execute(
      `INSERT INTO tour_products
       (catalog_cat_id, product_kind, vendor_business_id, vendor_name, name, slug, description,
        duration_days, base_price_usd, is_public, is_featured, is_active, status, approval_status)
       VALUES (?, 'package', ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, 'draft', 'pending')`,
      [
        'multi_day_package',
        String(businessId),
        String(user.displayName || ''),
        name,
        safeSlug,
        description,
        pricing.duration_days,
        pricing.base_price || pricing.package_price || null,
      ]
    );
    const [canonicalPackage] = await query('SELECT * FROM tour_products WHERE vendor_business_id = ? AND slug = ?', [String(businessId), safeSlug]) as any[];

    return NextResponse.json({
      success: true,
      id: canonicalPackage?.id,
      package: normalizePackageRow(canonicalPackage),
    });
  } catch (error: any) {
    console.error('[vendor packages POST]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireVendor();
    await ensureExperiencePackagesTable();

    const body = await request.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Package id is required' }, { status: 400 });
    }

    const existingRows = await query(
      `SELECT * FROM experience_packages WHERE id = ?`,
      [id]
    );

    const canonicalRows = await query(
      `SELECT * FROM tour_products WHERE id = ? AND vendor_business_id = ?`,
      [id, String(user.businessId)]
    );
    if (canonicalRows.length > 0) {
      const name = (body.name || body.package_name || canonicalRows[0].name).trim();
      const price = Number(body.package_price ?? body.base_price ?? canonicalRows[0].base_price_usd) || null;
      await execute(
        `UPDATE tour_products SET name = ?, description = ?, duration_days = ?, base_price_usd = ?, is_featured = ?, updated_at = NOW() WHERE id = ?`,
        [name, body.description || canonicalRows[0].description || '', Number(body.duration_days ?? canonicalRows[0].duration_days) || 1, price, body.is_featured ? 1 : 0, id]
      );
      return NextResponse.json({ success: true });
    }

    if (existingRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
    }

    const businessIds = parseBusinessIds(existingRows[0].business_ids || body.business_ids || [user.businessId]);
    if (!businessIds.includes(String(user.businessId))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const normalized = normalizePricing(body.pricing || {
      base_price: body.base_price,
      package_price: body.package_price,
      savings_percentage: body.savings_percentage,
      package_type: body.package_type || 'package',
      program_type: body.program_type || 'experience',
      duration_days: Number(body.duration_days ?? 1),
      audience: body.audience || 'All travelers',
      featured: Boolean(body.is_featured),
      status: body.status || 'active',
    }, {
      package_type: body.package_type || 'package',
      program_type: body.program_type || 'experience',
      duration_days: Number(body.duration_days ?? 1),
      audience: body.audience || 'All travelers',
      featured: Boolean(body.is_featured),
      status: body.status || 'active',
    });

    await execute(
      `UPDATE experience_packages SET name = ?, description = ?, business_ids = ?, pricing = ?, active = ? WHERE id = ?`,
      [
        body.name || body.package_name || existingRows[0].name,
        body.description || body.package_description || existingRows[0].description || '',
        JSON.stringify(businessIds),
        JSON.stringify(normalized),
        body.active === false ? 0 : 1,
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[vendor packages PUT]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireVendor();
    await ensureExperiencePackagesTable();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Package id is required' }, { status: 400 });
    }

    const existingRows = await query(`SELECT * FROM experience_packages WHERE id = ?`, [id]);
    const canonicalRows = await query(`SELECT id FROM tour_products WHERE id = ? AND vendor_business_id = ?`, [id, String(user.businessId)]);
    if (canonicalRows.length > 0) {
      await execute(`UPDATE tour_products SET is_active = 0, status = 'archived' WHERE id = ?`, [id]);
      return NextResponse.json({ success: true });
    }
    if (existingRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
    }

    const businessIds = parseBusinessIds(existingRows[0].business_ids || []);
    if (!businessIds.includes(String(user.businessId))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await execute(`DELETE FROM experience_packages WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[vendor packages DELETE]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
