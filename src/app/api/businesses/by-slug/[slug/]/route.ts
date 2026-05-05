import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
      `SELECT b.*, t.features as tier_features 
       FROM businesses b 
       JOIN subscription_tiers t ON b.subscription_tier = t.id 
       WHERE b.slug = ?`,
      [slug]
    );

    if (!biz) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json(biz);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
