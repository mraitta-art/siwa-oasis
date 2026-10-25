import crypto from 'crypto';
import { execute, queryOne } from '@/lib/db';
import { syncManifestFromLegacyData } from '@/lib/minisite-manifest';
import { normalizeBusinessSlug } from '@/lib/public-url';
import { DEFAULT_MARKET_SLUG, getMarketBySlug } from '@/lib/markets';

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
  /** Arabic display name. Optional: the column allows NULL and readers fall back. */
  name_ar?: string | null;
  nameAr?: string | null;
  type_id: string;
  /** Marketplace the listing belongs to. Defaults to Siwa, the only live one. */
  market_id?: string | null;
  /** Place inside that market; defaults to the market's own city. */
  location_id?: string | null;
  /** Resort or compound the listing sits inside (a shop in a development). */
  development_id?: string | null;
  subscription_tier?: string;
  vendor_id?: string | null;
  template_id?: string | null;
  email?: string;
  phone?: string;
  description?: string;
  logo_url?: string;
  cover_image?: string;
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
    name_ar: nameAr = '',
    type_id: typeId,
    market_id: marketId = DEFAULT_MARKET_SLUG,
    location_id: locationId = null,
    development_id: developmentId = null,
    subscription_tier: subscriptionTier = 'free',
    vendor_id: vendorId = null,
    template_id: templateId = null,
    email,
    phone,
    description,
    logo_url: logoUrl,
    cover_image: coverImage,
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
  // Arabic is stored, never derived: writing the English name into name_ar would
  // look like a translation that simply was not done. The slug still comes from
  // the English name, because an Arabic name has no latin form.
  const arabicName = String((input as any).nameAr ?? nameAr ?? '').trim();
  if (!typeId) throw new Error('Business type (typology) is required');
  if (vendorId === '') vendorId = null;
  if (templateId === '') templateId = null;
  if (developmentId === '') developmentId = null;

  // Every listing belongs to exactly one market. The registry is the authority,
  // so a typo in an import cannot quietly create a fourth market.
  const market = String(marketId || DEFAULT_MARKET_SLUG).trim().toLowerCase();
  const marketRow = await getMarketBySlug(market);
  if (!marketRow) {
    const error = new Error(`Unknown market "${marketId}". Create the market before listing inside it.`);
    (error as any).rule = 'UNKNOWN_MARKET';
    throw error;
  }
  if (!locationId) locationId = marketRow.locationId;
  if (locationId === '') locationId = null;

  // A listing is filed inside its own market's geography: the market's city, or
  // anything below it. The dashboard only offers that subtree, and this is the
  // half that holds when a request does not come from the dashboard.
  if (locationId && locationId !== marketRow.locationId) {
    const place = (await queryOne('SELECT id, path, market_id FROM locations WHERE id = ? LIMIT 1', [
      locationId,
    ])) as any;
    if (!place) {
      throw new Error(`Location "${locationId}" not found.`);
    }

    const city = marketRow.locationId
      ? ((await queryOne('SELECT path FROM locations WHERE id = ? LIMIT 1', [
          marketRow.locationId,
        ])) as any)
      : null;
    const cityPath = city?.path ? String(city.path) : null;
    const placePath = String(place.path || place.id);

    const insideCity =
      !cityPath || placePath === cityPath || placePath.startsWith(`${cityPath}/`);
    const ownedByMarket = Boolean(place.market_id) && String(place.market_id) === market;

    if (!insideCity && !ownedByMarket) {
      const error = new Error(
        `"${placePath}" is not inside the ${market} market's geography, so a ${market} listing cannot use it.`
      );
      (error as any).rule = 'LOCATION_NOT_IN_MARKET';
      throw error;
    }
  }

  // A compound belongs to one market, so a listing cannot be filed inside one
  // from a different city — /el-alamein/marassi must never hold a Siwa villa.
  if (developmentId) {
    const compound = (await queryOne(
      'SELECT id, market_id, name_en, name_ar FROM developments WHERE id = ? LIMIT 1',
      [developmentId]
    )) as any;
    if (!compound) {
      throw new Error(`Compound "${developmentId}" not found.`);
    }
    if (String(compound.market_id) !== market) {
      const error = new Error(
        `"${compound.name_en || compound.name_ar}" sits in ${compound.market_id}, so a ${market} listing cannot be filed inside it.`
      );
      (error as any).rule = 'DEVELOPMENT_NOT_IN_MARKET';
      throw error;
    }
  }

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
    'SELECT id, name, is_parent, parent_id, default_template_id, market_id FROM business_types WHERE id = ?',
    [typeId]
  ) as any;
  if (!selectedType) throw new Error(`Business type "${typeId}" not found.`);
  // A category tagged with a market (salt lakes, tuk-tuk, Siwan kitchen) is not
  // offered anywhere else. Shared categories stay NULL and work in every market.
  if (selectedType.market_id && String(selectedType.market_id) !== market) {
    const error = new Error(`"${selectedType.name}" is not offered in ${marketRow.nameEn}. Pick a category that exists in that market.`);
    (error as any).rule = 'TYPE_NOT_IN_MARKET';
    throw error;
  }
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
  // Graceful template fallback — never throw or block business creation
  if (!templateId && !isStandalone) {
    const fallbackTmpl = await queryOne(
      'SELECT id FROM minisite_templates WHERE active = 1 ORDER BY is_default DESC, created_at ASC LIMIT 1'
    ) as any;
    if (fallbackTmpl?.id) {
      templateId = fallbackTmpl.id;
    } else {
      isStandalone = true;
    }
  }

  // Canonicalize direct contact/branding into custom_data
  const mergedCustomData = { ...(customData || {}) };
  const effectiveEmail = email || mergedCustomData.basic?.email || mergedCustomData.basic?.email_address;
  const effectivePhone = phone || mergedCustomData.basic?.phone || mergedCustomData.basic?.phone_number;
  const effectiveDesc = description || mergedCustomData.basic?.description;
  const effectiveLogo = logoUrl || mergedCustomData.business_logo || mergedCustomData.logo || mergedCustomData.basic?.business_logo || mergedCustomData.basic?.logo;
  const effectiveCover = coverImage || mergedCustomData.cover_image || mergedCustomData.basic?.cover_image;

  if (!mergedCustomData.basic) mergedCustomData.basic = {};
  if (!mergedCustomData.sec_1_identity) mergedCustomData.sec_1_identity = {};
  if (!mergedCustomData.business_info) mergedCustomData.business_info = {};

  if (effectiveEmail) {
    mergedCustomData.basic.email = effectiveEmail;
    mergedCustomData.basic.email_address = effectiveEmail;
  }
  if (effectivePhone) {
    mergedCustomData.basic.phone = effectivePhone;
    mergedCustomData.basic.phone_number = effectivePhone;
  }
  if (effectiveDesc) {
    mergedCustomData.basic.description = effectiveDesc;
  }
  if (effectiveLogo) {
    mergedCustomData.business_logo = effectiveLogo;
    mergedCustomData.logo = effectiveLogo;
    mergedCustomData.logo_url = effectiveLogo;
    mergedCustomData.basic.business_logo = effectiveLogo;
    mergedCustomData.basic.logo = effectiveLogo;
    mergedCustomData.sec_1_identity.business_logo = effectiveLogo;
    mergedCustomData.business_info.business_logo = effectiveLogo;
  }
  if (effectiveCover) {
    mergedCustomData.cover_image = effectiveCover;
    mergedCustomData.basic.cover_image = effectiveCover;
    mergedCustomData.sec_1_identity.cover_image = effectiveCover;
    mergedCustomData.business_info.cover_image = effectiveCover;
  }

  const baseSlug = buildBusinessSlug(canonicalName);
  // Slugs are unique inside a market, not globally: /siwa/gagal-hotel and
  // /el-alamein/gagal-hotel are two properties that share a name.
  let slug = baseSlug;
  let counter = 1;
  while (await queryOne('SELECT id FROM businesses WHERE market_id = ? AND slug = ? LIMIT 1', [market, slug])) {
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
    `INSERT INTO businesses (id, name, name_ar, slug, market_id, location_id, development_id, type_id, subscription_tier, vendor_id, template_id, is_standalone, custom_data, status, published, is_master, is_shared, is_claimed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, canonicalName, arabicName || null, slug, market, locationId, developmentId, typeId, subscriptionTier, vendorId, templateId, isStandalone ? 1 : 0,
      JSON.stringify(persistedData), status, status === 'active' ? 1 : 0, masterValue, sharedValue, claimedValue]
  );

  if (actorId) {
    try {
      await syncManifestFromLegacyData(id, 'business_created', actorId);
    } catch (error: any) {
      console.warn('[MANIFEST BOOTSTRAP SKIPPED]', error?.message || error);
    }
  }

  return { id, name: canonicalName, name_ar: arabicName || null, slug, market_id: market, location_id: locationId, development_id: developmentId, type_id: typeId, vendor_id: vendorId, is_master: masterValue, is_claimed: claimedValue };
}
