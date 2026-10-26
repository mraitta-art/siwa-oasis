import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { generateMarketingPack } from '@/lib/marketing-content';
import { listMarketBusinessesForMarketing, saveMarketingPack } from '@/lib/marketing-store';

export const dynamic = 'force-dynamic';

/**
 * Bulk marketing-pack generation for one market, in a capped batch.
 *
 * POST { market, limit?, save? }  (limit defaults to 10, hard-capped to 25;
 * save defaults to true so a run actually persists reviewable drafts).
 *
 * It runs sequentially on purpose: with a Gemini key each call spends quota and
 * hits a rate limit, and without one it is cheap but still writes rows. The cap
 * is the guardrail against a single click touching every listing in the shared
 * live database — validate a batch first, then go wider.
 */

function failure(error: any) {
  const message = String(error?.message || 'Bulk marketing run failed');
  const status = /not authenticated|admin access required/i.test(message) ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const market = String(body?.market || '').trim().toLowerCase();
    if (!market) return NextResponse.json({ error: 'market is required' }, { status: 400 });

    const limit = Math.min(Math.max(Number(body?.limit) || 10, 1), 25);
    const shouldSave = body?.save !== false; // default true

    const businesses = await listMarketBusinessesForMarketing(market, limit);

    const results = [];
    for (const ctx of businesses) {
      try {
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
        if (shouldSave) await saveMarketingPack(ctx.id, pack);
        results.push({ id: ctx.id, name: ctx.businessName, generated_by: pack.generated_by, saved: shouldSave, ok: true });
      } catch (err: any) {
        results.push({ id: ctx.id, name: ctx.businessName, ok: false, error: err?.message || 'generation failed' });
      }
    }

    return NextResponse.json({
      market,
      requested: limit,
      processed: results.length,
      saved: results.filter((r) => r.saved).length,
      results,
    });
  } catch (error) {
    return failure(error);
  }
}
