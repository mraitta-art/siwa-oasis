import { randomBytes } from 'crypto';
import { queryOne, transaction } from '@/lib/db';
import {
  getBusinessTier,
  getTierRules,
  validateMinisiteLayout,
} from '@/lib/minisite-governance';
import type { MinisiteLayout } from '@/lib/minisite-layout';

interface SaveMinisiteDraftInput {
  businessId: string;
  layout: {
    mode?: unknown;
    components: unknown;
    site_settings?: unknown;
  };
  createdBy: string;
  vendorPhone?: unknown;
}

function fail(message: string, status: number): never {
  throw Object.assign(new Error(message), { status });
}

function normalizePhone(value: unknown) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('01')) digits = `2${digits}`;
  return digits;
}

export async function saveMinisiteDraft({
  businessId,
  layout: inputLayout,
  createdBy,
  vendorPhone,
}: SaveMinisiteDraftInput) {
  if (!businessId || !Array.isArray(inputLayout?.components)) {
    fail('businessId and a valid layout are required', 400);
  }

  const business = await queryOne<any>(
    'SELECT id, slug, type_id, subscription_tier, is_master FROM businesses WHERE id = ? OR slug = ? LIMIT 1',
    [businessId, businessId]
  );
  if (!business) fail('Business not found', 404);

  const allowed = await getTierRules(getBusinessTier(business));
  const components = validateMinisiteLayout(inputLayout.components, allowed);
  if (components.length === 0) {
    fail('Add at least one layout component allowed for this business tier.', 400);
  }
  const layout: MinisiteLayout = {
    mode: inputLayout.mode === 'untied' ? 'untied' : 'replace',
    components,
    site_settings:
      typeof inputLayout.site_settings === 'object' &&
      inputLayout.site_settings !== null &&
      !Array.isArray(inputLayout.site_settings)
        ? inputLayout.site_settings as MinisiteLayout['site_settings']
        : {},
    updated_at: new Date().toISOString(),
    updated_by: createdBy,
  };
  const id = randomBytes(18).toString('hex');
  let revision = 0;

  await transaction(async connection => {
    await connection.execute(
      'SELECT id FROM businesses WHERE id = ? FOR UPDATE',
      [business.id]
    );
    const [revisionRows] = await connection.execute(
      'SELECT revision FROM minisite_vendor_handoffs WHERE business_id = ? ORDER BY revision DESC LIMIT 1 FOR UPDATE',
      [business.id]
    );
    revision = Number((revisionRows as Array<{ revision: number }>)[0]?.revision || 0) + 1;

    const [pendingRows] = await connection.execute(
      `SELECT id FROM minisite_vendor_handoffs
       WHERE business_id = ? AND status IN
         ('draft', 'sent', 'delivered', 'read', 'followup_due', 'replied', 'changes_requested', 'accepted')`,
      [business.id]
    );
    await connection.execute(
      `UPDATE minisite_vendor_handoffs
       SET status = 'expired', token_hash = NULL, token_expires_at = NULL
       WHERE business_id = ? AND status IN
         ('draft', 'sent', 'delivered', 'read', 'followup_due', 'replied', 'changes_requested', 'accepted')`,
      [business.id]
    );
    await connection.execute(
      `INSERT INTO minisite_vendor_handoffs
         (id, business_id, revision, status, layout, vendor_phone, created_by)
       VALUES (?, ?, ?, 'draft', ?, ?, ?)`,
      [id, business.id, revision, JSON.stringify(layout), normalizePhone(vendorPhone) || null, createdBy]
    );
    await connection.execute(
      `INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload, actor_id)
       VALUES (?, 'draft_saved', ?, ?)`,
      [id, JSON.stringify({ revision, component_count: components.length }), createdBy]
    );
    for (const row of pendingRows as Array<{ id: string }>) {
      await connection.execute(
        `INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload, actor_id)
         VALUES (?, 'superseded', ?, ?)`,
        [row.id, JSON.stringify({ superseded_by_revision: revision }), createdBy]
      );
    }
  });

  return {
    handoffId: id,
    revision,
    layout,
    strippedCount: inputLayout.components.length - components.length,
    slug: business.slug || business.id,
  };
}
