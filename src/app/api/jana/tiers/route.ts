import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const tiers = await query('SELECT * FROM subscription_tiers ORDER BY price_amount ASC');
    return NextResponse.json(tiers);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, price_amount, price_period, features } = body;
    
    await query(
      'INSERT INTO subscription_tiers (id, name, price_amount, price_period, features) VALUES (?, ?, ?, ?, ?)',
      [id, name, price_amount, price_period, JSON.stringify(features)]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, price_amount, price_period, features } = body;
    
    // UPSERT: Create if it doesn't exist, update if it does.
    await query(
      `INSERT INTO subscription_tiers (id, name, price_amount, price_period, features) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE name = VALUES(name), price_amount = VALUES(price_amount), price_period = VALUES(price_period), features = VALUES(features)`,
      [id, name, price_amount, price_period, JSON.stringify(features)]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
