export const CANONICAL_SECTION_IDS = [
  'sec_1_identity',
  'sec_2_ambience',
  'sec_3_facilities',
  'sec_4_gastronomy',
  'sec_5_experiences',
  'sec_6_guardian',
  'sec_7_investment',
  'sec_8_connector',
  'sec_9_marketplace_catalog',
  'sec_10_testimonials_faqs',
] as const;

export type CanonicalSectionId = (typeof CANONICAL_SECTION_IDS)[number];

export const LEGACY_SECTION_ALIASES: Record<string, CanonicalSectionId> = {
  basic: 'sec_1_identity',
  business_info: 'sec_1_identity',
  vibe: 'sec_2_ambience',
  ambience: 'sec_2_ambience',
  sec_3_services: 'sec_5_experiences',
  experience: 'sec_5_experiences',
  sec_4_facilities: 'sec_3_facilities',
  sec_5_connectivity: 'sec_8_connector',
  sec_6_geographic: 'sec_2_ambience',
  investment: 'sec_7_investment',
  'investment-opportunity': 'sec_7_investment',
  'offers-packages': 'sec_8_connector',
  'discounts-promotions': 'sec_8_connector',
  sec_8_rates_offers: 'sec_8_connector',
  media: 'sec_9_marketplace_catalog',
};

export const CANONICAL_SECTIONS = [
  { id: 'sec_1_identity', name: 'Identity & Overview', label: 'Identity', emoji: '🏷️', color: '#2563eb', icon: 'fa-landmark', order: 1 },
  { id: 'sec_2_ambience', name: 'Vibe & Experience', label: 'Vibe', emoji: '✨', color: '#f59e0b', icon: 'fa-sun', order: 2 },
  { id: 'sec_3_facilities', name: 'Facilities & Amenities', label: 'Facilities', emoji: '🏢', color: '#0ea5e9', icon: 'fa-swimming-pool', order: 3 },
  { id: 'sec_4_gastronomy', name: 'Services & Activities', label: 'Services', emoji: '🛠️', color: '#f97316', icon: 'fa-utensils', order: 4 },
  { id: 'sec_5_experiences', name: 'Programs & Experiences', label: 'Experiences', emoji: '🧭', color: '#16a34a', icon: 'fa-hiking', order: 5 },
  { id: 'sec_6_guardian', name: 'Structure & Operations', label: 'Operations', emoji: '⚙️', color: '#64748b', icon: 'fa-building', order: 6 },
  { id: 'sec_7_investment', name: 'Investment & Partnerships', label: 'Investment', emoji: '📈', color: '#7c3aed', icon: 'fa-chart-line', order: 7 },
  { id: 'sec_8_connector', name: 'Offers, Packages & Discounts', label: 'Offers', emoji: '🏷️', color: '#dc2626', icon: 'fa-tags', order: 8 },
  { id: 'sec_9_marketplace_catalog', name: 'Media & Marketplace', label: 'Marketplace', emoji: '🛍️', color: '#0891b2', icon: 'fa-store', order: 9 },
  { id: 'sec_10_testimonials_faqs', name: 'Contact, Policies & Trust', label: 'Trust', emoji: '💬', color: '#059669', icon: 'fa-comments', order: 10 },
] as const;

export const TRAVEL_AGENCY_CORE_SECTION_IDS = [
  'sec_1_identity',
  'sec_2_ambience',
  'sec_5_experiences',
  'sec_8_connector',
  'sec_9_marketplace_catalog',
  'sec_10_testimonials_faqs',
] as const;

export function filterCoreSectionsForBusinessType(typeId?: string | null, sectionIds: string[] = []): string[] {
  const typeKey = String(typeId || '').toLowerCase();
  const isTravelAgency = /travel_agency|travel agency|tour operator|tourism|agency/i.test(typeKey) || /travel/i.test(typeKey);
  if (!isTravelAgency) return sectionIds;

  return [...new Set(sectionIds.map(resolveSectionId))];
}

export function resolveSectionId(id: string): string {
  return LEGACY_SECTION_ALIASES[id] || id;
}

export function normalizeSectionIds(value: unknown, fallbackToAll = false): string[] {
  let ids: unknown[] = [];
  if (Array.isArray(value)) ids = value;
  else if (typeof value === 'string') {
    try { ids = JSON.parse(value || '[]'); } catch { ids = []; }
  }
  const valid = ids
    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    .map(resolveSectionId);
  return valid.length || fallbackToAll ? [...new Set(valid.length ? valid : CANONICAL_SECTION_IDS)] : [];
}

export function getEffectiveSectionLabel(sectionId: string, fallbackName?: string, customData?: Record<string, any>, sectionControl?: Record<string, any> | null): string {
  const labelCandidates = [
    sectionControl?.custom_label,
    customData?.section_labels?.[sectionId],
    customData?.basic?.section_labels?.[sectionId],
    customData?.section_labels_ar?.[sectionId],
    customData?.basic?.section_labels_ar?.[sectionId],
    fallbackName,
    CANONICAL_SECTIONS.find((s) => s.id === sectionId)?.name,
    sectionId,
  ];

  const resolved = labelCandidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return resolved ? String(resolved).trim() : fallbackName || sectionId;
}

export function isSectionHidden(sectionId: string, customData?: Record<string, any>, sectionControl?: Record<string, any> | null, templateHidden: unknown[] = []): boolean {
  const normalizedId = resolveSectionId(sectionId);
  const hiddenFromCustom = Array.isArray(customData?.basic?.hidden_sections)
    ? customData.basic.hidden_sections
    : (Array.isArray(customData?.hidden_sections) ? customData.hidden_sections : []);

  const hiddenSet = new Set<string>([
    ...templateHidden.filter((id: unknown): id is string => typeof id === 'string').map(resolveSectionId),
    ...hiddenFromCustom.filter((id: unknown): id is string => typeof id === 'string').map(resolveSectionId),
  ]);

  if (sectionControl?.admin_hidden === 1 || sectionControl?.admin_hidden === true) {
    hiddenSet.add(normalizedId);
  }

  return hiddenSet.has(normalizedId) || hiddenSet.has(sectionId);
}

export function getSectionApprovalState(sectionId: string, customData?: Record<string, any>, sectionControl?: Record<string, any> | null): { approved: boolean; valid: boolean; reason?: string; data: Record<string, any> } {
  const normalizedId = resolveSectionId(sectionId);
  const sectionData = (customData && typeof customData === 'object' && (customData[normalizedId] || customData[sectionId])) || {};
  const approvalStatus = sectionData.approval_status || sectionData.section_approval_status || sectionControl?.approval_status;
  const showOnMinisite = sectionData.show_on_minisite ?? sectionData.show_on_public ?? sectionControl?.show_on_minisite ?? true;

  const adminHidden = sectionControl?.admin_hidden === 1 || sectionControl?.admin_hidden === true;
  if (adminHidden) {
    return { approved: false, valid: false, reason: 'admin_hidden', data: sectionData };
  }

  const isApproved = approvalStatus === undefined || approvalStatus === null || approvalStatus === 'approved' || approvalStatus === 'published';
  const isVisible = showOnMinisite !== false && showOnMinisite !== 0;
  const valid = isApproved && isVisible;

  return {
    approved: isApproved,
    valid,
    reason: !isApproved ? 'not_approved' : (!isVisible ? 'hidden' : undefined),
    data: sectionData,
  };
}

export function isSectionApprovedForMinisite(sectionId: string, customData?: Record<string, any>, sectionControl?: Record<string, any> | null): boolean {
  return getSectionApprovalState(sectionId, customData, sectionControl).valid;
}
