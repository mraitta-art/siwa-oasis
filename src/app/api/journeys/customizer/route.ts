import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { DEFAULT_JOURNEY_CUSTOMIZER, type JourneyCustomizerCatalog } from '@/lib/journey-customizer-catalog';

const CONFIG_KEY = 'default';
let catalogTableReady: Promise<void> | null = null;

function ensureCatalogTable(): Promise<void> {
  if (!catalogTableReady) {
    catalogTableReady = execute(`
    CREATE TABLE IF NOT EXISTS journey_customizer_catalog (
      config_key VARCHAR(50) NOT NULL PRIMARY KEY,
      catalog JSON NOT NULL,
      revision INT NOT NULL DEFAULT 1,
      updated_by VARCHAR(100) DEFAULT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
    `).then(() => undefined);
  }
  return catalogTableReady;
}

function parseCatalog(value: unknown): JourneyCustomizerCatalog {
  let parsed: any;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch { parsed = DEFAULT_JOURNEY_CUSTOMIZER; }
  } else {
    parsed = value || DEFAULT_JOURNEY_CUSTOMIZER;
  }

  // Gracefully merge default provider and comparison fields into existing DB records
  const result = { ...DEFAULT_JOURNEY_CUSTOMIZER, ...parsed };
  const groups = ['experiences', 'accommodations', 'transports', 'meals'] as const;

  for (const group of groups) {
    const defaultGroupItems = (DEFAULT_JOURNEY_CUSTOMIZER[group] as any[]) || [];
    const defaultMap = new Map<string, any>(defaultGroupItems.map(it => [it.id, it]));
    const currentGroupItems = (parsed[group] as any[]) || [];

    result[group] = currentGroupItems.map((item: any) => {
      const def = defaultMap.get(item.id) || {};
      return {
        ...def,
        ...item,
        // Preserve default provider details if missing in legacy DB row
        business_name: item.business_name || def.business_name,
        business_slug: item.business_slug || def.business_slug,
        provider_type: item.provider_type || def.provider_type,
        provider_badge: item.provider_badge || def.provider_badge,
        is_trusted: item.is_trusted !== undefined ? item.is_trusted : def.is_trusted,
        ota_benchmark_price: item.ota_benchmark_price || def.ota_benchmark_price,
        ota_name: item.ota_name || def.ota_name,
        external_check_url: item.external_check_url || def.external_check_url,
        direct_discount_note: item.direct_discount_note || def.direct_discount_note,
        commercial_item_id: item.commercial_item_id || def.commercial_item_id,
        image: item.image || def.image,
        icon: item.icon || def.icon,
      };
    }) as any;
  }

  return result as JourneyCustomizerCatalog;
}

function validateCatalog(input: unknown): input is JourneyCustomizerCatalog {
  if (!input || typeof input !== 'object') return false;
  const catalog = input as Partial<JourneyCustomizerCatalog>;
  const groups = ['experiences', 'accommodations', 'transports', 'meals'] as const;
  if (!groups.every(group => Array.isArray(catalog[group]))) return false;
  if (!Number.isFinite(Number(catalog.bundle_discount_percent)) || Number(catalog.bundle_discount_percent) < 0 || Number(catalog.bundle_discount_percent) > 100) return false;

  return groups.every(group => {
    const items = catalog[group] as Array<Record<string, unknown>>;
    const ids = new Set<string>();
    return items.length <= 100 && items.every(item => {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !/^[a-z0-9_-]{1,100}$/i.test(item.id)) return false;
      if (ids.has(item.id) || typeof item.is_visible !== 'boolean') return false;
      ids.add(item.id);
      if (!Array.isArray(item.vendor_business_ids) || !item.vendor_business_ids.every(id => typeof id === 'string')) return false;
      const prices = ['base_price_egp', 'price_per_night', 'rate_per_day', 'price_per_person']
        .filter(key => key in item);
      return prices.every(key => Number.isFinite(Number(item[key])) && Number(item[key]) >= 0);
    });
  });
}

function publicCatalog(catalog: JourneyCustomizerCatalog): JourneyCustomizerCatalog {
  const result = JSON.parse(JSON.stringify(catalog)) as JourneyCustomizerCatalog;
  for (const group of ['experiences', 'accommodations', 'transports', 'meals'] as const) {
    result[group] = result[group]
      .filter(item => item.is_visible)
      .map(item => ({ ...item, vendor_business_ids: [] })) as typeof result[typeof group];
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const adminView = request.nextUrl.searchParams.get('view') === 'admin';
    if (adminView) await requireAdmin();

    let row: { catalog: unknown; revision: number; updated_at: string } | null;
    try {
      row = await queryOne<{ catalog: unknown; revision: number; updated_at: string }>(
        'SELECT catalog, revision, updated_at FROM journey_customizer_catalog WHERE config_key = ? LIMIT 1',
        [CONFIG_KEY]
      );
    } catch (error: any) {
      if (error?.code !== 'ER_NO_SUCH_TABLE') throw error;
      row = null;
    }
    const catalog = row ? parseCatalog(row.catalog) : DEFAULT_JOURNEY_CUSTOMIZER;

    return NextResponse.json({
      catalog: adminView ? catalog : publicCatalog(catalog),
      revision: row?.revision || 0,
      updated_at: row?.updated_at || null,
      source: row ? 'database' : 'defaults',
    });
  } catch (error: any) {
    const status = error?.message?.includes('authenticated') || error?.message?.includes('Admin access') ? 403 : 500;
    return NextResponse.json({ error: error?.message || 'Failed to load journey catalog' }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const catalog = body?.catalog;
    if (!validateCatalog(catalog)) {
      return NextResponse.json({ error: 'Invalid journey catalog. Check IDs, visibility flags, vendor assignments, and prices.' }, { status: 400 });
    }

    await ensureCatalogTable();
    await execute(
      `INSERT INTO journey_customizer_catalog (config_key, catalog, revision, updated_by, updated_at)
       VALUES (?, ?, 1, ?, NOW())
       ON DUPLICATE KEY UPDATE catalog = VALUES(catalog), revision = revision + 1, updated_by = VALUES(updated_by), updated_at = NOW()`,
      [CONFIG_KEY, JSON.stringify(catalog), admin.id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error?.message?.includes('authenticated') || error?.message?.includes('Admin access') ? 403 : 500;
    return NextResponse.json({ error: error?.message || 'Failed to save journey catalog' }, { status });
  }
}

/**
 * PATCH — Update a single item within the catalog without replacing everything.
 * Body: { group: 'experiences'|'accommodations'|'transports'|'meals', item_id: string, updates: Partial<item> }
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { group, item_id, updates } = body;

    const validGroups = ['experiences', 'accommodations', 'transports', 'meals'] as const;
    if (!validGroups.includes(group) || !item_id || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Required: group (experiences|accommodations|transports|meals), item_id, updates object' }, { status: 400 });
    }

    // Load current catalog
    let row: { catalog: unknown; revision: number } | null;
    try {
      row = await queryOne<{ catalog: unknown; revision: number }>(
        'SELECT catalog, revision FROM journey_customizer_catalog WHERE config_key = ? LIMIT 1',
        [CONFIG_KEY]
      );
    } catch (error: any) {
      if (error?.code !== 'ER_NO_SUCH_TABLE') throw error;
      row = null;
    }
    const catalog = row ? parseCatalog(row.catalog) : { ...DEFAULT_JOURNEY_CUSTOMIZER };

    // Find and update the item
    const items = catalog[group as keyof Pick<JourneyCustomizerCatalog, 'experiences' | 'accommodations' | 'transports' | 'meals'>] as any[];
    const idx = items.findIndex((it: any) => it.id === item_id);
    if (idx === -1) {
      return NextResponse.json({ error: `Item '${item_id}' not found in group '${group}'` }, { status: 404 });
    }

    // Merge updates (don't allow id change)
    const { id: _id, ...safeUpdates } = updates;
    items[idx] = { ...items[idx], ...safeUpdates };

    // Validate the modified catalog
    if (!validateCatalog(catalog)) {
      return NextResponse.json({ error: 'Updated catalog failed validation. Check your changes.' }, { status: 400 });
    }

    await ensureCatalogTable();
    await execute(
      `INSERT INTO journey_customizer_catalog (config_key, catalog, revision, updated_by, updated_at)
       VALUES (?, ?, 1, ?, NOW())
       ON DUPLICATE KEY UPDATE catalog = VALUES(catalog), revision = revision + 1, updated_by = VALUES(updated_by), updated_at = NOW()`,
      [CONFIG_KEY, JSON.stringify(catalog), admin.id]
    );

    return NextResponse.json({ success: true, item: items[idx] });
  } catch (error: any) {
    const status = error?.message?.includes('authenticated') || error?.message?.includes('Admin access') ? 403 : 500;
    return NextResponse.json({ error: error?.message || 'Failed to patch journey item' }, { status });
  }
}
