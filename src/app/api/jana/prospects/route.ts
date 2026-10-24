import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { saveMinisiteDraft } from '@/lib/minisite-drafts';
import { getPublicMinisiteUrl } from '@/lib/public-url';
import {
  buildManualWhatsAppLink,
  issueMinisiteToken,
  readInvitationEnv,
  sendMinisiteInvitation,
} from '@/lib/minisite-invitation';
import {
  PROSPECT_MODES,
  buildBaselineMinisiteLayout,
  createProspectBusiness,
  findBusinessByPhone,
  findCrmContactByPhone,
  listRecentProspects,
  markProspectStage,
  nextStepsFor,
  normalizeProspectPhone,
  type ProspectMode,
} from '@/lib/prospect-intake';
import { resolveTemplateForBusiness } from '@/lib/vendor-template-resolve';

export const dynamic = 'force-dynamic';

/**
 * Prospect intake API — name + phone in, claimable minisite out.
 *
 * Three modes, each a different commercial bet:
 *   baseline_send   → free baseline + WhatsApp invitation now (speed)
 *   baseline_manual → free baseline + token, admin sends from his own phone
 *   build_first     → create only; the layout is shaped before anything is sent
 *
 * Every mode writes `vendor_phone`, which is the column every send path reads.
 */

async function listTypes() {
  // Production `business_types` has no `name_ar` column, and in dev the db wrapper
  // swallows ER_BAD_FIELD_ERROR into an empty array instead of throwing — so the
  // fallback has to key off emptiness, not on a caught exception.
  const strict = await query<any>(
    `SELECT id, name, parent_id FROM business_types
      WHERE active = TRUE AND parent_id IS NOT NULL
      ORDER BY name ASC`
  ).catch(() => []);
  if (strict.length > 0) return strict;

  const loose = await query<any>(
    `SELECT id, name, parent_id FROM business_types
      WHERE parent_id IS NOT NULL
      ORDER BY name ASC`
  ).catch(() => []);
  if (loose.length > 0) return loose;

  return await query<any>('SELECT id, name, parent_id FROM business_types ORDER BY name ASC').catch(() => []);
}

export async function GET() {
  try {
    await requireAdmin();
    const [types, recent] = await Promise.all([listTypes(), listRecentProspects(60)]);

    return NextResponse.json({
      types,
      whatsapp_configured: Boolean(readInvitationEnv()),
      recent: (recent as any[]).map((row) => ({
        ...row,
        public_url: row.slug ? getPublicMinisiteUrl(row.slug) : null,
        claim_url: row.slug ? `/vendor/claim?slug=${encodeURIComponent(row.slug)}` : null,
      })),
    });
  } catch (error: any) {
    const unauthenticated = String(error?.message || '').includes('authenticated')
      || String(error?.message || '').includes('Admin access');
    console.error('[jana/prospects] GET failed', error);
    return NextResponse.json(
      { error: unauthenticated ? 'Not authorized' : 'Failed to load prospects' },
      { status: unauthenticated ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json().catch(() => ({} as any));

    const mode: ProspectMode = PROSPECT_MODES.includes(body?.mode) ? body.mode : 'baseline_send';
    const name = String(body?.name || '').trim();
    const typeId = String(body?.typeId || '').trim();
    const phone = normalizeProspectPhone(body?.phone);

    const isBulk = String(body?.action || '') === 'bulk';

    // A bulk paste carries one phone per row and no top-level name, so the
    // single-entry checks below must not run for it.
    if (!isBulk && (!name || name.length < 2)) {
      return NextResponse.json({ error: 'Enter the vendor business name.' }, { status: 400 });
    }
    if (!isBulk && (!phone || phone.length < 8 || phone.length > 15)) {
      return NextResponse.json({ error: 'Enter the vendor WhatsApp number in international format.' }, { status: 400 });
    }
    if (!typeId) {
      return NextResponse.json({ error: 'Select a specific business typology.' }, { status: 400 });
    }

    // ── Bulk paste: a phone list with no names yet (tuk-tuk captains, small shops) ──
    // Hard cap of 12 per submit. Capped on purpose: a batch of templated messages
    // to cold numbers is how a WhatsApp business number gets flagged. Bulk never
    // auto-sends — every row comes back as a one-by-one manual link.
    if (isBulk) {
      const items: any[] = Array.isArray(body?.items) ? body.items.slice(0, 12) : [];
      if (items.length === 0) {
        return NextResponse.json({ error: 'Paste at least one phone number.' }, { status: 400 });
      }

      const typeRow = await query<any>('SELECT id, name, parent_id FROM business_types WHERE id = ? LIMIT 1', [typeId]);
      if (!typeRow?.length) {
        return NextResponse.json({ error: 'Select a valid business typology.' }, { status: 400 });
      }
      const typeName = String(typeRow[0].name || 'نشاط سيوي');

      const results: any[] = [];
      const seen = new Set<string>();

      for (const item of items) {
        const rowPhone = normalizeProspectPhone(item?.phone);
        const rawPhone = String(item?.phone || '').trim();

        if (!rowPhone || rowPhone.length < 8 || rowPhone.length > 15) {
          results.push({ ok: false, phone: rawPhone, reason: 'invalid_phone' });
          continue;
        }
        if (seen.has(rowPhone)) {
          results.push({ ok: false, phone: rowPhone, reason: 'duplicate_in_paste' });
          continue;
        }
        seen.add(rowPhone);

        const existing = await findBusinessByPhone(rowPhone);
        if (existing) {
          results.push({
            ok: false, phone: rowPhone, reason: 'already_exists',
            existing: {
              name: existing.name, slug: existing.slug, is_claimed: Boolean(existing.is_claimed),
              claim_url: `/vendor/claim?slug=${encodeURIComponent(existing.slug)}`,
            },
          });
          continue;
        }

        const rowName = String(item?.name || '').trim() || `${typeName} · ${rowPhone.slice(-4)}`;

        try {
          const prospect = await createProspectBusiness({
            name: rowName,
            phone: rowPhone,
            typeId,
            note: String(body?.note || 'bulk list'),
            mode: 'baseline_manual',
            adminId: admin.id,
          });
          const draft = await saveMinisiteDraft({
            businessId: prospect.id,
            layout: buildBaselineMinisiteLayout(),
            createdBy: admin.id,
            vendorPhone: rowPhone,
          });
          const issued = await issueMinisiteToken({ handoffId: draft.handoffId, vendorPhone: rowPhone });
          await markProspectStage(prospect.id, 'drafted', { mode: 'bulk_manual', handoff_id: draft.handoffId });

          results.push({
            ok: true,
            phone: rowPhone,
            name: rowName,
            slug: prospect.slug,
            public_url: getPublicMinisiteUrl(prospect.slug),
            review_url: issued.reviewUrl,
            wa_link: buildManualWhatsAppLink(rowPhone, issued.reviewUrl, rowName),
            expires_at: issued.expiresAt.toISOString(),
            handoff_id: draft.handoffId,
          });
        } catch (rowError: any) {
          results.push({ ok: false, phone: rowPhone, name: rowName, reason: rowError?.message || 'create_failed' });
        }
      }

      return NextResponse.json({
        ok: true,
        bulk: true,
        mode: 'baseline_manual',
        type: { id: typeId, name: typeName },
        summary: {
          submitted: items.length,
          created: results.filter((row) => row.ok).length,
          skipped: results.filter((row) => !row.ok).length,
          cap: 12,
        },
        results,
        next: [
          'Send each row from your own WhatsApp — one tap per row, no template needed.',
          'Paste the next 12 numbers; do not push more than ~30 a day from one number.',
          'Anything marked “already_exists” is a claim link, not a new invitation.',
        ],
      });
    }

    // One vendor = one number. Never create the duplicate that split your data
    // in the first place; hand back the existing record instead.
    const existing = await findBusinessByPhone(phone);
    if (existing) {
      return NextResponse.json({
        error: `${existing.name} already exists on this number.`,
        existing: {
          id: existing.id,
          name: existing.name,
          slug: existing.slug,
          is_claimed: Boolean(existing.is_claimed),
          claim_url: `/vendor/claim?slug=${encodeURIComponent(existing.slug)}`,
          public_url: getPublicMinisiteUrl(existing.slug),
        },
      }, { status: 409 });
    }

    const crmContact = await findCrmContactByPhone(phone);
    const prospect = await createProspectBusiness({
      name,
      phone,
      typeId,
      note: String(body?.note || ''),
      mode,
      adminId: admin.id,
    });

    const links = {
      public_url: getPublicMinisiteUrl(prospect.slug),
      builder_url: `/jana/minisite-builder?slug=${encodeURIComponent(prospect.slug)}`,
      claim_url: `/vendor/claim?slug=${encodeURIComponent(prospect.slug)}`,
    };

    const base = {
      ok: true,
      mode,
      business: {
        id: prospect.id,
        name: prospect.name,
        slug: prospect.slug,
        template_source: prospect.template.source,
        template_id: prospect.template.templateId,
      },
      links,
      crm_contact: crmContact,
    };

    if (mode === 'build_first') {
      await markProspectStage(prospect.id, 'build_first', { mode });
      return NextResponse.json({
        ...base,
        handoff: null,
        invitation: { sent: false, review_url: null, wa_link: null, expires_at: null, reason: 'build_first' },
        next: nextStepsFor(mode, false),
      });
    }

    const draft = await saveMinisiteDraft({
      businessId: prospect.id,
      layout: buildBaselineMinisiteLayout(),
      createdBy: admin.id,
      vendorPhone: phone,
    });

    let invitation: {
      sent: boolean;
      message_id?: string | null;
      review_url: string | null;
      wa_link: string | null;
      expires_at: string | null;
      reason: string | null;
    } = { sent: false, review_url: null, wa_link: null, expires_at: null, reason: null };

    if (mode === 'baseline_send') {
      try {
        const result = await sendMinisiteInvitation({
          handoffId: draft.handoffId,
          vendorPhone: phone,
          adminId: admin.id,
        });
        invitation = {
          sent: true,
          message_id: result.messageId,
          review_url: result.reviewUrl,
          wa_link: buildManualWhatsAppLink(phone, result.reviewUrl, prospect.name),
          expires_at: result.expiresAt,
          reason: null,
        };
      } catch (error: any) {
        // A provider problem must not cost the admin the token: fall back to the
        // copy-paste path and report why, instead of failing the whole request.
        const issued = await issueMinisiteToken({ handoffId: draft.handoffId, vendorPhone: phone });
        invitation = {
          sent: false,
          review_url: issued.reviewUrl,
          wa_link: buildManualWhatsAppLink(phone, issued.reviewUrl, prospect.name),
          expires_at: issued.expiresAt.toISOString(),
          reason: String(error?.message || 'WhatsApp send failed'),
        };
      }
    } else {
      const issued = await issueMinisiteToken({ handoffId: draft.handoffId, vendorPhone: phone });
      invitation = {
        sent: false,
        review_url: issued.reviewUrl,
        wa_link: buildManualWhatsAppLink(phone, issued.reviewUrl, prospect.name),
        expires_at: issued.expiresAt.toISOString(),
        reason: 'manual_send',
      };
    }

    await markProspectStage(prospect.id, invitation.sent ? 'invited' : 'drafted', {
      mode,
      handoff_id: draft.handoffId,
    });

    // Re-resolve so a template that changed during creation is reflected.
    if (!prospect.template.templateId) {
      await resolveTemplateForBusiness(prospect.id).catch(() => null);
    }

    return NextResponse.json({
      ...base,
      handoff: { id: draft.handoffId, revision: draft.revision, status: 'draft' },
      invitation,
      next: nextStepsFor(mode, invitation.sent),
    });
  } catch (error: any) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    const unauthenticated = String(error?.message || '').includes('authenticated')
      || String(error?.message || '').includes('Admin access');
    console.error('[jana/prospects] POST failed', error);
    return NextResponse.json(
      { error: unauthenticated ? 'Not authorized' : (error?.message || 'Failed to create prospect') },
      { status: unauthenticated ? 401 : status }
    );
  }
}
