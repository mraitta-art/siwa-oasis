import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

export async function GET() {
  try {
    const tiers = await query(`
      SELECT st.*, mt.name as default_template_name 
      FROM subscription_tiers st
      LEFT JOIN minisite_templates mt ON st.default_template_id = mt.id
      ORDER BY st.price_amount ASC
    `);
    return NextResponse.json(tiers);
  } catch (error: any) {
    // Auto-heal: if default_template_id column doesn't exist, fall back
    if (error.message.includes('default_template_id')) {
      try {
        await execute('ALTER TABLE subscription_tiers ADD COLUMN IF NOT EXISTS default_template_id VARCHAR(100) DEFAULT NULL');
        const tiers = await query('SELECT * FROM subscription_tiers ORDER BY price_amount ASC');
        return NextResponse.json(tiers);
      } catch (e2: any) {
        return NextResponse.json({ error: e2.message }, { status: 500 });
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, price_amount, price_period, features, default_template_id } = body;
    
    await query(
      'INSERT INTO subscription_tiers (id, name, price_amount, price_period, features, default_template_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, price_amount, price_period, JSON.stringify(features), default_template_id || null]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, price_amount, price_period, features, default_template_id } = body;
    
    // UPSERT: Create if it doesn't exist, update if it does.
    await query(
      `INSERT INTO subscription_tiers (id, name, price_amount, price_period, features, default_template_id) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE name = VALUES(name), price_amount = VALUES(price_amount), price_period = VALUES(price_period), features = VALUES(features), default_template_id = VALUES(default_template_id)`,
      [id, name, price_amount, price_period, JSON.stringify(features), default_template_id || null]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
