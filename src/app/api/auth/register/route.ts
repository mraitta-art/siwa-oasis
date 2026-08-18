import { NextRequest, NextResponse } from 'next/server';
import { execute, transaction } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // Toggle public registration via environment variable: set DISABLE_PUBLIC_REGISTRATION=true to close
  const isTesting = process.env.DISABLE_PUBLIC_REGISTRATION === 'true';
  if (isTesting) {
    return NextResponse.json({
      error: 'Public registration is temporarily disabled by configuration.'
    }, { status: 503 });
  }

  try {
    const { businessName, email, password, typologyId } = await request.json();
    
    if (!businessName || !email || !password || !typologyId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Use a transaction so both inserts succeed or fail together
    const businessId = crypto.randomUUID();
    const slug = businessName.toLowerCase().replace(/\s+/g, '-');

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    await transaction(async (conn) => {
      await conn.query(
        `INSERT INTO businesses (id, name, slug, type_id, vendor_id, subscription_tier, status, is_trusted, minisite_visible_until, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())`,
        [businessId, businessName, slug, typologyId, userId, 'free', 'pending']
      );

      await conn.query(
        `INSERT INTO profiles (id, email, password_hash, role, display_name, business_id, active, verification_status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'unverified', NOW())`,
        [userId, email, passwordHash, 'vendor', businessName, businessId, 0]
      );
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted! A Siwa Today admin will review your heritage business soon.' 
    });
  } catch (e: any) {
    console.error('Registration failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
