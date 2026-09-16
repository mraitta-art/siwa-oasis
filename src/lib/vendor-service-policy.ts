import { query } from '@/lib/db';

export type ServiceAudience = 'public' | 'owner_customers' | 'partner_customers' | 'invite_only';
export type ServicePlacement = 'minisite' | 'marketplace' | 'search' | 'packages';

export interface ServiceViewer {
  role?: string | null;
  businessId?: string | null;
  audience?: ServiceAudience;
}

export function parseJsonList(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) return value.filter(item => typeof item === 'string');
  if (typeof value !== 'string') return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeAudienceScopes(value: unknown): ServiceAudience[] {
  const allowed: ServiceAudience[] = ['public', 'owner_customers', 'partner_customers', 'invite_only'];
  return parseJsonList(value, ['public']).filter((scope): scope is ServiceAudience => allowed.includes(scope as ServiceAudience));
}

export function normalizePlacements(value: unknown): ServicePlacement[] {
  const allowed: ServicePlacement[] = ['minisite', 'marketplace', 'search', 'packages'];
  return parseJsonList(value, ['minisite']).filter((placement): placement is ServicePlacement => allowed.includes(placement as ServicePlacement));
}

export function canViewService(service: { business_id: string; approval_status: string; audience_scopes: unknown }, viewer: ServiceViewer = {}) {
  if (viewer.role && ['super_admin', 'content_admin', 'sales_manager', 'support_agent'].includes(viewer.role)) return true;
  if (service.approval_status !== 'published') return false;

  const scopes = normalizeAudienceScopes(service.audience_scopes);
  if (scopes.includes('public')) return true;
  if (viewer.businessId && viewer.businessId === service.business_id && scopes.includes('owner_customers')) return true;
  if (viewer.audience && scopes.includes(viewer.audience)) return true;

  return false;
}

export async function getApprovedPublicServices(category?: string, placement: ServicePlacement = 'marketplace') {
  const params: string[] = ['published', JSON.stringify('public'), JSON.stringify(placement)];
  let sql = `
    SELECT vs.*, b.name AS business_name, b.slug AS business_slug, bt.name AS business_type_name
    FROM vendor_services vs
    JOIN businesses b ON b.id = vs.business_id
    LEFT JOIN business_types bt ON bt.id = b.type_id
    WHERE vs.approval_status = ?
      AND JSON_CONTAINS(vs.audience_scopes, ?, '$')
      AND JSON_CONTAINS(vs.placements, ?, '$')
      AND b.status = 'active'
      AND (vs.valid_from IS NULL OR vs.valid_from <= CURRENT_DATE())
      AND (vs.valid_until IS NULL OR vs.valid_until >= CURRENT_DATE())
  `;
  if (category) {
    sql += ' AND vs.category = ?';
    params.push(category);
  }
  sql += ' ORDER BY vs.updated_at DESC LIMIT 200';
  return query(sql, params);
}