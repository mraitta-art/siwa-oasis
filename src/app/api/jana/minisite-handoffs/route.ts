import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { execute, query, queryOne, transaction } from '@/lib/db';
import { invalidateCache } from '@/lib/cache';
import { getBusinessTier, getTierRules, validateMinisiteLayout } from '@/lib/minisite-governance';
import { MINISITE_LAYOUT_KEY, type MinisiteLayout } from '@/lib/minisite-layout';
import { saveMinisiteDraft } from '@/lib/minisite-drafts';
import { applyVendorServiceLevel } from '@/lib/vendor-service-levels';
import { sendMinisiteInvitation } from '@/lib/minisite-invitation';
import {
  ADMIN_MINISITE_PUBLICATION_ACKNOWLEDGMENT,
  ADMIN_MINISITE_PUBLICATION_ACKNOWLEDGMENT_VERSION,
} from '@/lib/minisite-admin-publication';
import { versionRole, readVersionMeta, type VersionTrack } from '@/lib/minisite-versions';

export const dynamic = 'force-dynamic';

function responseError(error: any) {
  const message = error?.message || 'Minisite handoff request failed';
  const status = Number.isInteger(error?.status)
    ? error.status
    : message === 'Not authenticated' ? 401 : message.includes('Admin access required') ? 403 : 500;
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

async function addEvent(handoffId: string, eventType: string, payload: object, actorId?: string) {
  await execute(
    'INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload, actor_id) VALUES (?, ?, ?, ?)',
    [handoffId, eventType, JSON.stringify(payload), actorId || null]
  );
}

async function getBusinessPreview(businessId: string) {
  const business = await queryOne<any>(
    `SELECT b.id, b.name, b.slug, b.type_id, b.custom_data, b.vendor_phone, bt.name AS type_name
     FROM businesses b LEFT JOIN business_types bt ON bt.id = b.type_id WHERE b.id = ? LIMIT 1`,
    [businessId]
  );
  if (!business) return null;

  const customData = parseJson(business.custom_data);
  const [gallery, blogs, products] = await Promise.all([
    query<any>(
      `SELECT id, url, caption, is_hero FROM vendor_gallery
       WHERE business_id = ? AND approval_status = 'approved' AND show_on_minisite = 1
       ORDER BY is_hero DESC, id DESC`,
      [businessId]
    ).catch(() => []),
    query<any>(
      `SELECT id, title, content, excerpt, cover_image FROM section_blogs
       WHERE business_id = ? AND status = 'published' AND show_on_minisite = 1
       ORDER BY published_at DESC`,
      [businessId]
    ).catch(() => []),
    query<any>(
      `SELECT id, title, price, duration, image_url, category, description, is_featured
       FROM tour_products WHERE (vendor_business_id = ? OR vendor_business_id IS NULL) AND is_active = 1
       ORDER BY is_featured DESC, created_at DESC`,
      [businessId]
    ).catch(() => []),
  ]);

  return {
    id: business.id,
    slug: business.slug || business.id,
    name: business.name,
    type_id: business.type_id,
    type_name: business.type_name || '',
    custom_data: customData,
    gallery,
    blogs,
    tourProducts: products,
    vendorPhone: business.vendor_phone || '',
    siteSettings: {},
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const handoffId = searchParams.get('handoffId');
    const businessId = searchParams.get('businessId');

    if (handoffId) {
      const handoff = await queryOne<any>(
        'SELECT id, business_id, revision, status, layout, vendor_phone, token_expires_at, whatsapp_message_id, whatsapp_error, agreement_version, accepted_name, accepted_at, changes_requested_note, created_at, updated_at FROM minisite_vendor_handoffs WHERE id = ?',
        [handoffId]
      );
      if (!handoff) return NextResponse.json({ error: 'Minisite draft not found' }, { status: 404 });
      const business = await getBusinessPreview(handoff.business_id);
      const events = await query<any>(
        'SELECT id, event_type, payload, actor_id, created_at FROM minisite_vendor_handoff_events WHERE handoff_id = ? ORDER BY created_at DESC LIMIT 100',
        [handoffId]
      );
      return NextResponse.json({
        ...handoff,
        layout: parseJson(handoff.layout),
        business,
        events: events.map((event: any) => ({ ...event, payload: parseJson(event.payload) })),
      });
    }

    const rows = await query<any>(
      `SELECT h.id, h.business_id, h.revision, h.status, h.vendor_phone, h.whatsapp_error,
              h.agreement_version, h.accepted_name, h.accepted_at, h.changes_requested_note,
              h.layout, h.created_at, h.updated_at, b.name AS business_name, b.slug AS business_slug
       FROM minisite_vendor_handoffs h
       LEFT JOIN businesses b ON b.id = h.business_id
       ${businessId ? 'WHERE h.business_id = ?' : ''}
       ORDER BY h.updated_at DESC LIMIT 300`,
      businessId ? [businessId] : []
    );
    // Ship a lightweight projection: role + the free/paid meta live inside the
    // layout JSON, so we extract only what the Versions chooser needs and drop
    // the (potentially large) layout blob from the list response.
    const handoffs = rows.map((h: any) => {
      const meta = readVersionMeta(parseJson(h.layout, {}));
      return {
        id: h.id,
        business_id: h.business_id,
        revision: h.revision,
        status: h.status,
        role: versionRole(h.status),
        track: meta.track,
        registration_paid: meta.registration_paid,
        registration_ref: meta.registration_ref,
        vendor_phone: h.vendor_phone,
        whatsapp_error: h.whatsapp_error,
        agreement_version: h.agreement_version,
        accepted_name: h.accepted_name,
        accepted_at: h.accepted_at,
        changes_requested_note: h.changes_requested_note,
        created_at: h.created_at,
        updated_at: h.updated_at,
        business_name: h.business_name,
        business_slug: h.business_slug,
      };
    });
    return NextResponse.json({ handoffs });
  } catch (error: any) {
    return responseError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const action = String(body.action || '');

    if (action === 'save_draft') {
      const saved = await saveMinisiteDraft({
        businessId: String(body.businessId || ''),
        layout: body.layout,
        vendorPhone: body.vendorPhone,
        createdBy: admin.id,
      });
      return NextResponse.json({ success: true, ...saved, status: 'draft' });
    }

    if (action === 'send_invitation') {
      try {
        const result = await sendMinisiteInvitation({
          handoffId: String(body.handoffId || ''),
          vendorPhone: body.vendorPhone,
          adminId: admin.id,
        });
        return NextResponse.json({ success: true, status: 'sent', ...result });
      } catch (error: any) {
        if (Number.isInteger(error?.status)) {
          return NextResponse.json({ error: error.message }, { status: error.status });
        }
        throw error;
      }
    }

    if (action === 'publish_admin') {
      const handoffId = String(body.handoffId || '');
      if (!handoffId || body.ownershipAcknowledged !== true) {
        return NextResponse.json({
          error: 'Confirm the admin publication responsibility statement before publishing.',
        }, { status: 400 });
      }

      const handoff = await queryOne<any>(
        `SELECT h.id, h.business_id, h.revision, h.status, h.layout, b.slug, b.name
         FROM minisite_vendor_handoffs h
         JOIN businesses b ON b.id = h.business_id
         WHERE h.id = ? LIMIT 1`,
        [handoffId]
      );
      if (!handoff) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      if (handoff.status !== 'draft') {
        return NextResponse.json({ error: 'Only a saved admin draft can be published through this flow.' }, { status: 409 });
      }

      const layout = parseJson(handoff.layout, null);
      if (!layout || !Array.isArray(layout.components) || layout.components.length === 0) {
        return NextResponse.json({ error: 'The saved draft has no publishable layout components.' }, { status: 400 });
      }

      const business = await queryOne<any>(
        'SELECT id, slug, type_id, subscription_tier, is_master FROM businesses WHERE id = ? LIMIT 1',
        [handoff.business_id]
      );
      if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

      const allowed = await getTierRules(getBusinessTier(business));
      const components = validateMinisiteLayout(layout.components, allowed);
      if (components.length === 0) {
        return NextResponse.json({ error: 'No components in this draft are allowed for the business tier.' }, { status: 400 });
      }

      const publishedAt = new Date().toISOString();
      const publishedLayout: MinisiteLayout = {
        mode: layout.mode === 'untied' ? 'untied' : 'replace',
        components,
        site_settings: layout.site_settings || {},
        updated_at: publishedAt,
        updated_by: admin.id,
      };
      const publicSlug = handoff.slug || handoff.business_id;

      await transaction(async connection => {
        const [updateResult] = await connection.execute(
          `UPDATE minisite_vendor_handoffs
           SET status = 'published', layout = ?, token_hash = NULL, token_expires_at = NULL
           WHERE id = ? AND business_id = ? AND status = 'draft'`,
          [JSON.stringify(publishedLayout), handoffId, handoff.business_id]
        );
        if (!(updateResult as { affectedRows?: number }).affectedRows) {
          const conflict = new Error('This draft changed before it could be published.');
          Object.assign(conflict, { status: 409 });
          throw conflict;
        }
        await connection.execute(
          `UPDATE minisite_vendor_handoffs
           SET status = 'expired', token_hash = NULL, token_expires_at = NULL
           WHERE business_id = ? AND status = 'published' AND id <> ?`,
          [handoff.business_id, handoffId]
        );
        await connection.execute(
          `INSERT INTO website_configs (type, config)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE config = VALUES(config)`,
          [MINISITE_LAYOUT_KEY(publicSlug), JSON.stringify(publishedLayout)]
        );
        await connection.execute(
          `INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload, actor_id)
           VALUES (?, 'admin_published', ?, ?)`,
          [
            handoffId,
            JSON.stringify({
              revision: handoff.revision,
              business_name: handoff.name,
              acknowledgment_version: ADMIN_MINISITE_PUBLICATION_ACKNOWLEDGMENT_VERSION,
              acknowledgment_text: ADMIN_MINISITE_PUBLICATION_ACKNOWLEDGMENT,
              acknowledged_at: publishedAt,
            }),
            admin.id,
          ]
        );
      });

      // Publishing a team-prepared minisite is the Level 2 service itself, even when
      // the vendor has not been sent a review link yet.
      if (!layout?.outreach?.template_id) {
        await applyVendorServiceLevel({
          businessId: handoff.business_id,
          toLevel: 'curated',
          triggeredBy: admin.id,
          triggerType: 'admin_promotion',
          reason: 'Curated minisite published by the Siwa team',
          metadata: { handoff_id: handoffId, revision: handoff.revision, source: 'minisite_admin_published' },
        });
      }

      invalidateCache.websiteSettings();
      revalidatePath(`/${publicSlug}`);
      revalidatePath('/[slug]', 'page');
      return NextResponse.json({
        success: true,
        status: 'published',
        slug: publicSlug,
        revision: handoff.revision,
      });
    }

    if (action === 'publish') {
      const handoffId = String(body.handoffId || '');
      const handoff = await queryOne<any>(
        `SELECT h.id, h.business_id, h.revision, h.status, h.layout, b.slug, b.name
         FROM minisite_vendor_handoffs h JOIN businesses b ON b.id = h.business_id WHERE h.id = ?`,
        [handoffId]
      );
      if (!handoff) return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
      if (handoff.status !== 'accepted') {
        return NextResponse.json({ error: 'The vendor must accept this revision before it can be published.' }, { status: 409 });
      }
      const layout = parseJson(handoff.layout, null);
      if (!layout || !Array.isArray(layout.components) || layout.components.length === 0) {
        return NextResponse.json({ error: 'The accepted revision has no publishable layout components.' }, { status: 400 });
      }

      const business = await queryOne<any>(
        'SELECT id, slug, type_id, subscription_tier, is_master FROM businesses WHERE id = ? LIMIT 1',
        [handoff.business_id]
      );
      if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

      const allowed = await getTierRules(getBusinessTier(business));
      const components = validateMinisiteLayout(layout.components, allowed);
      if (components.length === 0) {
        return NextResponse.json({ error: 'No components in this revision are allowed for the business tier.' }, { status: 400 });
      }

      const publishedAt = new Date().toISOString();
      const publishedLayout: MinisiteLayout = {
        mode: layout.mode === 'untied' ? 'untied' : 'replace',
        components,
        site_settings: layout.site_settings || {},
        updated_at: publishedAt,
        updated_by: admin.id,
      };
      const publicSlug = handoff.slug || handoff.business_id;

      await transaction(async connection => {
        await connection.execute(
          `UPDATE minisite_vendor_handoffs
           SET status = 'expired', token_hash = NULL, token_expires_at = NULL
           WHERE business_id = ? AND status = 'published' AND id <> ?`,
          [handoff.business_id, handoffId]
        );
        await connection.execute(
          `INSERT INTO website_configs (type, config)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE config = VALUES(config)`,
          [MINISITE_LAYOUT_KEY(publicSlug), JSON.stringify(publishedLayout)]
        );
        const [updateResult] = await connection.execute(
          `UPDATE minisite_vendor_handoffs
           SET status = 'published', layout = ?, token_hash = NULL, token_expires_at = NULL
           WHERE business_id = ? AND id = ? AND status = 'accepted'`,
          [JSON.stringify(publishedLayout), handoff.business_id, handoffId]
        );
        if (!(updateResult as { affectedRows?: number }).affectedRows) {
          const conflict = new Error('This accepted revision changed before it could be published.');
          Object.assign(conflict, { status: 409 });
          throw conflict;
        }
        await connection.execute(
          `INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload, actor_id)
           VALUES (?, 'published', ?, ?)`,
          [handoffId, JSON.stringify({ revision: handoff.revision }), admin.id]
        );
      });
      invalidateCache.websiteSettings();
      revalidatePath(`/${publicSlug}`);
      revalidatePath('/[slug]', 'page');
      return NextResponse.json({ success: true, status: 'published', slug: publicSlug });
    }

    if (action === 'update_status') {
      const handoffId = String(body.handoffId || '');
      const status = String(body.status || '');
      // changes_requested is also written by the packages board when an admin logs the
      // vendor's reply; the handoff itself has no other path that sets it.
      if (!['followup_due', 'replied', 'changes_requested'].includes(status)) {
        return NextResponse.json({ error: 'Unsupported CRM status' }, { status: 400 });
      }
      const handoff = await queryOne<any>('SELECT id, status FROM minisite_vendor_handoffs WHERE id = ? LIMIT 1', [handoffId]);
      if (!handoff) return NextResponse.json({ error: 'Handoff not found' }, { status: 404 });
      if (['accepted', 'published', 'expired'].includes(handoff.status)) {
        return NextResponse.json({ error: 'This handoff is already complete.' }, { status: 409 });
      }
      await execute('UPDATE minisite_vendor_handoffs SET status = ? WHERE id = ?', [status, handoffId]);
      await addEvent(handoffId, status, { note: String(body.note || '').slice(0, 500) }, admin.id);
      return NextResponse.json({ success: true, status });
    }

    if (action === 'publish_version') {
      // Promote ANY working revision to the single live (governed public) version.
      // With the generated-baseline model this is exactly how a PAID version
      // "replaces the free one": the public view switches from the auto-generated
      // free layout to this published layout, and any previously published version
      // is archived to 'expired' (recoverable). Payment is tracked in layout.meta,
      // never a gate.
      const handoffId = String(body.handoffId || '');
      if (!handoffId) return NextResponse.json({ error: 'handoffId is required' }, { status: 400 });

      const handoff = await queryOne<any>(
        `SELECT h.id, h.business_id, h.revision, h.status, h.layout, b.slug, b.name
           FROM minisite_vendor_handoffs h JOIN businesses b ON b.id = h.business_id
          WHERE h.id = ? LIMIT 1`,
        [handoffId]
      );
      if (!handoff) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      if (handoff.status === 'published') {
        return NextResponse.json({ error: 'This version is already the live one.' }, { status: 409 });
      }
      if (handoff.status === 'expired') {
        return NextResponse.json({ error: 'Restore this archived version before publishing it.' }, { status: 409 });
      }

      const layout = parseJson(handoff.layout, null);
      if (!layout || !Array.isArray(layout.components) || layout.components.length === 0) {
        return NextResponse.json({ error: 'This version has no publishable layout components.' }, { status: 400 });
      }

      const business = await queryOne<any>(
        'SELECT id, slug, type_id, subscription_tier, is_master FROM businesses WHERE id = ? LIMIT 1',
        [handoff.business_id]
      );
      if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

      const allowed = await getTierRules(getBusinessTier(business));
      const components = validateMinisiteLayout(layout.components, allowed);
      if (components.length === 0) {
        return NextResponse.json({ error: 'No components in this version are allowed for the business tier.' }, { status: 400 });
      }

      const publishedAt = new Date().toISOString();
      const registrationPaid = body.registrationPaid === true;      // tracked, non-blocking
      const registrationRef = String(body.registrationRef || '').slice(0, 255) || null;
      // Admin designates this version's track. 'paid' unlocks the multi-section
      // (sectional database) experience at /{slug}/{section}; 'free' keeps the
      // minisite a single flat page. Stored in layout.meta (no schema change).
      const track: VersionTrack = body.track === 'free' ? 'free' : 'paid';

      // The track + payment snapshot are stamped into the layout JSON so no
      // schema change is required.
      const publishedLayout: MinisiteLayout = {
        mode: layout.mode === 'untied' ? 'untied' : 'replace',
        components,
        site_settings: layout.site_settings || {},
        updated_at: publishedAt,
        updated_by: admin.id,
      } as MinisiteLayout;
      (publishedLayout as any).meta = {
        track,
        registration_paid: registrationPaid,
        registration_ref: registrationRef,
        replaced: 'free_baseline',
        published_at: publishedAt,
      };
      const publicSlug = handoff.slug || handoff.business_id;

      await transaction(async connection => {
        const [updateResult] = await connection.execute(
          `UPDATE minisite_vendor_handoffs
             SET status = 'published', layout = ?, token_hash = NULL, token_expires_at = NULL
           WHERE id = ? AND business_id = ? AND status NOT IN ('published','expired')`,
          [JSON.stringify(publishedLayout), handoffId, handoff.business_id]
        );
        if (!(updateResult as { affectedRows?: number }).affectedRows) {
          const conflict = new Error('This version changed before it could be published.');
          Object.assign(conflict, { status: 409 });
          throw conflict;
        }
        // Recoverable archive of the superseded version (paid or free).
        await connection.execute(
          `UPDATE minisite_vendor_handoffs
             SET status = 'expired', token_hash = NULL, token_expires_at = NULL
           WHERE business_id = ? AND status = 'published' AND id <> ?`,
          [handoff.business_id, handoffId]
        );
        await connection.execute(
          `INSERT INTO website_configs (type, config) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE config = VALUES(config)`,
          [MINISITE_LAYOUT_KEY(publicSlug), JSON.stringify(publishedLayout)]
        );
        await connection.execute(
          `INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload, actor_id)
           VALUES (?, 'version_published', ?, ?)`,
          [handoffId, JSON.stringify({
            revision: handoff.revision,
            business_name: handoff.name,
            track,
            change: `${track === 'paid' ? 'PAID (sectioned)' : 'FREE (flat)'} version published; previous live version archived (recoverable)`,
            registration_paid: registrationPaid,
            registration_ref: registrationRef,
            published_at: publishedAt,
          }), admin.id]
        );
      });

      // Only a PAID (sectioned) publication is the team-curated service itself; a
      // FREE (flat) publication is a lightweight listing and does not promote level.
      if (track === 'paid' && !layout?.outreach?.template_id) {
        await applyVendorServiceLevel({
          businessId: handoff.business_id,
          toLevel: 'curated',
          triggeredBy: admin.id,
          triggerType: 'admin_promotion',
          reason: 'Paid minisite version published (unlocked the sectional system)',
          metadata: { handoff_id: handoffId, revision: handoff.revision, source: 'minisite_paid_published', registration_paid: registrationPaid },
        });
      }

      invalidateCache.websiteSettings();
      revalidatePath(`/${publicSlug}`);
      revalidatePath('/[slug]', 'page');
      return NextResponse.json({ success: true, status: 'published', slug: publicSlug, revision: handoff.revision, registrationPaid });
    }

    if (action === 'revert_to_free') {
      // Un-publish the live paid version so the public page falls back to the FREE
      // generated baseline. The paid revision is archived to 'expired' (recoverable).
      // We must also clear the legacy website_configs mirror, otherwise the public
      // route would keep rendering the last paid layout instead of the free baseline.
      const handoffId = String(body.handoffId || '');
      const handoff = await queryOne<any>(
        'SELECT id, business_id, revision, status FROM minisite_vendor_handoffs WHERE id = ? LIMIT 1',
        [handoffId]
      );
      if (!handoff) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      if (handoff.status !== 'published') {
        return NextResponse.json({ error: 'Only the live version can be reverted to free.' }, { status: 409 });
      }
      const business = await queryOne<any>('SELECT slug FROM businesses WHERE id = ? LIMIT 1', [handoff.business_id]);
      const publicSlug = business?.slug || handoff.business_id;
      await execute(
        `UPDATE minisite_vendor_handoffs SET status = 'expired', token_hash = NULL, token_expires_at = NULL WHERE id = ?`,
        [handoffId]
      );
      await execute('DELETE FROM website_configs WHERE type = ?', [MINISITE_LAYOUT_KEY(publicSlug)]);
      await addEvent(handoffId, 'version_reverted_free', {
        revision: handoff.revision,
        change: 'live paid version archived; public view reverts to the free generated baseline',
      }, admin.id);
      invalidateCache.websiteSettings();
      revalidatePath(`/${publicSlug}`);
      revalidatePath('/[slug]', 'page');
      return NextResponse.json({ success: true, status: 'expired', revertedTo: 'free_baseline', slug: publicSlug });
    }

    if (action === 'archive_version') {
      // Recoverable archive of a NON-live revision => 'expired'. The live version is
      // archived only implicitly (on republish) or explicitly via revert_to_free.
      const handoffId = String(body.handoffId || '');
      const handoff = await queryOne<any>('SELECT id, status FROM minisite_vendor_handoffs WHERE id = ? LIMIT 1', [handoffId]);
      if (!handoff) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      if (handoff.status === 'published') {
        return NextResponse.json({ error: 'The live version is archived when you publish another or use "Revert to free".' }, { status: 409 });
      }
      if (handoff.status === 'expired') {
        return NextResponse.json({ error: 'This version is already archived.' }, { status: 409 });
      }
      await execute(`UPDATE minisite_vendor_handoffs SET status = 'expired', token_hash = NULL, token_expires_at = NULL WHERE id = ?`, [handoffId]);
      await addEvent(handoffId, 'version_archived', { from_status: handoff.status, to_status: 'expired' }, admin.id);
      return NextResponse.json({ success: true, status: 'expired' });
    }

    if (action === 'restore_version') {
      // Restore an archived ('expired') revision back to a private working draft.
      const handoffId = String(body.handoffId || '');
      const handoff = await queryOne<any>('SELECT id, status FROM minisite_vendor_handoffs WHERE id = ? LIMIT 1', [handoffId]);
      if (!handoff) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      if (handoff.status !== 'expired') {
        return NextResponse.json({ error: 'Only an archived version can be restored.' }, { status: 409 });
      }
      await execute(`UPDATE minisite_vendor_handoffs SET status = 'draft' WHERE id = ?`, [handoffId]);
      await addEvent(handoffId, 'version_restored', { from_status: handoff.status, to_status: 'draft' }, admin.id);
      return NextResponse.json({ success: true, status: 'draft' });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    console.error('[jana/minisite-handoffs]', error);
    return responseError(error);
  }
}
