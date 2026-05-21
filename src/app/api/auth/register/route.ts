import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // 🚧 MAINTENANCE MODE: Unactivated until testing is complete
  const isTesting = true; 
  if (isTesting) {
    return NextResponse.json({ 
      error: 'The Siwa Today registry is currently undergoing final architectural testing. Public applications will open soon.' 
    }, { status: 503 });
  }

  try {
    const { businessName, email, password, typologyId } = await request.json();
    
    if (!businessName || !email || !password || !typologyId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // 1. Create the Business Record (Status: PENDING)
    const businessId = crypto.randomUUID();
    const slug = businessName.toLowerCase().replace(/\s+/g, '-');
    
    await execute(
      `INSERT INTO businesses (id, name, slug, typology, subscription_tier, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [businessId, businessName, slug, typologyId, 'free', 'pending']
    );

    // 2. Create the User Profile
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    
    await execute(
      `INSERT INTO profiles (id, email, password_hash, role, display_name, business_id, active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, email, passwordHash, 'vendor', businessName, businessId, 0] // Active = 0 (Pending Admin Approval)
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted! A Siwa Today admin will review your heritage business soon.' 
    });
  } catch (e: any) {
    console.error('Registration failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
