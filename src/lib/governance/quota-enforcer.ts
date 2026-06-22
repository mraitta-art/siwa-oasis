import { queryOne } from '@/lib/db';

export interface TierPolicy {
  maxBusinesses: number;
  canPublishMinisite: boolean;
  canCustomizeTemplate: boolean;
  maxImages: number;
  maxSlides: number;
  maxStorageMB: number;
  maxCustomBlocks: number;
  allowedSections?: string[];
}

/**
 * Fetch the dynamic policy for a specific tier from MySQL
 */
export async function getPolicyForTier(tierId: string): Promise<TierPolicy> {
  const tier = await queryOne<any>('SELECT features FROM subscription_tiers WHERE id = ?', [tierId]);
  if (!tier) {
    // Default fallback
    return {
      maxBusinesses: 1,
      canPublishMinisite: false,
      canCustomizeTemplate: false,
      maxImages: 5,
      maxSlides: 3,
      maxStorageMB: 10,
      maxCustomBlocks: 2,
      allowedSections: ['sec_1_identity', 'sec_2_ambience']
    };
  }
  return typeof tier.features === 'string' ? JSON.parse(tier.features) : tier.features;
}

/**
 * Check if a business has exceeded its tier's resource quota
 */
export async function checkQuota(businessId: string, resource: keyof TierPolicy, currentCount: number) {
  const business = await queryOne<any>('SELECT subscription_tier FROM businesses WHERE id = ?', [businessId]);
  if (!business) return { allowed: false, error: 'Business not found' };
  
  const policy = await getPolicyForTier(business.subscription_tier);
  const limit = policy[resource];
  
  if (typeof limit === 'number' && currentCount >= limit) {
    return { allowed: false, limit, error: `Quota exceeded: This tier allows max ${limit} ${resource}.` };
  }
  
  return { allowed: true };
}

/**
 * Check if a business has access to edit a specific section (checking tier + overrides)
 */
export async function checkSectionAccess(businessId: string, sectionId: string): Promise<{ allowed: boolean; error?: string }> {
  const business = await queryOne<any>('SELECT subscription_tier, admin_overrides FROM businesses WHERE id = ?', [businessId]);
  if (!business) return { allowed: false, error: 'Business not found' };

  // 1. Admin override check
  if (business.admin_overrides) {
    try {
      const overrides = typeof business.admin_overrides === 'string' ? JSON.parse(business.admin_overrides) : business.admin_overrides;
      if (Array.isArray(overrides?.allowed_sections) && overrides.allowed_sections.includes(sectionId)) {
        return { allowed: true };
      }
    } catch (e) {
      console.error("Failed to parse admin_overrides:", e);
    }
  }

  // 2. Subscription tier check
  const policy = await getPolicyForTier(business.subscription_tier);
  if (policy.allowedSections && policy.allowedSections.includes(sectionId)) {
    return { allowed: true };
  }

  return { 
    allowed: false, 
    error: `This section is locked for the current subscription tier (${business.subscription_tier}). Upgrade to unlock self-service editing.` 
  };
}
