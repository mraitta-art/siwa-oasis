import crypto from 'crypto';
import { execute, queryOne } from '@/lib/db';
import { syncManifestFromLegacyData } from '@/lib/minisite-manifest';
import { normalizeBusinessSlug } from '@/lib/public-url';

export function normalizeBusinessName(name: string) {
  return String(name ?? '').replace(/\s+/g, ' ').trim();
}

export function buildBusinessSlug(name: string, existingSlug?: string) {
  const base = normalizeBusinessSlug(name) || existingSlug || `biz-${Date.now()}`;
  return base;
}

export function buildCanonicalBusinessCustomData(name: string, customData: Record<string, any> = {}) {
  const normalizedName = normalizeBusinessName(name);
  const next = { ...(customData || {}) };
  const safeBasic = { ...(next.basic || {}) };
  const safeIdentity = { ...(next.sec_1_identity || {}) };
  const safeBusinessInfo = { ...(next.business_info || {}) };

  const sharedIdentityName = normalizedName || safeBasic.business_name || safeIdentity.business_name || safeBusinessInfo.business_name || 'Business';

  next.basic = {
    ...safeBasic,
    name: safeBasic.name || sharedIdentityName,
    business_name: safeBasic.business_name || sharedIdentityName,
    display_name: safeBasic.display_name || sharedIdentityName,
  };

  next.sec_1_identity = {
    ...safeIdentity,
    name: safeIdentity.name || sharedIdentityName,
    business_name: safeIdentity.business_name || sharedIdentityName,
    display_name: safeIdentity.display_name || sharedIdentityName,
  };

  next.business_info = {
    ...safeBusinessInfo,
    name: safeBusinessInfo.name || sharedIdentityName,
    business_name: safeBusinessInfo.business_name || sharedIdentityName,
    display_name: safeBusinessInfo.display_name || sharedIdentityName,
  };

  return next;
}

export interface CreateBusinessInput {
  id?: string;
  name: string;
  type_id: string;
  subscription_tier?: string;
  vendor_id?: string | null;
  template_id?: string | null;
  custom_data?: Record<string, any>;
  status?: string;
  is_standalone?: boolean;
  clone_from_id?: string | null;
  is_master?: boolean;
  is_shared?: boolean;
  source?: string;
  actor_id?: string;
}

export async function createBusinessEntity(input: CreateBusinessInput) {
  let {
    name,
    type_id: typeId,
    subscription_tier: subscriptionTier = 'free',
    vendor_id: vendorId = null,
    template_id: templateId = null,
    custom_data: customData = {},
    status = 'active',
    is_standalone: isStandalone = false,
    clone_from_id: cloneFromId = null,
    is_master: isMaster = false,
    is_shared: isShared = false,
    source = 'admin_orchestrator',
    actor_id: actorId,
  } = input;

  const canonicalName = normalizeBusinessName(name);
  if (!canonicalName) throw new Error('Name is required');
  if (!typeId) throw new Error('Business type (typology) is required');
  if (vendorId === '') vendorId = null;
  if (templateId === '') templateId = null;

  if (cloneFromId) {
    const sourceBusiness = await queryOne(
      'SELECT type_id, subscription_tier, template_id, custom_data, is_standalone FROM businesses WHERE id = ?',
      [cloneFromId]
    ) as any;
    if (!sourceBusiness) throw new Error('Source template business not found');

    typeId = sourceBusiness.type_id;
    subscriptionTier = sourceBusiness.subscription_tier;
    templateId = sourceBusiness.template_id;
    isStandalone = sourceBusiness.is_standalone === 1 || sourceBusiness.is_standalone === true;
    try {
      customData = typeof sourceBusiness.custom_data === 'string'
        ? JSON.parse(sourceBusiness.custom_data)
        : sourceBusiness.custom_data || {};
    } catch {
      customData = {};
    }
  }

  const selectedType = await queryOne(
    'SELECT id, name, is_parent, parent_id, default_template_id FROM business_types WHERE id = ?',
    [typeId]
  ) as any;
  if (!selectedType) throw new Error(`Business type "${typeId}" not found.`);
  if (selectedType.is_parent || !selectedType.parent_id) {
    const error = new Error(`"${selectedType.name}" is a parent/category type. Select a specific child typology.`);
    (error as any).rule = 'PARENT_TYPE_NO_REGISTRATION';
    throw error;
  }

  if (!vendorId) {
    const anonymousProfile = await queryOne(
      `SELECT id FROM profiles WHERE role = 'anonymous' OR id = 'anonymous' OR email = 'anonymous@siwify.com' LIMIT 1`
    ) as any;
    vendorId = anonymousProfile?.id || 'anonymous';
  }

  if (!templateId) templateId = selectedType.default_template_id || null;
  if (!templateId && selectedType.parent_id) {
    const parentType = await queryOne(
      'SELECT default_template_id FROM business_types WHERE id = ?',
      [selectedType.parent_id]
    ) as any;
    templateId = parentType?.default_template_id || null;
  }
  if (!templateId) {
    const tier = await queryOne(
      'SELECT default_template_id FROM subscription_tiers WHERE id = ?',
      [subscriptionTier]
    ) as any;
    templateId = tier?.default_template_id || null;
  }
  if (!templateId && !isStandalone) {
    throw new Error('No minisite template could be resolved. Assign a default template to the parent business type or subscription tier.');
  }

  const baseSlug = buildBusinessSlug(canonicalName);
  let slug = baseSlug;
  let counter = 1;
  while (await queryOne('SELECT id FROM businesses WHERE slug = ? LIMIT 1', [slug])) {
    slug = `${baseSlug}-${counter++}`;
  }

  const id = input.id || crypto.randomUUID();
  const masterValue = isMaster ? 1 : 0;
  const sharedValue = isShared ? 1 : 0;
  const claimedValue = vendorId !== 'anonymous' ? 1 : 0;
  const normalizedCustomData = buildCanonicalBusinessCustomData(canonicalName, customData);

  const provenance = {
    source,
    created_at: new Date().toISOString(),
    ...(normalizedCustomData.source_provenance || {}),
  };
  const persistedData = { ...normalizedCustomData, source_provenance: provenance };

  await execute(
    `INSERT INTO businesses (id, name, slug, type_id, subscription_tier, vendor_id, template_id, is_standalone, custom_data, status, published, is_master, is_shared, is_claimed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, canonicalName, slug, typeId, subscriptionTier, vendorId, templateId, isStandalone ? 1 : 0,
      JSON.stringify(persistedData), status, status === 'active' ? 1 : 0, masterValue, sharedValue, claimedValue]
  );

  if (actorId) {
    try {
      await syncManifestFromLegacyData(id, 'business_created', actorId);
    } catch (error: any) {
      console.warn('[MANIFEST BOOTSTRAP SKIPPED]', error?.message || error);
    }
  }

  return { id, name: canonicalName, slug, type_id: typeId, vendor_id: vendorId, is_master: masterValue, is_claimed: claimedValue };
}
