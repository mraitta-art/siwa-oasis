import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Define exactly what the components JSONB looks like in the DB
export type TierComponents = {
  carousel?: { enabled: boolean; max_slides: number };
  gallery?: { enabled: boolean; max_images: number };
  contact?: { methods: ('phone' | 'email' | 'whatsapp' | 'social')[] };
  booking_form?: { enabled: boolean };
  minisite?: { enabled: boolean; max_pages: number };
}

// Fetch the current vendor's policy matrix directly from the DB
export async function getVendorPolicy(businessId: string): Promise<TierComponents | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  // 1. Get the business's tier
  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .select('subscription_tier')
    .eq('id', businessId)
    .single()

  if (bizErr || !biz) return null;

  // 2. Fetch the corresponding tier policy components
  const { data: tier, error: tierErr } = await supabase
    .from('subscription_tiers')
    .select('components')
    .eq('id', biz.subscription_tier)
    .single()

  if (tierErr || !tier) return null;

  return tier.components as TierComponents;
}

// ==========================================
// Policy Gatekeeper Functions
// ==========================================

export async function canUseFeature(businessId: string, featureKey: keyof TierComponents): Promise<boolean> {
  const policy = await getVendorPolicy(businessId);
  if (!policy || !policy[featureKey]) return false;
  
  const feature = policy[featureKey] as any;
  return feature.enabled === true;
}

export async function getTierLimit(businessId: string, limitKey: 'max_slides' | 'max_images' | 'max_pages'): Promise<number> {
  const policy = await getVendorPolicy(businessId);
  if (!policy) return 0;

  if (limitKey === 'max_slides') return policy.carousel?.max_slides || 0;
  if (limitKey === 'max_images') return policy.gallery?.max_images || 0;
  if (limitKey === 'max_pages') return policy.minisite?.max_pages || 0;
  
  return 0;
}

export async function canUseContactMethod(businessId: string, method: 'phone' | 'email' | 'whatsapp' | 'social'): Promise<boolean> {
  const policy = await getVendorPolicy(businessId);
  if (!policy || !policy.contact || !policy.contact.methods) return false;
  return policy.contact.methods.includes(method);
}
