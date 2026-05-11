import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

/**
 * GET BUSINESS BY SLUG
 * Enables vanity URLs like /adrere-amellal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const [biz] = await query(
      `SELECT b.*, t.features as tier_features, mt.settings as template_features 
       FROM businesses b 
       LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id 
       LEFT JOIN minisite_templates mt ON b.template_id = mt.id
       WHERE b.slug = ?`,
      [slug]
    );

    if (!biz) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Robust JSON Parsing
    const result = { ...biz } as any;
    try {
      if (typeof result.custom_data === 'string') result.custom_data = JSON.parse(result.custom_data);
      if (typeof result.tier_features === 'string') result.tier_features = JSON.parse(result.tier_features);
      if (typeof result.template_features === 'string') result.template_features = JSON.parse(result.template_features);
    } catch (e) {
      console.warn('JSON parsing failed for business:', slug, e);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
