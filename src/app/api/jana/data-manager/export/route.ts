import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/** Export all configuration tables */
export async function GET() {
  try {
    await requireAdmin();
    
    const tables = [
      'profiles',
      'locations',
      'business_types',
      'sections',
      'field_definitions',
      'form_fields',
      'custom_expressions',
      'subscription_tiers',
      'search_policies',
      'businesses',
      'search_engines',
      'search_pages',
      'website_templates',
      'website_configs',
      'card_templates',
      'minisite_templates',
      'experience_packages',
      'activity_log'
    ];

    const data: Record<string, any[]> = {};
    for (const table of tables) {
      data[table] = await query(`SELECT * FROM ${table}`);
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
