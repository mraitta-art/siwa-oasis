import { NextRequest, NextResponse } from 'next/server';
import { getAllPages, getPageLayout } from '@/lib/jana/page-builder-service';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug') || 'main';

    // Try to fetch named page layout
    const page = await getPageLayout(slug) || null;
    if (!page) {
      return NextResponse.json({ sections: [] });
    }

    // Map blocks to simple section descriptors
    const sections = (page.blocks || []).map(b => ({
      id: b.id || (b.props && b.props.sectionId) || `${b.type}_${b.order}`,
      name: b.props?.title || b.type || `section_${b.order}`
    }));

    return NextResponse.json({ sections });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
