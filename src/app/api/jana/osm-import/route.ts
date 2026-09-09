import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';

const SIWA_BBOX = '29.10,25.35,29.35,25.75';
const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}

function classify(tags: Record<string, string> = {}) {
  const text = `${tags.tourism || ''} ${tags.name || ''} ${tags.description || ''}`.toLowerCase();
  if (text.includes('camp')) return 'camp';
  if (text.includes('villa')) return 'villa';
  if (text.includes('guest')) return 'guest_house';
  if (text.includes('lodge')) return 'eco_lodge';
  return 'hotel';
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const queryText = request.nextUrl.searchParams.get('q')?.trim() || 'accommodation';
    const overpassQuery = `[out:json][timeout:30];(nwr[\"tourism\"~\"hotel|guest_house|hostel|motel|camp|resort\"](${SIWA_BBOX});nwr[\"building\"=hotel](${SIWA_BBOX}););out center tags;`;
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'SiwaOasisAdmin/1.0' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });
    if (!response.ok) return NextResponse.json({ error: 'OpenStreetMap search is temporarily unavailable' }, { status: 502 });
    const payload = await response.json();
    const normalizedQuery = queryText.toLowerCase();
    const results = (payload.elements || [])
      .map((element: any) => {
        const tags = element.tags || {};
        const lat = element.lat ?? element.center?.lat ?? null;
        const lng = element.lon ?? element.center?.lon ?? null;
        return {
          source: 'openstreetmap',
          source_id: `${element.type}/${element.id}`,
          name: tags.name || tags['name:en'] || '',
          type_id: classify(tags),
          address: [tags['addr:street'], tags['addr:city'], tags['addr:country']].filter(Boolean).join(', '),
          phone: tags.phone || tags['contact:phone'] || '',
          website: tags.website || tags['contact:website'] || '',
          description: tags.description || '',
          lat,
          lng,
          tags,
          map_url: lat && lng ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}` : null,
        };
      })
      .filter((place: any) => place.name && (!normalizedQuery || place.name.toLowerCase().includes(normalizedQuery) || normalizedQuery === 'accommodation'))
      .slice(0, 200);
    return NextResponse.json({ source: 'OpenStreetMap', attribution: 'OpenStreetMap contributors', results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'OpenStreetMap import failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const place = body.place;
    if (!place?.source_id || !place.name) return NextResponse.json({ error: 'A valid OpenStreetMap place is required' }, { status: 400 });

    const duplicate = await queryOne("SELECT id, name FROM businesses WHERE JSON_UNQUOTE(JSON_EXTRACT(custom_data, '$.source.source_id')) = ? LIMIT 1", [place.source_id]) as any;
    if (duplicate) return NextResponse.json({ error: `Already imported as ${duplicate.name}`, id: duplicate.id }, { status: 409 });

    const typeId = body.type_id || place.type_id || 'hotel';
    const id = crypto.randomUUID();
    const customData = {
      sec_1_identity: { description: place.description || '', source_name: 'OpenStreetMap' },
      sec_2_ambience: {},
      sec_3_facilities: {},
      sec_4_gastronomy: {},
      sec_5_experiences: {},
      sec_6_guardian: {},
      sec_7_investment: {},
      sec_8_connector: {},
      sec_9_marketplace_catalog: {},
      sec_10_testimonials_faqs: {},
      location: { address: place.address || '', lat: place.lat, lng: place.lng, map_url: place.map_url },
      contact: { phone: place.phone || '', website: place.website || '' },
      source: { provider: 'openstreetmap', source_id: place.source_id, imported_at: new Date().toISOString(), tags: place.tags || {} },
    };
    await execute(
      `INSERT INTO businesses (id, name, slug, type_id, subscription_tier, custom_data, status, published, approved_by_vendor)
       VALUES (?, ?, ?, ?, 'free', ?, 'pending', 0, 0)`,
      [id, place.name, `${slugify(place.name)}-${id.slice(0, 8)}`, typeId, JSON.stringify(customData)]
    );
    try {
      await execute('INSERT INTO activity_log (message, user_email) VALUES (?, ?)', [`OpenStreetMap draft imported: ${place.name}`, user.email]);
    } catch {}
    return NextResponse.json({ success: true, id, status: 'pending', attribution: 'OpenStreetMap contributors' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not save OpenStreetMap draft' }, { status: 500 });
  }
}
