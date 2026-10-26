import { NextResponse } from 'next/server';
import {
  generateMarketingPack,
  generateSectionCopy,
  type PackInput,
  type SectionInput,
} from '@/lib/marketing-content';

export const dynamic = 'force-dynamic';

/**
 * Content generation for the minisite editors and the marketing desk.
 *
 * Two modes, one endpoint:
 *  • default (section) mode returns { story, title, story_ar, title_ar,
 *    metaDescription } — the exact shape DynamicForm and SectionContentStudio
 *    already read, so existing callers are untouched.
 *  • `mode: 'marketing_pack'` returns the full six-part bilingual pack.
 *
 * The market-aware logic and the offline fallback live in
 * `src/lib/marketing-content.ts`, so this route stays thin and the copy never
 * repeats the old Siwa-only assumptions.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    if (body?.mode === 'marketing_pack') {
      const pack = await generateMarketingPack(body as PackInput);
      return NextResponse.json(pack);
    }

    const copy = await generateSectionCopy({
      businessName: body?.businessName || 'Siwa Destination',
      sectionName: body?.sectionName || 'Overview',
      typology: body?.typology || 'Experience',
      market: body?.market || 'siwa',
      marketNameEn: body?.marketNameEn,
      marketNameAr: body?.marketNameAr,
    } as SectionInput);

    return NextResponse.json({
      story: copy.story,
      title: copy.title,
      story_ar: copy.story_ar,
      title_ar: copy.title_ar,
      metaDescription: copy.metaDescription,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Generation failed' }, { status: 500 });
  }
}
