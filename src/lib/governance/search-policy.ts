// ================================================================
// SIWA OASIS: Search Policy Engine (Final 7-Tier RBAC)
// ================================================================

import { query } from '@/lib/db';
import type { SearchPolicy } from './types';

/** 
 * Get the visibility policy for a given role 
 * Supports the full 7-tier system.
 */
export async function getPolicyForRole(role: string): Promise<SearchPolicy | null> {
  // Check custom policies first
  const custom = await query<SearchPolicy>(
    'SELECT * FROM search_policies WHERE role = ? LIMIT 1', [role]
  );
  if (custom.length) {
    const p = custom[0];
    p.allowed_fields = typeof p.allowed_fields === 'string' ? JSON.parse(p.allowed_fields as any) : p.allowed_fields;
    return p;
  }

  // Fallback defaults for the 7-tier system
  const defaults: Record<string, SearchPolicy> = {
    super_admin:   { id: 'sa', name: 'Super Admin Policy',   description: '', role: 'super_admin',   allowed_fields: ['*'] },
    content_admin: { id: 'ca', name: 'Content Admin Policy', description: '', role: 'content_admin', allowed_fields: ['*'] },
    sales_manager: { id: 'sm', name: 'Sales Manager Policy', description: '', role: 'sales_manager', allowed_fields: ['*'] },
    support_agent: { id: 'sa2', name: 'Support Agent Policy', description: '', role: 'support_agent', allowed_fields: ['*'] },
    salesman:      { id: 's',  name: 'Salesman Policy',      description: '', role: 'salesman',      allowed_fields: ['name', 'description', 'stars', 'phone', 'email', 'address', 'category', 'status', 'subscription_tier'] },
    vendor:        { id: 'v',  name: 'Vendor View Policy',    description: '', role: 'vendor',        allowed_fields: ['name', 'description', 'stars', 'price', 'category'] },
    public:        { id: 'p',  name: 'Public View Policy',    description: '', role: 'public',        allowed_fields: ['name', 'description', 'stars', 'price', 'category'] },
  };

  return defaults[role] || defaults.public;
}

/** Filter fields based on role's search policy */
export async function enforcePolicyOnFields(fields: string[], userRole: string): Promise<string[]> {
  const policy = await getPolicyForRole(userRole);
  if (!policy || !policy.allowed_fields) return fields;
  if (policy.allowed_fields.includes('*')) return fields;
  return fields.filter(f => policy.allowed_fields.includes(f));
}

/** Get sections available for a business type (with parent/global inheritance) */
export function getSectionsForType(
  typeId: string,
  businessTypes: Array<{ id: string; is_parent: boolean; parent_id: string | null; sections: string[]; own_sections?: string[] }>,
  sections: Array<{ id: string; is_universal: boolean }>
): string[] {
  if (typeId === 'global') return sections.map(s => s.id);

  const biz = businessTypes.find(b => b.id === typeId);
  if (!biz) return [];

  const universal = sections.filter(s => s.is_universal).map(s => s.id);
  let linked: string[] = [];

  if (biz.is_parent) {
    linked = [...(biz.sections || [])];
  } else if (biz.parent_id) {
    const parent = businessTypes.find(x => x.id === biz.parent_id);
    linked = [...(parent?.sections || []), ...(biz.sections || []), ...(biz.own_sections || [])];
  } else {
    linked = [...(biz.sections || [])];
  }

  return [...new Set([...universal, ...linked])];
}
