import { NextRequest, NextResponse } from 'next/server';
import { compareDevelopments } from '@/lib/development-compare';

/**
 * Compare property projects (developments) side by side.
 *
 * The businesses comparison (`/api/compare/businesses`) lines up section fields
 * from `custom_data`. This one is the money view: price per m², size, handover,
 * facilities and the payment plan, with a worked instalment figure per project.
 *
 * Public read only — a visitor comparing compounds needs no session. Both verbs
 * return the same shape; GET exists so a shared link (`?ids=a,b,c`) renders
 * without a client round-trip, and POST is what the interactive picker calls.
 */

const MAX_PROJECTS = 4;

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get('ids') || request.nextUrl.searchParams.get('developmentIds') || '';
    const ids = raw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Provide at least one project id via ?ids=' }, { status: 400 });
    }
    if (ids.length > MAX_PROJECTS) {
      return NextResponse.json({ error: `Cannot compare more than ${MAX_PROJECTS} projects` }, { status: 400 });
    }

    const projects = await compareDevelopments(ids, MAX_PROJECTS);
    return respond(projects, ids);
  } catch (error: any) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.developmentIds)
      ? body.developmentIds.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid developmentIds' }, { status: 400 });
    }
    if (ids.length > MAX_PROJECTS) {
      return NextResponse.json({ error: `Cannot compare more than ${MAX_PROJECTS} projects` }, { status: 400 });
    }

    const projects = await compareDevelopments(ids, MAX_PROJECTS);
    return respond(projects, ids);
  } catch (error: any) {
    return fail(error);
  }
}

function respond(projects: Awaited<ReturnType<typeof compareDevelopments>>, requestedIds: string[]) {
  return NextResponse.json({
    success: true,
    projects,
    requestedCount: requestedIds.length,
    comparisonCount: projects.length,
    // Ids requested but not found (inactive or wrong) — the UI drops those columns.
    missingIds: requestedIds.filter((id) => !projects.some((p) => p.id === id)),
    maxProjects: MAX_PROJECTS,
  });
}

function fail(error: any) {
  console.error('Project comparison Error:', error);
  return NextResponse.json({ error: error?.message || 'Failed to compare projects' }, { status: 500 });
}
