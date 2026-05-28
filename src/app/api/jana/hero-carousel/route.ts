import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';

// GET: Load hero carousel slides
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId') || 'main';
    const configType = `hero_carousel_${siteId}`;
    const results = await query(
      `SELECT config FROM website_configs WHERE type = ? LIMIT 1`,
      [configType]
    );
    
    if (results.length > 0) {
      const config = typeof results[0].config === 'string' 
        ? JSON.parse(results[0].config) 
        : results[0].config;
      return NextResponse.json({ ...(config || { slides: [] }), siteId });
    }



    return NextResponse.json({ slides: [], siteId });
  } catch (e: any) {
    console.error('Failed to load hero carousel:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Save hero carousel slides
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { slides, siteId = 'main' } = body;
    const configType = `hero_carousel_${siteId}`;
    
    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'Slides array is required' },
        { status: 400 }
      );
    }
    
    // Validate each slide
    for (const slide of slides) {
      if (!slide.id || !slide.type || !slide.mediaUrl) {
        return NextResponse.json(
          { error: 'Each slide must have id, type, and mediaUrl' },
          { status: 400 }
        );
      }
    }
    
    const config = JSON.stringify({ slides, siteId });
    
    // Insert or update
    await execute(
      `INSERT INTO website_configs (type, config, updated_at) 
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       config = VALUES(config),
       updated_at = VALUES(updated_at)`,
      [configType, config]
    );
    
    invalidateCache.websiteSettings();
    
    return NextResponse.json({ 
      success: true, 
      message: `Saved ${slides.length} slides for ${siteId}`,
      slideCount: slides.length 
    });
  } catch (e: any) {
    console.error('Failed to save hero carousel:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Delete hero carousel config
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId') || 'main';
    const configType = `hero_carousel_${siteId}`;
    
    await execute(
      `DELETE FROM website_configs WHERE type = ?`,
      [configType]
    );
    
    invalidateCache.websiteSettings();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
