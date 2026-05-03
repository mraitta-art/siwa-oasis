import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getCacheStats, invalidateCache, revalidateCache } from '@/lib/cache';

/**
 * Cache Management API
 * GET /api/admin/cache/stats - Get cache statistics
 * POST /api/admin/cache/invalidate - Invalidate specific or all caches
 * POST /api/admin/cache/revalidate - Force revalidation of specific cache
 */

export async function GET() {
  try {
    await requireAdmin();
    
    const stats = getCacheStats();
    
    return NextResponse.json({
      success: true,
      cache: stats,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const { action, target } = body;

    if (action === 'invalidate') {
      if (!target || target === 'all') {
        invalidateCache.all();
        return NextResponse.json({ success: true, message: 'All caches invalidated' });
      }

      // Invalidate specific cache
      switch (target) {
        case 'business_types':
          invalidateCache.businessTypes();
          break;
        case 'sections':
          invalidateCache.sections();
          break;
        case 'field_definitions':
          invalidateCache.fieldDefinitions();
          break;
        case 'locations':
          invalidateCache.locations();
          break;
        case 'website_settings':
          invalidateCache.websiteSettings();
          break;
        case 'form_fields':
          invalidateCache.formFields();
          break;
        default:
          return NextResponse.json({ error: `Unknown cache target: ${target}` }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: `Cache invalidated: ${target}` });
    }

    if (action === 'revalidate') {
      if (!target) {
        return NextResponse.json({ error: 'Target required for revalidation' }, { status: 400 });
      }

      let result;
      switch (target) {
        case 'business_types':
          result = await revalidateCache.businessTypes();
          break;
        case 'sections':
          result = await revalidateCache.sections();
          break;
        case 'field_definitions':
          result = await revalidateCache.fieldDefinitions();
          break;
        case 'locations':
          result = await revalidateCache.locations();
          break;
        case 'website_settings':
          result = await revalidateCache.websiteSettings();
          break;
        default:
          return NextResponse.json({ error: `Unknown cache target: ${target}` }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Cache revalidated: ${target}`,
        data: result 
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use "invalidate" or "revalidate"' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
