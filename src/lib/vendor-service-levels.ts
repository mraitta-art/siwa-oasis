import { randomUUID } from 'crypto';
import type { PoolConnection } from 'mysql2/promise';
import { execute, queryOne } from '@/lib/db';

/**
 * Service levels of the 3-Level Vendor Minisite System.
 *   template -> Level 1: self-serve minisite generated from a category template
 *   curated  -> Level 2: minisite prepared by the Siwa team and approved by the vendor
 *   managed  -> Level 3: done-for-you account owned by an assigned account manager
 *
 * Mirrors the CHECK constraint of migrations/044_vendor_service_levels.sql.
 */
export const SERVICE_LEVELS = ['template', 'curated', 'managed'] as const;
export type ServiceLevel = (typeof SERVICE_LEVELS)[number];

export const SERVICE_LEVEL_TRIGGERS = [
  'manual',
  'auto_upgrade',
  'auto_downgrade',
  'admin_promotion',
] as const;
export type ServiceLevelTrigger = (typeof SERVICE_LEVEL_TRIGGERS)[number];

/** Short human label used by the admin UIs. */
export const SERVICE_LEVEL_LABELS: Record<ServiceLevel, string> = {
  template: 'Level 1 · Template',
  curated: 'Level 2 · Curated',
  managed: 'Level 3 · Managed',
};

export function isServiceLevel(value: unknown): value is ServiceLevel {
  return (SERVICE_LEVELS as readonly string[]).includes(String(value));
}

/** Rows written before an app-side default existed (or a NULL) are treated as Level 1. */
export function normalizeServiceLevel(value: unknown): ServiceLevel {
  return isServiceLevel(value) ? value : 'template';
}

interface ApplyServiceLevelInput {
  businessId: string;
  toLevel: ServiceLevel;
  triggeredBy?: string | null;
  triggerType?: ServiceLevelTrigger;
  reason?: string;
  metadata?: Record<string, any>;
  /** Run inside an existing transaction instead of on the pool. */
  connection?: PoolConnection;
}

interface ApplyServiceLevelResult {
  changed: boolean;
  fromLevel: ServiceLevel;
  toLevel: ServiceLevel;
  transitionId: string | null;
}

/**
 * Move a business to another service level and write the matching
 * vendor_level_transitions audit row.
 *
 * Idempotent: asking for the level a business already has records nothing.
 * Non-fatal by design: a missing businesses.service_level / vendor_level_transitions
 * table (a deployment where migration 044 has not run yet) must never block a
 * WhatsApp send, a vendor acceptance or an admin publish - the minisite workflow
 * itself stays correct without the level bookkeeping, so failures are logged instead
 * of thrown.
 */
export async function applyVendorServiceLevel({
  businessId,
  toLevel,
  triggeredBy = null,
  triggerType = 'manual',
  reason = '',
  metadata = {},
  connection,
}: ApplyServiceLevelInput): Promise<ApplyServiceLevelResult> {
  // Statements run on the caller's transaction when one is supplied, otherwise on the pool.
  const run = async (sql: string, params: any[]) => {
    if (connection) return connection.execute(sql, params);
    return execute(sql, params);
  };
  const readRow = async (sql: string, params: any[]) => {
    if (connection) {
      const [rows] = await connection.execute(sql, params);
      return (rows as any[])[0] ?? null;
    }
    return queryOne<any>(sql, params);
  };

  try {
    const business = await readRow('SELECT service_level FROM businesses WHERE id = ? LIMIT 1', [businessId]);
    if (!business) {
      return { changed: false, fromLevel: 'template', toLevel, transitionId: null };
    }

    const fromLevel = normalizeServiceLevel(business.service_level);
    if (fromLevel === toLevel) {
      return { changed: false, fromLevel, toLevel, transitionId: null };
    }

    const transitionId = randomUUID();
    await run('UPDATE businesses SET service_level = ?, updated_at = NOW() WHERE id = ?', [toLevel, businessId]);
    await run(
      `INSERT INTO vendor_level_transitions
         (id, business_id, from_level, to_level, triggered_by, trigger_type, reason, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [transitionId, businessId, fromLevel, toLevel, triggeredBy, triggerType, reason || null, JSON.stringify(metadata)]
    );

    return { changed: true, fromLevel, toLevel, transitionId };
  } catch (error: any) {
    console.warn(`[vendor-service-levels] ${businessId} -> ${toLevel} skipped:`, error?.message || error);
    return { changed: false, fromLevel: 'template', toLevel, transitionId: null };
  }
}

/**
 * Staff members eligible to own a vendor account (Level 3).
 * Same admin role set that requireAdmin() accepts.
 */
export const ACCOUNT_MANAGER_ROLES = ['super_admin', 'content_admin', 'sales_manager', 'support_agent'];
