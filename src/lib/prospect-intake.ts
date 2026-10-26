import { execute, query, queryOne } from '@/lib/db';
import { createBusinessEntity } from '@/lib/business-creation';
import { resolveTemplateForBusiness, type TemplateResolution } from '@/lib/vendor-template-resolve';
import { normalizeInvitationPhone } from '@/lib/minisite-invitation';
import { digitsOnlySql, normalizePhoneValue, phoneLookupCandidates } from '@/lib/egypt-phone';

/**
 * Prospect intake.
 *
 * The admin has a name and a phone. That is enough to produce a real, claimable
 * minisite: create the business unclaimed, write the canonical contact column
 * (`vendor_phone` — the one every send path reads), resolve the template, and
 * hand back a free baseline layout that is safe to publish as-is.
 *
 * Deliberately reuses `createBusinessEntity` so slug rules, typology checks and
 * canonical custom_data normalisation stay in one place.
 */

export type ProspectMode = 'baseline_send' | 'baseline_manual' | 'build_first';

export const PROSPECT_MODES: ProspectMode[] = ['baseline_send', 'baseline_manual', 'build_first'];

export function normalizeProspectPhone(value: unknown): string {
  return normalizeInvitationPhone(value);
}

export interface ExistingProspect {
  id: string;
  name: string;
  slug: string;
  is_claimed: number | boolean;
}

/** Phone is the identity here: one vendor = one number, never two records. */
export async function findBusinessByPhone(phone: string): Promise<ExistingProspect | null> {
  const digits = normalizePhoneValue(phone);
  if (!digits) return null;
  // Match every written variant (2012… · 012… · 12…) against pure-digit columns,
  // so an admin saving '01222597304' and a vendor typing '+20 12…' is still ONE vendor.
  const candidates = phoneLookupCandidates(digits);
  const placeholders = candidates.map(() => '?').join(', ');

  try {
    return await queryOne<ExistingProspect>(
      `SELECT id, name, slug, is_claimed FROM businesses
        WHERE ${digitsOnlySql('vendor_phone')} IN (${placeholders})
           OR ${digitsOnlySql('phone')} IN (${placeholders})
        LIMIT 1`,
      [...candidates, ...candidates]
    );
  } catch {
    return null;
  }
}

export async function findCrmContactByPhone(phone: string): Promise<{ id: string; full_name: string } | null> {
  try {
    return await queryOne<{ id: string; full_name: string }>(
      'SELECT id, full_name FROM crm_contacts WHERE phone = ? OR phone = ? LIMIT 1',
      [phone, `+${phone}`]
    );
  } catch {
    return null;
  }
}

/**
 * The same four blocks the public route generates when no layout exists —
 * hero, gallery, services, CTA. Proven to render on every typology, and all
 * four are allowed on the free tier by DEFAULT_TIER_RULES.
 */
export function buildBaselineMinisiteLayout() {
  return {
    mode: 'replace' as const,
    components: [
      { id: 'prospect_hero', type: 'vendor_hero', order: 0, props: {} },
      { id: 'prospect_gallery', type: 'vendor_gallery', order: 1, props: {} },
      { id: 'prospect_services', type: 'vendor_services', order: 2, props: {} },
      { id: 'prospect_cta', type: 'cta_section', order: 3, props: {} },
    ],
    site_settings: {},
  };
}

export interface CreatedProspect {
  id: string;
  name: string;
  slug: string;
  template: TemplateResolution;
}

export async function createProspectBusiness(input: {
  name: string;
  phone: string;
  typeId: string;
  note?: string;
  mode: ProspectMode;
  adminId: string;
}): Promise<CreatedProspect> {
  const name = String(input.name || '').trim().slice(0, 200);
  const phone = normalizeProspectPhone(input.phone);
  if (!name || name.length < 2) throw Object.assign(new Error('Enter the vendor business name.'), { status: 400 });
  if (!phone || phone.length < 8 || phone.length > 15) {
    throw Object.assign(new Error('Enter the vendor WhatsApp number in international format.'), { status: 400 });
  }
  if (!input.typeId) {
    throw Object.assign(new Error('Select a specific business typology.'), { status: 400 });
  }

  const placeholders = [
    'صفحة تعريفية أُعدّت بواسطة فريق سيوايفاي — تُحدَّث نبذتها وصورها بعد استلام صاحب النشاط.',
    'A SiWiFy team page — description and photos are updated once the owner claims the business.',
  ].join(' ');

  const created = await createBusinessEntity({
    name,
    type_id: input.typeId,
    phone,
    description: placeholders,
    custom_data: {
      basic: {
        phone,
        whatsapp: phone,
        phone_number: phone,
        description: placeholders,
      },
      sec_1_identity: {
        phone,
        whatsapp: phone,
      },
      connector: { phone },
    },
    status: 'pending',
    is_standalone: false,
    source: 'prospect_quick_create',
    actor_id: input.adminId,
  });

  // `createBusinessEntity` has no contact columns in its INSERT, and every
  // send path reads businesses.vendor_phone. Write it (and the legacy mirrors)
  // after creation; degrade to vendor_phone alone if a column is missing.
  try {
    await execute(
      'UPDATE businesses SET vendor_phone = ?, phone = ?, whatsapp = ?, is_claimed = 0 WHERE id = ?',
      [phone, phone, phone, created.id]
    );
  } catch {
    await execute('UPDATE businesses SET vendor_phone = ? WHERE id = ?', [phone, created.id]).catch(() => {});
  }

  const template = await resolveTemplateForBusiness(created.id);

  try {
    const row = await queryOne<{ custom_data: any }>(
      'SELECT custom_data FROM businesses WHERE id = ? LIMIT 1',
      [created.id]
    );
    let data: Record<string, any> = {};
    try {
      data = typeof row?.custom_data === 'string' ? JSON.parse(row.custom_data) : (row?.custom_data || {});
    } catch {
      data = {};
    }
    data.prospect = {
      mode: input.mode,
      created_by: input.adminId,
      created_at: new Date().toISOString(),
      note: String(input.note || '').slice(0, 500) || null,
      template_source: template.source,
    };
    await execute('UPDATE businesses SET custom_data = ?, updated_at = NOW() WHERE id = ?', [
      JSON.stringify(data),
      created.id,
    ]);
  } catch {
    // Bookkeeping only.
  }

  return { id: created.id, name: created.name, slug: created.slug, template };
}

/** Marks the prospect's lifecycle stage inside custom_data (no schema change). */
export async function markProspectStage(
  businessId: string,
  stage: string,
  extra: Record<string, unknown> = {}
) {
  try {
    const row = await queryOne<{ custom_data: any }>(
      'SELECT custom_data FROM businesses WHERE id = ? LIMIT 1',
      [businessId]
    );
    let data: Record<string, any> = {};
    try {
      data = typeof row?.custom_data === 'string' ? JSON.parse(row.custom_data) : (row?.custom_data || {});
    } catch {
      data = {};
    }
    data.prospect = {
      ...(data.prospect || {}),
      ...extra,
      status: stage,
      status_at: new Date().toISOString(),
    };
    await execute('UPDATE businesses SET custom_data = ?, updated_at = NOW() WHERE id = ?', [
      JSON.stringify(data),
      businessId,
    ]);
  } catch {
    // Bookkeeping only.
  }
}

/** What the admin still has to do, derived from the mode — returned to the UI. */
export function nextStepsFor(mode: ProspectMode, sent: boolean): string[] {
  if (mode === 'build_first') {
    return [
      'Open the Build Studio and shape the layout (hero, gallery, services, CTA).',
      'Save the draft, then send the invitation from the builder — it uses the same token path.',
      'Nothing goes to the vendor until you press send, so you can take your time.',
    ];
  }
  if (mode === 'baseline_manual') {
    return [
      'Copy the WhatsApp text and send it from your own number (human first contact).',
      'Record the reply with “Log response” on the pipeline board.',
      'After acceptance the free trial starts automatically and the page becomes public.',
    ];
  }
  return sent
    ? [
        'The template message is out; the link is valid for 7 days.',
        'Watch the pipeline board for “read” then “accepted” — never chase by phone the same day.',
        'If nothing in 7 days, resend once, then move to changes_requested or park it.',
      ]
    : [
        'WhatsApp template is not configured, so nothing was sent — copy the manual text instead.',
        'Send it from your own number; the review link stays valid for 7 days.',
        'Set WHATSAPP_MINISITE_REVIEW_TEMPLATE to enable one-click sends later.',
      ];
}

export async function listRecentProspects(limit = 60) {
  const sql = `
    SELECT h.id AS handoff_id, h.status, h.revision, h.created_at, h.whatsapp_message_id,
           h.whatsapp_error, h.token_expires_at,
           b.id AS business_id, b.name, b.slug, b.vendor_phone, b.is_claimed,
           JSON_EXTRACT(b.custom_data, '$.prospect.mode') AS mode
      FROM minisite_vendor_handoffs h
      JOIN businesses b ON b.id = h.business_id
     WHERE h.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
       AND b.is_claimed = 0
     ORDER BY h.created_at DESC
     LIMIT ?`;
  try {
    return await query<any>(sql, [limit]);
  } catch {
    // Deployments without JSON_EXTRACT support still get the list.
    try {
      return await query<any>(
        `SELECT h.id AS handoff_id, h.status, h.revision, h.created_at, h.whatsapp_message_id,
                h.whatsapp_error, h.token_expires_at,
                b.id AS business_id, b.name, b.slug, b.vendor_phone, b.is_claimed,
                NULL AS mode
           FROM minisite_vendor_handoffs h
           JOIN businesses b ON b.id = h.business_id
          WHERE h.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
            AND b.is_claimed = 0
          ORDER BY h.created_at DESC
          LIMIT ${Math.max(1, Math.min(200, limit))}`,
        []
      );
    } catch {
      return [];
    }
  }
}
