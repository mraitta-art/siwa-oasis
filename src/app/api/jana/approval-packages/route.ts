import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { execute, query, queryOne } from '@/lib/db';
import {
  ACCOUNT_MANAGER_ROLES,
  SERVICE_LEVELS,
  applyVendorServiceLevel,
  isServiceLevel,
  type ServiceLevel,
} from '@/lib/vendor-service-levels';

export const dynamic = 'force-dynamic';

/**
 * Level 2 approval packages are the minisites the Siwa team prepares for a specific
 * vendor. They live in minisite_vendor_handoffs (revision-per-package, tokenized review
 * link, legally hashed terms acceptance) and are told apart from Level 1 batch outreach
 * by the outreach block that batch-send stamps into the layout:
 *   layout.$.outreach.template_id present -> automated template outreach (Level 1)
 *   absent                                -> hand-built curated package (Level 2)
 * Reusing the handoff table keeps one auditable delivery/acceptance record per vendor
 * decision instead of a second parallel history.
 */
const CURATED_PACKAGE_FILTER = `JSON_EXTRACT(h.layout, '$.outreach.template_id') IS NULL`;

const IN_REVIEW_STATUSES = ['sent', 'delivered', 'read', 'followup_due', 'replied'];

const PACKAGE_SELECT = `
  SELECT h.id, h.business_id, h.revision, h.status, h.vendor_phone, h.token_expires_at,
         h.whatsapp_message_id, h.whatsapp_error, h.agreement_version, h.agreement_language,
         h.accepted_name, h.accepted_at, h.changes_requested_note,
         h.created_by, h.created_at, h.updated_at,
         b.name AS business_name, b.slug AS business_slug, b.is_claimed,
         b.subscription_tier, COALESCE(b.service_level, 'template') AS service_level,
         b.account_manager_id,
         bt.name AS type_name, parent_bt.name AS parent_type_name,
         prep.display_name AS prepared_by_name,
         am.display_name AS account_manager_name,
         JSON_LENGTH(h.layout, '$.components') AS component_count,
         lifecycle.sent_at, lifecycle.viewed_at, lifecycle.responded_at,
         latest_transition.reason AS level_reason
  FROM minisite_vendor_handoffs h
  JOIN businesses b ON b.id = h.business_id
  LEFT JOIN business_types bt ON bt.id = b.type_id
  LEFT JOIN business_types parent_bt ON parent_bt.id = bt.parent_id
  LEFT JOIN profiles prep ON prep.id = h.created_by
  LEFT JOIN profiles am ON am.id = b.account_manager_id
  LEFT JOIN (
    SELECT handoff_id,
           MIN(CASE WHEN event_type IN ('whatsapp_sent', 'outreach_sent') THEN created_at END) AS sent_at,
           MIN(CASE WHEN event_type IN ('vendor_viewed', 'whatsapp_read') THEN created_at END)  AS viewed_at,
           MIN(CASE WHEN event_type IN ('vendor_accepted_and_published', 'published',
                                        'admin_published', 'changes_requested', 'replied')
                    THEN created_at END)                                                       AS responded_at
    FROM minisite_vendor_handoff_events
    GROUP BY handoff_id
  ) lifecycle ON lifecycle.handoff_id = h.id
  LEFT JOIN (
    SELECT vt.business_id, vt.reason
    FROM vendor_level_transitions vt
    JOIN (
      SELECT business_id, MAX(created_at) AS last_created_at
      FROM vendor_level_transitions
      GROUP BY business_id
    ) latest ON latest.business_id = vt.business_id AND latest.last_created_at = vt.created_at
  ) latest_transition ON latest_transition.business_id = h.business_id`;

function errorResponse(error: any) {
  const message = String(error?.message || 'Approval package request failed');
  const status = Number.isInteger(error?.status)
    ? error.status
    : message === 'Not authenticated'
      ? 401
      : message.includes('Admin access required')
        ? 403
        : 500;
  return NextResponse.json({ error: message }, { status });
}

function parseJson(value: any, fallback: any = {}) {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * GET /api/jana/approval-packages
 * List the curated packages every vendor has been (or will be) asked to approve.
 * Filters: status, businessId, level (service_level), q (business name), staff=1 for
 * the account-manager dropdown, packageId for one package with its full event trail.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get('packageId');
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status');
    const level = searchParams.get('level');
    const term = searchParams.get('q');

    // Single package with its delivery/acceptance history (board detail drawer).
    if (packageId) {
      const pkg = await queryOne<any>(`${PACKAGE_SELECT} WHERE h.id = ? AND ${CURATED_PACKAGE_FILTER} LIMIT 1`, [packageId]);
      if (!pkg) return NextResponse.json({ error: 'Approval package not found' }, { status: 404 });
      // The layout is deliberately kept out of PACKAGE_SELECT (500 list rows would
      // otherwise carry 500 full layouts); the drawer fetches just the one it shows.
      const [layoutRow, events, transitions] = await Promise.all([
        queryOne<any>('SELECT layout FROM minisite_vendor_handoffs WHERE id = ? LIMIT 1', [packageId]),
        query<any>(
          `SELECT id, event_type, payload, actor_id, created_at
           FROM minisite_vendor_handoff_events WHERE handoff_id = ? ORDER BY created_at DESC LIMIT 100`,
          [packageId]
        ),
        query<any>(
          `SELECT id, from_level, to_level, triggered_by, trigger_type, reason, metadata, created_at
           FROM vendor_level_transitions WHERE business_id = ? ORDER BY created_at DESC LIMIT 50`,
          [pkg.business_id]
        ).catch(() => []),
      ]);
      return NextResponse.json({
        package: {
          ...pkg,
          layout: (() => {
            const raw = layoutRow?.layout ?? null;
            return typeof raw === 'string' ? parseJson(raw, null) : raw;
          })(),
        },
        events: events.map((event: any) => ({ ...event, payload: parseJson(event.payload, {}) })),
        transitions: transitions.map((row: any) => ({ ...row, metadata: parseJson(row.metadata, {}) })),
      });
    }

    const conditions: string[] = [CURATED_PACKAGE_FILTER];
    const params: any[] = [];
    if (businessId) {
      conditions.push('h.business_id = ?');
      params.push(businessId);
    }
    if (status && status !== 'all') {
      if (status === 'in_review') {
        conditions.push(`h.status IN (${IN_REVIEW_STATUSES.map(() => '?').join(', ')})`);
        params.push(...IN_REVIEW_STATUSES);
      } else {
        conditions.push('h.status = ?');
        params.push(status);
      }
    }
    if (level && isServiceLevel(level)) {
      conditions.push('COALESCE(b.service_level, \'template\') = ?');
      params.push(level);
    }
    if (term) {
      conditions.push('(b.name LIKE ? OR b.slug LIKE ?)');
      params.push(`%${term}%`, `%${term}%`);
    }

    // Newest revision per business is the package a vendor is actually looking at;
    // older revisions stay listed under history so nothing is hidden from the board.
    const rows = await query<any>(
      `${PACKAGE_SELECT}
       WHERE ${conditions.join(' AND ')}
       ORDER BY h.updated_at DESC
       LIMIT 500`,
      params
    );

    const stats = {
      total: rows.length,
      awaiting_send: rows.filter((r: any) => r.status === 'draft').length,
      in_review: rows.filter((r: any) => IN_REVIEW_STATUSES.includes(r.status)).length,
      changes_requested: rows.filter((r: any) => r.status === 'changes_requested').length,
      approved: rows.filter((r: any) => ['accepted', 'published'].includes(r.status)).length,
      expired: rows.filter((r: any) => r.status === 'expired').length,
      failed: rows.filter((r: any) => r.status === 'failed').length,
      by_level: SERVICE_LEVELS.reduce((acc: Record<string, number>, candidate) => {
        acc[candidate] = new Set(rows.filter((r: any) => r.service_level === candidate).map((r: any) => r.business_id)).size;
        return acc;
      }, {} as Record<string, number>),
    };

    // Staff picklist for the account-manager control (Level 3 assignment).
    const staff = searchParams.get('staff') === '1'
      ? await query<any>(
          `SELECT id, display_name, email, role FROM profiles
           WHERE active = 1 AND role IN (${ACCOUNT_MANAGER_ROLES.map(() => '?').join(', ')})
           ORDER BY display_name ASC LIMIT 100`,
          ACCOUNT_MANAGER_ROLES
        ).catch(() => [])
      : undefined;

    return NextResponse.json({
      packages: rows.map((row: any) => ({
        ...row,
        component_count: Number(row.component_count || 0),
        is_expired_link: Boolean(row.token_expires_at && new Date(row.token_expires_at).getTime() < Date.now()),
      })),
      stats,
      ...(staff ? { staff } : {}),
    });
  } catch (error: any) {
    console.error('[jana/approval-packages GET]', error);
    return errorResponse(error);
  }
}

/**
 * POST /api/jana/approval-packages
 * Board actions on a package / the vendor behind it:
 *   action = 'set_level'             { businessId, level, reason }
 *   action = 'assign_account_manager'{ businessId, accountManagerId|null }
 *   action = 'log_response'          { packageId, status, note }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const action = String(body.action || '');

    if (action === 'set_level') {
      const businessId = String(body.businessId || '').trim();
      const level = String(body.level || '') as ServiceLevel;
      if (!businessId) return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
      if (!isServiceLevel(level)) {
        return NextResponse.json({ error: `level must be one of: ${SERVICE_LEVELS.join(', ')}` }, { status: 400 });
      }
      const business = await queryOne<any>(
        'SELECT id, name, service_level FROM businesses WHERE id = ? LIMIT 1',
        [businessId]
      );
      if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

      const result = await applyVendorServiceLevel({
        businessId,
        toLevel: level,
        triggeredBy: admin.id,
        triggerType: 'manual',
        reason: String(body.reason || '').trim() || `Service level set from the approval packages board`,
        metadata: { source: 'approval_packages_board', actor_email: admin.email },
      });

      return NextResponse.json({
        success: true,
        businessId,
        changed: result.changed,
        fromLevel: result.fromLevel,
        level: result.toLevel,
        message: result.changed
          ? `${business.name} moved from ${result.fromLevel} to ${result.toLevel}.`
          : `${business.name} is already at the ${result.toLevel} level.`,
      });
    }

    if (action === 'assign_account_manager') {
      const businessId = String(body.businessId || '').trim();
      const accountManagerId = String(body.accountManagerId || '').trim() || null;
      if (!businessId) return NextResponse.json({ error: 'businessId is required' }, { status: 400 });

      const business = await queryOne<any>(
        `SELECT id, name, vendor_id, account_manager_id,
                COALESCE(service_level, 'template') AS service_level
         FROM businesses WHERE id = ? LIMIT 1`,
        [businessId]
      );
      if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

      if (accountManagerId) {
        const manager = await queryOne<any>(
          `SELECT id, display_name, role FROM profiles
           WHERE id = ? AND active = 1 AND role IN (${ACCOUNT_MANAGER_ROLES.map(() => '?').join(', ')})
           LIMIT 1`,
          [accountManagerId, ...ACCOUNT_MANAGER_ROLES]
        );
        if (!manager) {
          return NextResponse.json({ error: 'Account manager must be an active staff account' }, { status: 400 });
        }
      }

      await execute(
        'UPDATE businesses SET account_manager_id = ?, updated_at = NOW() WHERE id = ?',
        [accountManagerId, businessId]
      );

      // Audited on the vendor lifecycle trail when the business already has a vendor.
      try {
        await execute(
          `INSERT INTO vendor_lifecycle_events (id, vendor_id, business_id, action, reason, performed_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
            business.vendor_id || accountManagerId || businessId,
            businessId,
            accountManagerId ? 'account_manager_assigned' : 'account_manager_removed',
            String(body.reason || '').trim() || `Set from the approval packages board by ${admin.email}`,
            admin.id,
          ]
        );
      } catch (auditError: any) {
        console.warn('[jana/approval-packages] lifecycle audit warning:', auditError?.message || auditError);
      }

      return NextResponse.json({
        success: true,
        businessId,
        accountManagerId,
        message: accountManagerId ? 'Account manager assigned.' : 'Account manager removed.',
      });
    }

    if (action === 'log_response') {
      const packageId = String(body.packageId || '').trim();
      const status = String(body.status || '').trim();
      const note = String(body.note || '').trim().slice(0, 500);
      if (!packageId) return NextResponse.json({ error: 'packageId is required' }, { status: 400 });
      if (!['changes_requested', 'replied', 'followup_due'].includes(status)) {
        return NextResponse.json({ error: 'status must be changes_requested, replied or followup_due' }, { status: 400 });
      }
      const pkg = await queryOne<any>(
        `SELECT id, business_id, status, changes_requested_note
         FROM minisite_vendor_handoffs WHERE id = ? LIMIT 1`,
        [packageId]
      );
      if (!pkg) return NextResponse.json({ error: 'Approval package not found' }, { status: 404 });
      if (['accepted', 'published', 'expired'].includes(pkg.status)) {
        return NextResponse.json({ error: 'This package already reached a final decision.' }, { status: 409 });
      }

      await execute(
        `UPDATE minisite_vendor_handoffs
         SET status = ?, changes_requested_note = ?
         WHERE id = ?`,
        [status, status === 'changes_requested' ? note || pkg.changes_requested_note : pkg.changes_requested_note, packageId]
      );
      await execute(
        'INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload, actor_id) VALUES (?, ?, ?, ?)',
        [packageId, status, JSON.stringify({ note }), admin.id]
      );
      return NextResponse.json({ success: true, packageId, status });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    console.error('[jana/approval-packages POST]', error);
    return errorResponse(error);
  }
}
