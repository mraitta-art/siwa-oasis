import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * 🛰️ GLOBAL DATA FEED API (UPGRADED)
 * Orchestrates mass data synchronization across the business registry.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    if (!sectionId) return NextResponse.json({ error: 'Section ID required' }, { status: 400 });

    // Fetch all businesses and their custom_data
    const businesses = await query('SELECT id, custom_data FROM businesses');
    
    // Flatten the data for the specific section
    const results: any[] = [];
    businesses.forEach((biz: any) => {
      try {
        const dna = JSON.parse(biz.custom_data || '{}');
        const sectionData = dna[sectionId] || {};
        Object.entries(sectionData).forEach(([fieldName, value]) => {
          results.push({
            business_id: biz.id,
            field_name: fieldName,
            value: value
          });
        });
      } catch (e) { /* ignore parse errors */ }
    });

    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { sectionId, data } = await request.json();
    if (!sectionId || !data) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    // We process each business sequentially to ensure data integrity
    const businessIds = Object.keys(data);
    
    for (const bizId of businessIds) {
      const newSectionValues = data[bizId];
      
      // 1. Fetch current DNA
      const [biz] = await query('SELECT custom_data FROM businesses WHERE id = ?', [bizId]);
      if (!biz) continue;

      let dna: any = {};
      try {
        dna = JSON.parse(biz.custom_data || '{}');
      } catch (e) { dna = {}; }

      // 2. Merge new section data
      // Ensure the section object exists
      if (!dna[sectionId]) dna[sectionId] = {};
      
      // Update fields
      Object.entries(newSectionValues).forEach(([fName, val]) => {
        dna[sectionId][fName] = val;
      });

      // 3. Persist back to DB
      await execute(
        'UPDATE businesses SET custom_data = ? WHERE id = ?',
        [JSON.stringify(dna), bizId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
