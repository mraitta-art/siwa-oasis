import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPublicAppUrl } from '@/lib/public-url';
import { execute, query, queryOne, transaction } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Handoff states that mean "this vendor was already reached" — they are skipped on re-send. */
const OUTREACHED_STATUSES = ['sent', 'delivered', 'read', 'replied', 'accepted', 'published'];

function errorResponse(error: any) {
  const message = String(error?.message || 'Batch outreach request failed');
  const status = message === 'Not authenticated'
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

/** Pull the best WhatsApp/phone number we have for a business. */
function extractPhone(business: any): string {
  const customData = parseJson(business.custom_data);
  const candidate =
    business.vendor_phone ||
    customData.basic?.whatsapp ||
    customData.sec_1_identity?.whatsapp ||
    customData.whatsapp ||
    customData.contact_whatsapp ||
    customData.basic?.phone ||
    customData.sec_1_identity?.phone ||
    customData.phone ||
    customData.contact_phone ||
    '';
  return String(candidate || '').trim();
}

/** Token replacement shared by the dry-run preview and the real send. */
function personalizeMessage(template: string, vars: Record<string, string>): string {
  return template
    .replace(/\{name\}/g, vars.name)
    .replace(/\{childType\}/g, vars.childType)
    .replace(/\{parentType\}/g, vars.parentType)
    .replace(/\{claimUrl\}/g, vars.claimUrl)
    .replace(/\{minisiteUrl\}/g, vars.minisiteUrl)
    .replace(/\{featureList\}/g, vars.featureList);
}

/**
 * Create a tokenized onboard invite for the business so the {claimUrl} in the
 * message opens the real /onboard/[token] flow. Falls back to the claim page
 * when the invite table is unavailable.
 */
async function createClaimInvite(business: any, baseUrl: string): Promise<string> {
  try {
    const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    await execute(
      `INSERT INTO onboard_invites
         (token, business_id, business_name, business_slug,
          parent_type_id, parent_type_name,
          child_type_id, child_type_name,
          subscription_tier, dispatch_mode, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'free', 'direct', ?)`,
      [
        token.slice(0, 64),
        business.id,
        business.name,
        business.slug || business.id,
        business.parent_id || null,
        business.parent_type_name || null,
        business.type_id || null,
        business.type_name || null,
        expiresAt,
      ]
    );
    return `${baseUrl}/onboard/${token.slice(0, 64)}`;
  } catch (inviteError: any) {
    console.warn('[jana/outreach/batch-send] invite fallback:', inviteError?.message);
    return `${baseUrl}/vendor/claim?slug=${business.slug || business.id}`;
  }
}

/** Resolve the CTA URL according to the template's cta_type. */
async function resolveCtaUrl(business: any, template: any, baseUrl: string): Promise<string> {
  if (template.cta_type === 'preview_minisite') {
    return `${baseUrl}/${business.slug || business.id}`;
  }
  if (template.cta_type === 'register') {
    return `${baseUrl}/signup`;
  }
  return createClaimInvite(business, baseUrl);
}

/** Find the CRM group used for minisite outreach tracking, creating it on first use. */
async function ensureOutreachGroup(adminId: string): Promise<string> {
  const groupName = 'Vendor Minisite Outreach';
  const existing = await queryOne<any>(
    'SELECT id FROM crm_groups WHERE name = ? LIMIT 1',
    [groupName]
  );
  if (existing) return existing.id;
  const id = randomUUID();
  await execute(
    'INSERT INTO crm_groups (id, name, description, created_by) VALUES (?, ?, ?, ?)',
    [id, groupName, 'Auto-managed group tracking 3-level vendor minisite outreach campaigns.', adminId]
  );
  return id;
}

/**
 * POST /api/jana/outreach/batch-send
 * Body: { business_type_id, template_id?, dry_run? }
 *
 * Finds the active outreach template for the type, resolves the target audience
 * (unclaimed businesses of the type and/or its child types per target_scope),
 * and records a personalized minisite_vendor_handoffs (draft -> sent) per vendor
 * plus one crm_whatsapp_campaigns tracker row. dry_run returns what WOULD be sent
 * without writing anything.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const businessTypeId = String(body.business_type_id || '').trim();
    const requestedTemplateId = String(body.template_id || '').trim();
    const dryRun = body.dry_run === true;
    if (!businessTypeId) {
      return NextResponse.json({ error: 'business_type_id is required' }, { status: 400 });
    }

    // 1. Resolve the target business type (plus its parent for template inheritance)
    const businessType = await queryOne<any>(
      `SELECT bt.id, bt.name, bt.is_parent, bt.parent_id, parent_bt.name AS parent_name
       FROM business_types bt
       LEFT JOIN business_types parent_bt ON parent_bt.id = bt.parent_id
       WHERE bt.id = ? LIMIT 1`,
      [businessTypeId]
    );
    if (!businessType) {
      return NextResponse.json({ error: 'Business type not found' }, { status: 404 });
    }

    // 2. Resolve the outreach template:
    //    a) an explicit template_id always wins
    //    b) otherwise the newest active template bound to the selected category
    //    c) otherwise a child category inherits its parent category's template
    let template: any = null;
    let inheritedFrom: { id: string; name: string } | null = null;

    if (requestedTemplateId) {
      template = await queryOne<any>(
        `SELECT * FROM outreach_templates WHERE id = ? AND is_active = 1 LIMIT 1`,
        [requestedTemplateId]
      );
      if (!template) {
        return NextResponse.json({ error: 'Outreach template not found or inactive' }, { status: 404 });
      }
    } else {
      template = await queryOne<any>(
        `SELECT * FROM outreach_templates
         WHERE business_type_id = ? AND is_active = 1
         ORDER BY updated_at DESC LIMIT 1`,
        [businessTypeId]
      );
      if (!template && businessType.parent_id) {
        template = await queryOne<any>(
          `SELECT * FROM outreach_templates
           WHERE business_type_id = ? AND is_active = 1
           ORDER BY updated_at DESC LIMIT 1`,
          [businessType.parent_id]
        );
        if (template) {
          inheritedFrom = { id: String(template.business_type_id), name: businessType.parent_name || '' };
        }
      }
      if (!template) {
        return NextResponse.json({
          error: businessType.parent_id
            ? `No active outreach template for this category or its parent category. Create one first.`
            : 'No active outreach template exists for this business type. Create one first.',
        }, { status: 404 });
      }
    }

    // 3. Resolve the audience type ids from target_scope
    const scope = template.target_scope || 'both';
    const childTypes = businessType.is_parent
      ? await query<any>(
          'SELECT id, name FROM business_types WHERE parent_id = ? AND active = TRUE ORDER BY name ASC',
          [businessTypeId]
        )
      : [];
    const childTypeIds = childTypes.map((t: any) => t.id);

    let typeIds: string[];
    if (scope === 'parent_only') {
      typeIds = [businessTypeId];
    } else if (scope === 'children_only') {
      // Fall back to the type itself when it has no children, so a send is never a silent no-op.
      typeIds = childTypeIds.length > 0 ? childTypeIds : [businessTypeId];
    } else {
      typeIds = [businessTypeId, ...childTypeIds];
    }

    // 4. Query unclaimed businesses of those types, flagging ones already reached
    const placeholders = typeIds.map(() => '?').join(', ');
    const businesses = await query<any>(
      `SELECT b.id, b.name, b.slug, b.type_id, b.vendor_phone, b.custom_data,
              bt.name AS type_name, bt.parent_id,
              parent_bt.name AS parent_type_name,
              EXISTS (
                SELECT 1 FROM minisite_vendor_handoffs h
                WHERE h.business_id = b.id AND h.status IN (${OUTREACHED_STATUSES.map(() => '?').join(', ')})
              ) AS already_outreached
       FROM businesses b
       LEFT JOIN business_types bt ON bt.id = b.type_id
       LEFT JOIN business_types parent_bt ON parent_bt.id = bt.parent_id
       WHERE b.is_claimed = 0 AND b.type_id IN (${placeholders})
       ORDER BY b.created_at ASC
       LIMIT 2000`,
      [...OUTREACHED_STATUSES, ...typeIds]
    );

    // 5. Split audience + build the personalized preview payload per business
    const baseUrl = getPublicAppUrl().replace(/\/$/, '');
    const features = parseJson(template.included_features, []);
    const featureList = Array.isArray(features) && features.length > 0
      ? features.map((f: string) => `• ${f}`).join('\n')
      : '• Free verified minisite on SiWiFy.com';

    const eligible: any[] = [];
    const skippedAlreadyOutreached: any[] = [];
    for (const business of businesses) {
      const vars = {
        name: business.name,
        childType: business.type_name || businessType.name,
        parentType: business.parent_type_name || businessType.name,
        claimUrl: '', // resolved per-CTA below, only for eligible rows
        minisiteUrl: `${baseUrl}/${business.slug || business.id}`,
        featureList,
      };
      if (Number(business.already_outreached) === 1) {
        skippedAlreadyOutreached.push({ id: business.id, name: business.name });
        continue;
      }
      eligible.push({ business, vars });
    }

    if (dryRun) {
      // Preview the first business with a fully resolved CTA (invite creation skipped in dry-run).
      let preview: any = null;
      if (eligible.length > 0) {
        const first = eligible[0];
        const claimUrl =
          template.cta_type === 'preview_minisite'
            ? first.vars.minisiteUrl
            : template.cta_type === 'register'
              ? `${baseUrl}/signup`
              : `${baseUrl}/vendor/claim?slug=${first.business.slug || first.business.id}`;
        const bodyEn = personalizeMessage(
          template.message_body_en || template.message_body_ar || '',
          { ...first.vars, claimUrl }
        );
        const bodyAr = template.message_body_ar
          ? personalizeMessage(template.message_body_ar, { ...first.vars, claimUrl })
          : null;
        preview = {
          business_id: first.business.id,
          business_name: first.business.name,
          subject_en: template.message_subject_en || null,
          subject_ar: template.message_subject_ar || null,
          body_en: bodyEn,
          body_ar: bodyAr,
          claim_url: claimUrl,
        };
      }
      return NextResponse.json({
        success: true,
        dry_run: true,
        template: {
          id: template.id,
          name: template.template_name,
          target_scope: scope,
          cta_type: template.cta_type,
          inherited_from: inheritedFrom,
        },
        business_type: { id: businessType.id, name: businessType.name },
        counts: {
          eligible: eligible.length,
          skipped_already_outreached: skippedAlreadyOutreached.length,
          audience_types: typeIds.length,
        },
        audience: eligible.slice(0, 50).map(({ business }: any) => ({
          id: business.id,
          name: business.name,
          type_name: business.type_name || businessType.name,
          slug: business.slug || business.id,
        })),
        skipped_already_outreached: skippedAlreadyOutreached.slice(0, 50),
        preview,
      });
    }

    if (eligible.length === 0) {
      return NextResponse.json({
        success: true,
        dry_run: false,
        template: { id: template.id, name: template.template_name },
        counts: {
          eligible: 0,
          sent: 0,
          failed: 0,
          skipped_already_outreached: skippedAlreadyOutreached.length,
        },
        message: 'Every unclaimed business for this template was already reached. Nothing to send.',
      });
    }

    // 6. Real send: campaign tracker + one handoff (draft -> sent) per vendor
    const groupId = await ensureOutreachGroup(admin.id);
    const campaignId = randomUUID();
    await execute(
      `INSERT INTO crm_whatsapp_campaigns
         (id, group_id, template_name, language_code, message_text, status, created_by)
       VALUES (?, ?, ?, 'en', ?, 'queued', ?)`,
      [campaignId, groupId, template.template_name.slice(0, 255), template.message_body_en || template.message_body_ar || '', admin.id]
    );

    // Optional minisite template components attached to generated drafts.
    let templateComponents: any[] = [];
    if (template.minisite_template_id) {
      const minisiteTemplate = await queryOne<any>(
        'SELECT components FROM minisite_templates WHERE id = ? LIMIT 1',
        [template.minisite_template_id]
      );
      const components = parseJson(minisiteTemplate?.components, null);
      if (Array.isArray(components)) templateComponents = components;
    }

    let sent = 0;
    let failed = 0;
    const errors: { business_id: string; error: string }[] = [];

    for (const { business, vars } of eligible) {
      try {
        const claimUrl = await resolveCtaUrl(business, template, baseUrl);
        const messageEn = personalizeMessage(
          template.message_body_en || template.message_body_ar || '',
          { ...vars, claimUrl }
        );

        const revisionRow = await queryOne<any>(
          'SELECT COALESCE(MAX(revision), 0) + 1 AS next_revision FROM minisite_vendor_handoffs WHERE business_id = ?',
          [business.id]
        );
        const revision = Number(revisionRow?.next_revision || 1);
        const handoffId = randomUUID();
        const layout = {
          mode: 'replace',
          components: templateComponents,
          site_settings: {},
          outreach: {
            template_id: template.id,
            template_name: template.template_name,
            template_business_type_id: template.business_type_id,
            inherited_from: inheritedFrom,
            campaign_id: campaignId,
            cta_type: template.cta_type,
            claim_url: claimUrl,
            subject_en: template.message_subject_en || null,
            subject_ar: template.message_subject_ar || null,
            message_en: messageEn,
            message_ar: template.message_body_ar
              ? personalizeMessage(template.message_body_ar, { ...vars, claimUrl })
              : null,
            feature_list: features,
          },
        };

        // draft -> sent in one pass per vendor
        await transaction(async connection => {
          await connection.execute(
            `INSERT INTO minisite_vendor_handoffs
               (id, business_id, revision, status, layout, vendor_phone, created_by)
             VALUES (?, ?, ?, 'draft', ?, ?, ?)`,
            [handoffId, business.id, revision, JSON.stringify(layout), extractPhone(business) || null, admin.id]
          );
          await connection.execute(
            `UPDATE minisite_vendor_handoffs SET status = 'sent' WHERE id = ?`,
            [handoffId]
          );
          await connection.execute(
            `INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload, actor_id)
             VALUES (?, 'outreach_sent', ?, ?)`,
            [handoffId, JSON.stringify({ campaign_id: campaignId, template_id: template.id, cta_url: claimUrl }), admin.id]
          );
        });

        // Mirror the outreach lifecycle onto the business custom_data (same keys as WhatsApp outreach).
        const customData = parseJson(business.custom_data);
        customData.outreach_status = 'sent';
        customData.last_contacted_at = new Date().toISOString();
        customData.outreach_template_id = template.id;
        customData.outreach_campaign_id = campaignId;
        await execute(
          'UPDATE businesses SET custom_data = ?, updated_at = NOW() WHERE id = ?',
          [JSON.stringify(customData), business.id]
        );

        sent += 1;
      } catch (businessError: any) {
        failed += 1;
        errors.push({ business_id: business.id, error: String(businessError?.message || 'send failed').slice(0, 300) });
        console.error(`[jana/outreach/batch-send] failed for ${business.id}:`, businessError);
      }
    }

    const campaignStatus = failed === 0 ? 'sent' : sent > 0 ? 'partial' : 'failed';
    await execute(
      'UPDATE crm_whatsapp_campaigns SET status = ? WHERE id = ?',
      [campaignStatus, campaignId]
    );

    return NextResponse.json({
      success: true,
      dry_run: false,
      template: { id: template.id, name: template.template_name, target_scope: scope, inherited_from: inheritedFrom },
      business_type: { id: businessType.id, name: businessType.name },
      campaign_id: campaignId,
      counts: {
        eligible: eligible.length,
        sent,
        failed,
        skipped_already_outreached: skippedAlreadyOutreached.length,
        with_phone: eligible.filter(({ business }: any) => extractPhone(business)).length,
      },
      errors: errors.slice(0, 20),
    });
  } catch (error: any) {
    console.error('[jana/outreach/batch-send POST]', error);
    return errorResponse(error);
  }
}
