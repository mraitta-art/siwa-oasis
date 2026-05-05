import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

/**
 * VANITY URL MIGRATION
 * Adds slug column and populates it for all businesses.
 */
export async function GET(req: NextRequest) {
  try {
    console.log("--- STARTING SLUG MIGRATION ---");
    
    try {
      await execute('ALTER TABLE businesses ADD COLUMN slug VARCHAR(255) UNIQUE AFTER name');
      console.log("Added slug column.");
    } catch (e) {
      console.log("Slug column likely exists.");
    }

    const businesses = await query('SELECT id, name FROM businesses');
    const updates = [];

    for (const b of businesses as any[]) {
      const slug = b.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      await execute('UPDATE businesses SET slug = ? WHERE id = ?', [slug, b.id]);
      updates.push({ name: b.name, slug: `/${slug}` });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Vanity URL slugs generated.',
      results: updates
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
