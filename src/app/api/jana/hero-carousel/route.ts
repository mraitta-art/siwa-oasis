import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';

// GET: Load hero carousel slides
export async function GET(request: NextRequest) {
  try {
    const results = await query(
      `SELECT config FROM website_configs WHERE type = 'hero_carousel' LIMIT 1`
    );
    
    if (results.length === 0) {
      return NextResponse.json({ slides: [] });
    }
    
    const config = typeof results[0].config === 'string' 
      ? JSON.parse(results[0].config) 
      : results[0].config;
    
    return NextResponse.json(config || { slides: [] });
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
    const { slides } = body;
    
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
      
      // Validate YouTube URL if type is youtube
      if (slide.type === 'youtube') {
        // More flexible YouTube URL validation
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)|[a-zA-Z0-9_-]{11}/;
        
        // Check if it contains a video ID (11 characters)
        const hasVideoId = slide.mediaUrl.match(/[a-zA-Z0-9_-]{11}/);
        const isYouTubeUrl = youtubeRegex.test(slide.mediaUrl);
        
        if (!isYouTubeUrl && !hasVideoId) {
          return NextResponse.json(
            { error: `Invalid YouTube URL for slide: ${slide.id}. Use format: https://www.youtube.com/watch?v=VIDEO_ID` },
            { status: 400 }
          );
        }
      }
    }
    
    const config = JSON.stringify({ slides });
    
    // Insert or update
    await execute(
      `INSERT INTO website_configs (type, config, updated_at) 
       VALUES ('hero_carousel', ?, NOW())
       ON DUPLICATE KEY UPDATE 
       config = VALUES(config),
       updated_at = VALUES(updated_at)`,
      [config]
    );
    
    // Invalidate cache
    invalidateCache.websiteSettings();
    
    return NextResponse.json({ 
      success: true, 
      message: `Saved ${slides.length} slides`,
      slideCount: slides.length 
    });
  } catch (e: any) {
    console.error('Failed to save hero carousel:', e);
    return NextResponse.json(
      { error: 'Failed to save slides: ' + e.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete hero carousel config
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    
    await execute(
      `DELETE FROM website_configs WHERE type = 'hero_carousel'`
    );
    
    invalidateCache.websiteSettings();
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
