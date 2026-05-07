import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { tags, engineId } = await request.json();

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      const all: any = await query(`
        SELECT b.*, bt.name as type_name 
        FROM businesses b
        JOIN business_types bt ON b.type_id = bt.id
        WHERE b.active = 1
        LIMIT 20
      `);
      return NextResponse.json(all);
    }

    // 1. Resolve which fields/paths we should search
    let searchablePaths = ['$.experience_vibe.vibe_tags']; // Default

    if (engineId) {
      const engine: any = await query(`
        SELECT se.allowed_fields 
        FROM search_engines se 
        WHERE se.id = ?`, [engineId]
      );
      
      if (engine[0]?.allowed_fields) {
        const fieldNames = typeof engine[0].allowed_fields === 'string' ? JSON.parse(engine[0].allowed_fields) : engine[0].allowed_fields;
        
        // Fetch section_id for each field to build the JSON path
        const fields: any[] = await query(
          `SELECT name, section_id FROM form_fields WHERE name IN (${fieldNames.map(() => '?').join(',')})`,
          fieldNames
        );
        
        searchablePaths = fields.map(f => `$.${f.section_id}.${f.name}`);
      }
    }

    /**
     * DYNAMIC JSON SEARCH
     * For each tag, it must exist in AT LEAST ONE of the searchable paths.
     * All selected tags must be satisfied (Intersection).
     */
    const conditions: string[] = [];
    const params: any[] = [];

    tags.forEach(tag => {
      const pathConditions = searchablePaths.map(path => {
        params.push(tag);
        return `JSON_CONTAINS(custom_data, JSON_QUOTE(?), '${path}')`;
      }).join(' OR ');
      conditions.push(`(${pathConditions})`);
    });

    const results: any = await query(`
      SELECT b.*, bt.name as type_name 
      FROM businesses b
      JOIN business_types bt ON b.type_id = bt.id
      WHERE b.active = 1 AND ${conditions.join(' AND ')}
    `, params);

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('Vibe Search Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
