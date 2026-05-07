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

    let targetFields = ["vibe_tags"]; // Default

    if (engineId) {
      const [engine]: any = await query("SELECT allowed_fields FROM search_engines WHERE id = ?", [engineId]);
      if (engine && engine.allowed_fields) {
        targetFields = typeof engine.allowed_fields === 'string' ? JSON.parse(engine.allowed_fields) : engine.allowed_fields;
      }
    }

    if (targetFields.length === 0) return NextResponse.json({ options: [] });

    // Fetch options for all allowed fields
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

    // Remove duplicates
    const uniqueOptions = Array.from(new Set(allOptions));

    return NextResponse.json({ options: uniqueOptions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
