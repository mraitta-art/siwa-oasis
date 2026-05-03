import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('[HEALTH] Starting database check...');
    console.log('[HEALTH] Environment:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    
    const result = await query('SELECT 1 as ok');
    console.log('[HEALTH] Database OK:', result);
    
    // Check if profiles table exists and count users
    const profiles = await query('SELECT COUNT(*) as count FROM profiles');
    console.log('[HEALTH] Profiles count:', profiles[0]?.count || 0);
    
    return NextResponse.json({ 
      status: 'ok', 
      database: 'connected',
      profileCount: profiles[0]?.count || 0 
    });
  } catch (error: any) {
    console.error('[HEALTH] Full error:', error);
    console.error('[HEALTH] Error code:', error.code);
    console.error('[HEALTH] Error message:', error.message);
    console.error('[HEALTH] Error stack:', error.stack);
    
    return NextResponse.json({ 
      status: 'error', 
      message: error.message || 'Unknown error',
      code: error.code,
      details: error.toString()
    }, { status: 500 });
  }
}
