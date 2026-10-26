import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { generateMarketingPack } from '@/lib/marketing-content';
import {
  loadBusinessForMarketing,
  saveMarketingPack,
  getStoredPack,
  publishCaptionsAsDrafts,
} from '@/lib/marketing-store';

export const dynamic = 'force-dynamic';

/**
 * The per-business marketing pack.
 *
 * GET  ?business_id=X  → the stored pack (so the desk can reload past work).
 * POST { business_id, save?, publish_captions? } → generate for that business,
 *      optionally save it as a draft, optionally push captions into the blog.
 *
 * Generation never throws: without a GEMINI_API_KEY the market-aware fallback
 * still returns a full, correct pack.
 */

function failure(error: any) {
  const message = String(error?.message || 'Marketing generation failed');
  const status = /not authenticated|admin access required/i.test(message) ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const businessId = request.nextUrl.searchParams.get('business_id');
    if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 });
    const pack = await getStoredPack(businessId);
    return NextResponse.json({ pack });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const businessId = String(body?.business_id || '').trim();
    if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 });

    const ctx = await loadBusinessForMarketing(businessId);
    if (!ctx) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const pack = await generateMarketingPack({
      market: ctx.market,
      businessName: ctx.businessName,
      businessNameAr: ctx.businessNameAr,
      typeId: ctx.typeId,
      typologyLabel: ctx.typologyLabel,
      location: ctx.location,
      currency: ctx.currency,
      marketNameEn: ctx.marketNameEn,
      marketNameAr: ctx.marketNameAr,
    });

    let savedPostId: string | null = null;
    if (body?.save) savedPostId = await saveMarketingPack(businessId, pack);

    let captionsInserted = 0;
    if (body?.publish_captions) {
      if (!savedPostId) savedPostId = await saveMarketingPack(businessId, pack);
      captionsInserted = await publishCaptionsAsDrafts(businessId, pack);
    }

    return NextResponse.json({ pack, saved: Boolean(savedPostId), saved_post_id: savedPostId, captions_inserted: captionsInserted });
  } catch (error) {
    return failure(error);
  }
}
