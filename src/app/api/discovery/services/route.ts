import { NextRequest, NextResponse } from 'next/server';
import { getApprovedPublicServices } from '@/lib/vendor-service-policy';

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category') || undefined;
    const placement = (request.nextUrl.searchParams.get('placement') || 'marketplace') as 'minisite' | 'marketplace' | 'search' | 'packages';
    const services = await getApprovedPublicServices(category, placement);
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Service discovery error:', error);
    return NextResponse.json({ error: 'Failed to load services' }, { status: 500 });
  }
}