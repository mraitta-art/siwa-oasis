import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Fetch businesses — include all tiers so there's always content to show
    const businesses = await query(`
      SELECT id, name, type_id, custom_data, subscription_tier 
      FROM businesses 
      WHERE status = 'active' OR subscription_tier IN ('platinum', 'gold', 'premium', 'free', 'basic')
      LIMIT 10
    `);

    const slides: any[] = [];

    businesses.forEach((biz: any) => {
      const data = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data;

      // Find all sections that have the 'feature_on_main' toggle active
      Object.keys(data || {}).forEach(sid => {
        const sectionData = data[sid] || {};

        if (sectionData.feature_on_main === true || sectionData.feature_on_main === 'true') {
          // Check if it's a YouTube URL or has photos
          const youtubeUrl = sectionData.youtube_story; // Check for a dedicated video field
          let photos: any[] = [];
          if (typeof sectionData.section_gallery === 'string') {
            try { photos = JSON.parse(sectionData.section_gallery); if (!Array.isArray(photos)) photos = []; } catch { photos = []; }
          } else if (Array.isArray(sectionData.section_gallery)) {
            photos = sectionData.section_gallery;
          }
          const news = sectionData.section_news || '';

          if (youtubeUrl || photos.length > 0) {
            slides.push({
              id: `featured_${biz.id}_${sid}`,
              type: youtubeUrl ? 'youtube' : 'image',
              mediaUrl: youtubeUrl || photos[0]?.url || photos[0],
              title: biz.name.toUpperCase(),
              subtitle: photos[0]?.caption || news || `Experience the essence of ${biz.name}.`,
              caption: sid.toUpperCase().replace('_DNA', '').replace('_', ' ') + ' • ' + biz.name.toUpperCase(),
              ctaText: 'EXPLORE EXPERIENCE',
              ctaLink: `/business/${biz.id}`,
              animation: 'kenburns'
            });
          }
        }
      });
    });

    // Fallback: If no sections are toggled, pull the first business with photos
    if (slides.length === 0) {
      businesses.forEach((biz: any) => {
        const data = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data;
        const sid = Object.keys(data || {}).find(s => {
          const g = data[s]?.section_gallery;
          const hasGallery = typeof g === 'string' ? (() => { try { return JSON.parse(g).length > 0; } catch { return false; } })() : (Array.isArray(g) && g.length > 0);
          return hasGallery || data[s]?.youtube_story;
        });

        if (sid) {
          const section = data[sid];
          const isYT = !!section.youtube_story;
          let fallbackPhotos: any[] = [];
          if (typeof section.section_gallery === 'string') {
            try { fallbackPhotos = JSON.parse(section.section_gallery); } catch { fallbackPhotos = []; }
          } else if (Array.isArray(section.section_gallery)) {
            fallbackPhotos = section.section_gallery;
          }
          slides.push({
            id: `auto_${biz.id}`,
            type: isYT ? 'youtube' : 'image',
            mediaUrl: isYT ? section.youtube_story : (fallbackPhotos[0]?.url || fallbackPhotos[0]),
            title: biz.name.toUpperCase(),
            subtitle: section.section_news || `Discover the legacy of ${biz.name}.`,
            caption: 'FEATURED SELECTION',
            ctaText: 'VIEW MINISITE',
            ctaLink: `/business/${biz.id}`,
            animation: 'kenburns'
          });
        }
      });
    }

    return NextResponse.json({ slides });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
