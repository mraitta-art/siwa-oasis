import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/** Import configuration data */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const data = await request.json();
    
    // Supported tables for bulk import
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

    for (const table of tables) {
      if (!data[table] || !Array.isArray(data[table])) continue;
      
      // Basic clear and replace strategy
      // In production, you'd want a more surgical UPSERT
      await execute(`DELETE FROM ${table}`);
      
      const rows = data[table];
      if (rows.length === 0) continue;

      const keys = Object.keys(rows[0]);
      const placeholders = keys.map(() => '?').join(',');
      const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;

      for (const row of rows) {
        const values = keys.map(k => {
          const v = row[k];
          return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v;
        });
        await execute(sql, values);
      }
    }

    await execute('INSERT INTO activity_log (message, user_email) VALUES (?, ?)', [
      'System state bulk imported via Data Manager', user.email
    ]);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Import error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
