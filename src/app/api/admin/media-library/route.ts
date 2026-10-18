import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface MediaItem {
  url: string;
  source: 'upload' | 'vendor_gallery' | 'catalog';
  name?: string;
}

export async function GET(req: NextRequest) {
  try {
    const results: MediaItem[] = [];
    const seen = new Set<string>();

    const addUrl = (url: string | null | undefined, source: MediaItem['source'], name?: string) => {
      if (!url || typeof url !== 'string') return;
      const cleanUrl = url.trim();
      if (!cleanUrl || seen.has(cleanUrl)) return;
      seen.add(cleanUrl);
      results.push({ url: cleanUrl, source, name });
    };

    // 1. Scan public/uploads directory for local uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      try {
        const files = fs.readdirSync(uploadsDir);
        // Sort newest first
        files
          .filter(f => /\.(jpe?g|png|webp|gif|svg)$/i.test(f))
          .slice(-60)
          .reverse()
          .forEach(file => {
            addUrl(`/uploads/${file}`, 'upload', file);
          });
      } catch (err) {
        console.warn('[MEDIA LIBRARY] Could not read public/uploads:', err);
      }
    }

    // 2. Query uploaded_files table if it exists
    try {
      const dbUploads = await query<any>(
        'SELECT url, localUrl, file_name FROM uploaded_files ORDER BY created_at DESC LIMIT 60'
      );
      if (Array.isArray(dbUploads)) {
        dbUploads.forEach(row => {
          addUrl(row.url || row.localUrl, 'upload', row.file_name);
        });
      }
    } catch {
      // Ignore if table missing
    }

    // 3. Query vendor_gallery images
    try {
      const galleryRows = await query<any>(
        'SELECT url, caption FROM vendor_gallery ORDER BY created_at DESC LIMIT 60'
      );
      if (Array.isArray(galleryRows)) {
        galleryRows.forEach(row => {
          addUrl(row.url, 'vendor_gallery', row.caption);
        });
      }
    } catch {
      // Ignore if table missing
    }

    // 4. Default high-quality Siwa Oasis curated photos
    const CURATED_SIWA_PHOTOS = [
      { name: 'Taziry Mud-Brick Ecolodge', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80' },
      { name: 'Salt Lakes Mineral Pools', url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80' },
      { name: 'Great Sand Sea 4x4 Dunes', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80' },
      { name: 'Ancient Shali Fortress', url: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800&q=80' },
      { name: 'Bir Wahed Hot Spring', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
      { name: 'Desert Night Stargazing', url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&q=80' },
      { name: 'Olive Grove & Date Palms', url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=80' },
      { name: 'Luxury Desert Glamping Tent', url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&q=80' },
      { name: 'Palm Garden Oasis Resort', url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80' },
      { name: 'Safari Land Cruiser Fleet', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80' },
      { name: 'Local Eco Buggy Shuttle', url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80' },
      { name: 'VIP Transit Coach', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80' },
      { name: 'Bedouin Mandi Lamb Feast', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80' },
      { name: 'Organic Vegan Harvest Spread', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80' },
      { name: 'Heritage Breakfast Table', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80' },
    ];

    CURATED_SIWA_PHOTOS.forEach(p => addUrl(p.url, 'catalog', p.name));

    return NextResponse.json({
      success: true,
      count: results.length,
      images: results,
    });
  } catch (error: any) {
    console.error('[API /api/admin/media-library] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load media library' },
      { status: 500 }
    );
  }
}
