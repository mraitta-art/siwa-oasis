import { NextResponse } from 'next/server';
import { executeSearch } from '@/lib/search-compare/search-query';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const engineId = searchParams.get('engineId') || 'se_full_discovery';
    const body = await request.json();
    const { filters, page, pageSize } = body;
    
    const results = await executeSearch(engineId, filters || {}, page || 1, pageSize || 10);
    
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
