import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { execute, query, queryOne } from '@/lib/db';
import { findDuplicateCandidates } from '@/lib/business-duplicate-detection';

function parseCustomJson(value: unknown) {
  if (!value) return {};
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return value;
}

function mergeBusinessData(target: Record<string, any>, candidate: Record<string, any>) {
  const merged = { ...target };
  const candidateSource = candidate.source_provenance || {};
  const targetSource = target.source_provenance || {};

  const mergedSourceProvenance = {
    ...targetSource,
    ...candidateSource,
    merged_sources: Array.from(new Set([
      ...(Array.isArray(targetSource.merged_sources) ? targetSource.merged_sources : []),
      ...(Array.isArray(candidateSource.merged_sources) ? candidateSource.merged_sources : []),
      ...(targetSource.source_url ? [targetSource.source_url] : []),
      ...(candidateSource.source_url ? [candidateSource.source_url] : []),
    ])).filter(Boolean),
  };

  merged.source_provenance = mergedSourceProvenance;
  merged.location = { ...(target.location || {}), ...(candidate.location || {}) };
  merged.contact = { ...(target.contact || {}), ...(candidate.contact || {}) };
  merged.basic = { ...(target.basic || {}), ...(candidate.basic || {}) };

  const candidateReview = candidate.duplicate_review || {};
  const targetReview = target.duplicate_review || {};
  merged.duplicate_review = {
    ...targetReview,
    ...candidateReview,
    recent_decisions: Array.from(new Set([
      ...((Array.isArray(targetReview.recent_decisions) ? targetReview.recent_decisions : []) as any[]),
      ...((Array.isArray(candidateReview.recent_decisions) ? candidateReview.recent_decisions : []) as any[]),
    ])).filter(Boolean),
  };

  return merged;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');

    if (businessId) {
      const row = await queryOne('SELECT custom_data FROM businesses WHERE id = ?', [businessId]);
      const customData = row && typeof row.custom_data === 'string' ? JSON.parse(row.custom_data) : (row?.custom_data || {});
      return NextResponse.json({ decision: customData?.duplicate_review || null });
    }

    return NextResponse.json({ decision: null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unable to load duplicate review.' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (body?.action === 'review') {
      const { decision, candidateId, targetBusinessId, reason = '', sourceName, sourceUrl } = body;
      if (!decision || !['merge', 'keep_separate', 'reject'].includes(decision)) {
        return NextResponse.json({ error: 'Decision must be merge, keep_separate, or reject.' }, { status: 400 });
      }

      const review = {
        decision,
        candidateId: candidateId || null,
        targetBusinessId: targetBusinessId || null,
        sourceName: sourceName || null,
        sourceUrl: sourceUrl || null,
        reason: String(reason || '').trim(),
        reviewed_at: new Date().toISOString(),
      };

      if (decision === 'merge' && targetBusinessId) {
        const targetRow = await queryOne('SELECT * FROM businesses WHERE id = ?', [targetBusinessId]);
        if (targetRow) {
          const targetCustom = parseCustomJson(targetRow.custom_data || {});
          let candidateCustom = {} as Record<string, any>;

          if (candidateId) {
            const candidateRow = await queryOne('SELECT * FROM businesses WHERE id = ?', [candidateId]);
            if (candidateRow) {
              candidateCustom = parseCustomJson(candidateRow.custom_data || {});
              const merged = mergeBusinessData(targetCustom, candidateCustom);
              await execute('UPDATE businesses SET custom_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [JSON.stringify(merged), targetBusinessId]);
              await execute("UPDATE businesses SET status = 'active', approved_by_vendor = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [targetBusinessId]);
            }
          }

          const current = parseCustomJson(targetRow.custom_data || {});
          current.duplicate_review = current.duplicate_review || {};
          current.duplicate_review.recent_decisions = Array.isArray(current.duplicate_review.recent_decisions) ? current.duplicate_review.recent_decisions : [];
          current.duplicate_review.recent_decisions.push(review);
          current.duplicate_review.latest_decision = review;
          current.duplicate_review.merged_with = candidateId || null;
          await execute('UPDATE businesses SET custom_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [JSON.stringify(current), targetBusinessId]);
        }
      } else if (targetBusinessId) {
        const targetRow = await queryOne('SELECT custom_data, id FROM businesses WHERE id = ?', [targetBusinessId]);
        if (targetRow) {
          const current = parseCustomJson(targetRow.custom_data || {});
          current.duplicate_review = current.duplicate_review || {};
          current.duplicate_review.recent_decisions = Array.isArray(current.duplicate_review.recent_decisions) ? current.duplicate_review.recent_decisions : [];
          current.duplicate_review.recent_decisions.push(review);
          current.duplicate_review.latest_decision = review;
          if (decision === 'keep_separate') current.duplicate_review.keep_separate = true;
          if (decision === 'reject') current.duplicate_review.rejected = true;
          await execute('UPDATE businesses SET custom_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [JSON.stringify(current), targetBusinessId]);
        }
      }

      if (candidateId && decision === 'reject') {
        const row = await queryOne('SELECT custom_data, id FROM businesses WHERE id = ?', [candidateId]);
        if (row) {
          const current = parseCustomJson(row.custom_data || {});
          current.duplicate_review = current.duplicate_review || {};
          current.duplicate_review.recent_decisions = Array.isArray(current.duplicate_review.recent_decisions) ? current.duplicate_review.recent_decisions : [];
          current.duplicate_review.recent_decisions.push(review);
          current.duplicate_review.latest_decision = review;
          current.duplicate_review.rejected = true;
          await execute('UPDATE businesses SET custom_data = ?, status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [JSON.stringify(current), candidateId]);
        }
      }

      await execute('INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)', [
        crypto.randomUUID(),
        'admin',
        'admin@system',
        'admin',
        'duplicate_review',
        JSON.stringify(review)
      ]);

      return NextResponse.json({ success: true, review });
    }

    const candidate = {
      name: body?.name,
      address: body?.address,
      phone: body?.phone,
      website: body?.website,
      lat: Number(body?.lat ?? 0),
      lng: Number(body?.lng ?? 0),
    };

    const duplicates = await findDuplicateCandidates(candidate, 8);
    return NextResponse.json({ duplicates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unable to check duplicates.' }, { status: 400 });
  }
}
