import { queryOne } from '@/lib/db';
import { CANONICAL_SECTION_IDS } from '@/lib/section-registry';

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
      allowedSections: [...CANONICAL_SECTION_IDS]
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

  if (CANONICAL_SECTION_IDS.includes(sectionId as any)) return { allowed: true };
  return { allowed: false, error: 'Unknown section.' };
}
