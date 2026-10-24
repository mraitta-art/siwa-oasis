import { execute, queryOne } from '@/lib/db';

/**
 * Single template resolver.
 *
 * Nine render queries join `businesses.template_id` and nothing else, so any
 * pointer that is not written back into that column is invisible at render
 * time. Migration 024 added `resolved_template_id` + parent inheritance, but
 * no writer maintained them — this file is that writer.
 *
 * Order (most specific first):
 *   1. vendor_template_assignments  (explicit admin assignment)
 *   2. businesses.template_id       (already pinned, never overridden)
 *   3. business_types.default_template_id
 *   4. parent business_types.default_template_id
 *   5. subscription_tiers.default_template_id
 *   6. newest active template in the business's category
 *
 * `template_id` is only filled when empty; `resolved_template_id` is always
 * refreshed so the admin boards can show what the renderer will actually use.
 */

export type TemplateResolutionSource =
  | 'vendor_assignment'
  | 'business_pin'
  | 'type_default'
  | 'parent_type_default'
  | 'tier_default'
  | 'newest_active'
  | 'none';

export interface TemplateResolution {
  templateId: string | null;
  source: TemplateResolutionSource;
  reason: string;
}

async function safeOne(sql: string, params: unknown[]): Promise<any | null> {
  try {
    return await queryOne<any>(sql, params);
  } catch {
    return null;
  }
}

export async function resolveTemplateForBusiness(businessId: string): Promise<TemplateResolution> {
  const business = await safeOne(
    `SELECT id, type_id, subscription_tier, template_id, resolved_template_id, is_standalone
       FROM businesses WHERE id = ? LIMIT 1`,
    [businessId]
  );
  if (!business) return { templateId: null, source: 'none', reason: 'business_not_found' };

  const pinned: string | null = business.template_id || null;
  const typeId: string | null = business.type_id || null;
  const tierId: string | null = business.subscription_tier || null;

  let templateId: string | null = null;
  let source: TemplateResolutionSource = 'none';
  let reason = 'No template pointer found; the renderer will fall back to the generated baseline.';

  // 1. Explicit vendor assignment (migration 030). Ignored when the business
  //    already carries a pin, which means an admin or a claim wrote it there.
  const assignment = await safeOne(
    'SELECT template_id FROM vendor_template_assignments WHERE business_id = ? LIMIT 1',
    [businessId]
  );

  if (pinned) {
    templateId = pinned;
    source = 'business_pin';
    reason = 'Template already pinned on the business.';
  } else if (assignment?.template_id) {
    templateId = String(assignment.template_id);
    source = 'vendor_assignment';
    reason = 'Admin assignment for this vendor.';
  }

  // 2. Typology default, child then parent.
  if (!templateId && typeId) {
    const type = await safeOne(
      'SELECT id, parent_id, default_template_id FROM business_types WHERE id = ? LIMIT 1',
      [typeId]
    );
    if (type?.default_template_id) {
      templateId = String(type.default_template_id);
      source = 'type_default';
      reason = 'Business typology default template.';
    } else if (type?.parent_id) {
      const parentType = await safeOne(
        'SELECT default_template_id FROM business_types WHERE id = ? LIMIT 1',
        [String(type.parent_id)]
      );
      if (parentType?.default_template_id) {
        templateId = String(parentType.default_template_id);
        source = 'parent_type_default';
        reason = 'Inherited from the parent category.';
      }
    }
  }

  // 3. Tier default.
  if (!templateId && tierId) {
    const tier = await safeOne(
      'SELECT default_template_id FROM subscription_tiers WHERE id = ? LIMIT 1',
      [tierId]
    );
    if (tier?.default_template_id) {
      templateId = String(tier.default_template_id);
      source = 'tier_default';
      reason = 'Default template of the subscription tier.';
    }
  }

  // 4. Newest active template in the same category, then any active template.
  if (!templateId && typeId) {
    const categorized = await safeOne(
      `SELECT id FROM minisite_templates
        WHERE active = 1 AND category_id = ?
        ORDER BY is_default DESC, created_at DESC LIMIT 1`,
      [typeId]
    );
    if (categorized?.id) {
      templateId = String(categorized.id);
      source = 'newest_active';
      reason = 'Newest active template published for this category.';
    }
  }
  if (!templateId && business.is_standalone !== 1) {
    const anyActive = await safeOne(
      'SELECT id FROM minisite_templates WHERE active = 1 ORDER BY is_default DESC, created_at DESC LIMIT 1',
      []
    );
    if (anyActive?.id) {
      templateId = String(anyActive.id);
      source = 'newest_active';
      reason = 'Newest active template (no category match).';
    }
  }

  try {
    if (templateId) {
      await execute(
        `UPDATE businesses
            SET template_id = COALESCE(NULLIF(template_id, ''), ?),
                resolved_template_id = ?,
                updated_at = NOW()
          WHERE id = ?`,
        [templateId, templateId, businessId]
      );
    } else {
      await execute(
        'UPDATE businesses SET resolved_template_id = NULL, updated_at = NOW() WHERE id = ?',
        [businessId]
      );
    }
  } catch {
    // Never block creation/claim on bookkeeping.
  }

  return { templateId, source, reason };
}
