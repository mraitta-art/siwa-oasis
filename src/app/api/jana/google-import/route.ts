import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import crypto from 'crypto';

interface GooglePlaceData {
  name: string;
  address: string;
  phone: string;
  website: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: any[];
  photos: string[];
  placeId: string;
}

// Helper to create URL-friendly slugs
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

// POST: Resolve URL/query or save the imported business
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { action = 'fetch' } = body;

    // ─── ACTION 1: FETCH DATA ──────────────────────────────────────────────
    if (action === 'fetch') {
      const { urlOrQuery } = body;
      if (!urlOrQuery?.trim()) {
        return NextResponse.json({ error: 'Search query or Google Maps URL is required' }, { status: 400 });
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;

      // Clean search query from URL if pasted
      let searchQuery = urlOrQuery.trim();
      if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
        try {
          const url = new URL(searchQuery);
          if (url.pathname.includes('/place/')) {
            const parts = url.pathname.split('/place/');
            if (parts[1]) {
              searchQuery = decodeURIComponent(parts[1].split('/')[0].replace(/\+/g, ' '));
            }
          } else {
            const q = url.searchParams.get('q');
            if (q) searchQuery = q;
          }
        } catch {}
      }

      // Check if API Key is configured
      if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
        // FALLBACK: Sandbox Mode with high-quality mock data for testing
        console.warn('[Google Import] API Key is missing. Running in Sandbox Demo Mode.');
        const mockData: GooglePlaceData = {
          name: 'Al Babenshal Eco-Lodge Siwa',
          address: 'Shali Fortress, Old Town, Siwa Oasis, Egypt',
          phone: '+20 46 4602266',
          website: 'http://albabenshal.com',
          lat: 29.20234,
          lng: 25.51862,
          rating: 4.6,
          reviews: [
            {
              author_name: 'Sarah Jenkins (Local Guide)',
              rating: 5,
              text: 'Staying at Al Babenshal was like stepping back in time. Built right into the walls of the ancient Shali Fortress using traditional mud-brick (Kershef). Outstanding hospitality and desert sunset views.',
              time: Math.floor(Date.now() / 1000) - 86400 * 5,
            },
            {
              author_name: 'Ahmed Mansour (Local Guide)',
              rating: 4,
              text: 'Authentic eco-lodge. No AC or modern luxury, but very clean, beautiful traditional design, and situated right in the center of Siwa town. Highly recommended.',
              time: Math.floor(Date.now() / 1000) - 86400 * 20,
            }
          ],
          photos: [
            'https://res.cloudinary.com/di8icdism/image/upload/v1717202300/siwa_lodge_demo1.jpg',
            'https://res.cloudinary.com/di8icdism/image/upload/v1717202300/siwa_lodge_demo2.jpg'
          ],
          placeId: 'mock_place_al_babenshal_siwa'
        };

        return NextResponse.json({
          success: true,
          isDemoSandbox: true,
          place: mockData,
          message: 'Currently running in Demo Sandbox Mode (API Key missing).'
        });
      }

      // Live Fetch from Google Places API
      try {
        // 1. Text Search to resolve Place ID
        const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
        const findRes = await fetch(findUrl);
        const findData = await findRes.json();
        
        if (findData.status !== 'OK' || !findData.candidates?.[0]) {
          return NextResponse.json({ error: `Could not find any Google place for: "${searchQuery}"` }, { status: 404 });
        }
        
        const placeId = findData.candidates[0].place_id;

        // 2. Place Details call to fetch rich attributes
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,formatted_address,website,geometry,rating,reviews,photos&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (detailsData.status !== 'OK' || !detailsData.result) {
          return NextResponse.json({ error: `Failed to fetch Place details from Google Maps` }, { status: 500 });
        }

        const result = detailsData.result;
        
        // Map photos to direct rendering URLs
        const photos = (result.photos || []).slice(0, 3).map((p: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${apiKey}`
        );

        const place: GooglePlaceData = {
          name: result.name || '',
          address: result.formatted_address || '',
          phone: result.formatted_phone_number || '',
          website: result.website || '',
          lat: result.geometry?.location?.lat || 29.2023,
          lng: result.geometry?.location?.lng || 25.5186,
          rating: result.rating || 0,
          reviews: (result.reviews || []).map((r: any) => ({
            author_name: r.author_name,
            rating: r.rating,
            text: r.text,
            time: r.time
          })),
          photos,
          placeId
        };

        return NextResponse.json({
          success: true,
          isDemoSandbox: false,
          place
        });
      } catch (e: any) {
        console.error('Google Places fetch failed:', e);
        return NextResponse.json({ error: `Connection to Google API failed: ${e.message}` }, { status: 500 });
      }
    }

    // ─── ACTION 2: SAVE BUSINESS & NOTIFY ADMIN ────────────────────────────
    if (action === 'save') {
      const { name, type_id, google_place_id, contributor_name, google_data } = body;
      
      if (!name || !type_id || !google_place_id) {
        return NextResponse.json({ error: 'Name, typology, and Google Place ID are required to import' }, { status: 400 });
      }

      // Format custom_data matching core typology schema
      const custom_data = {
        basic: {
          name,
          description: `Imported from Google Maps. Rating: ${google_data.rating}⭐.`,
        },
        location: {
          address: google_data.address || '',
          lat: google_data.lat || 29.2023,
          lng: google_data.lng || 25.5186
        },
        contact: {
          phone: google_data.phone || '',
          website: google_data.website || ''
        },
        google_contribution: {
          google_place_id,
          rating: google_data.rating || 0,
          reviews: google_data.reviews || [],
          contributor_name: contributor_name || 'Anonymous Contributor',
          contributed_at: new Date().toISOString()
        }
      };

      const slug = slugify(name);
      
      // Auto-assign default template for 'free' subscription tier
      let template_id = null;
      try {
        const tierRow = await queryOne('SELECT default_template_id FROM subscription_tiers WHERE id = "free"') as any;
        if (tierRow?.default_template_id) {
          template_id = tierRow.default_template_id;
        }
      } catch {}

      const id = crypto.randomUUID();

      // Save into DB under 'pending' status for admin approval
      await execute(
        `INSERT INTO businesses (id, name, slug, type_id, subscription_tier, template_id, custom_data, status, published, approved_by_vendor) 
         VALUES (?, ?, ?, ?, 'free', ?, ?, 'pending', 1, 0)`,
        [id, name, slug, type_id, template_id, JSON.stringify(custom_data)]
      );

      // Create Admin Dashboard Activity Log Notification
      try {
        const displayContributor = contributor_name?.trim() || 'Google Local Guide';
        await execute(
          `INSERT INTO activity_log (message, user_email) VALUES (?, ?)`,
          [`Google Import: New business "${name}" imported by contributor "${displayContributor}".`, 'system']
        );

        // Audit Log Entry
        await execute(
          `INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), user.id, user.email, user.role, 'import_business', `Imported via Google Maps: ${name} (Place ID: ${google_place_id})`]
        );
      } catch (e) {
        console.warn('Dashboard activity log notification skipped:', e);
      }

      return NextResponse.json({
        success: true,
        id,
        slug,
        name
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    console.error('Google Import Error:', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: e.message?.includes('authenticated') ? 401 : 500 });
  }
}
