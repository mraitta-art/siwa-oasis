import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/discovery/vibe-config
 * Pulls the dynamic configuration for the homepage vibe search
 * source: 'experience_vibe' section metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const engineId = searchParams.get('engineId');

    let targetFields = ["vibe_tags"]; // Default baseline

    // 1. DISCOVERY: Find all fields from sections marked as 'is_filterable'
    const filterableSections: any[] = await query("SELECT id FROM sections WHERE is_filterable = 1");
    if (filterableSections.length > 0) {
      const sectionIds = filterableSections.map(s => s.id);
      const sectionPlaceholders = sectionIds.map(() => '?').join(',');
      const autoFields: any[] = await query(
        `SELECT name FROM form_fields WHERE section_id IN (${sectionPlaceholders}) AND field_type IN ('select', 'multiselect', 'checkbox_group')`,
        sectionIds
      );
      autoFields.forEach(f => {
        if (!targetFields.includes(f.name)) targetFields.push(f.name);
      });
    }

    // 2. SPECIFIC: Add fields allowed by the specific engine
    if (engineId) {
      const [engine]: any = await query("SELECT allowed_fields FROM search_engines WHERE id = ?", [engineId]);
      if (engine && engine.allowed_fields) {
        const engineFields = typeof engine.allowed_fields === 'string' ? JSON.parse(engine.allowed_fields) : engine.allowed_fields;
        engineFields.forEach((f: string) => {
          if (!targetFields.includes(f)) targetFields.push(f);
        });
      }
    }

    if (targetFields.length === 0) return NextResponse.json({ options: [] });

    // 3. AGGREGATION: Fetch options for all identified fields
    const placeholders = targetFields.map(() => '?').join(',');
    const fields: any[] = await query(
      `SELECT options FROM form_fields WHERE name IN (${placeholders})`,
      targetFields
    );

    const allOptions = fields.flatMap(f => {
      if (!f.options) return [];
      const opts = typeof f.options === 'string' ? JSON.parse(f.options) : f.options;
      return Array.isArray(opts) ? opts : [];
    });

    // Remove duplicates and sort
    const uniqueOptions = Array.from(new Set(allOptions)).sort();

    return NextResponse.json({ options: uniqueOptions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
