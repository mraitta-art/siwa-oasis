import { NextResponse } from 'next/server';

/**
 * DEPRECATED.
 *
 * This route created a business without ever passing a market, so a compound
 * meant for El Alamein quietly landed in the default market, and it wrote a
 * hard-coded 4-page shell that the current wizard no longer reads. It has no
 * callers: the orchestrator now posts to `/api/jana/orchestrator/provision`, the
 * single market-aware write path that can also stand up a development. It is kept
 * only so that any stale bookmark gets a clear pointer instead of a silent,
 * wrong-side write.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'This endpoint is deprecated. Use /api/jana/orchestrator/provision, which is market-aware and can create a development as well as a listing.',
      rule: 'ENDPOINT_DEPRECATED',
    },
    { status: 410 }
  );
}
