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
    
    await query(
      'UPDATE subscription_tiers SET name = ?, price_amount = ?, price_period = ?, features = ? WHERE id = ?',
      [name, price_amount, price_period, JSON.stringify(features), id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
