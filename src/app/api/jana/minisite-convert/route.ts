import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryOne, normalizeCustomData } from '@/lib/db';
import { saveDraftManifest, publishManifest } from '@/lib/minisite-manifest';
import {
  builderLayoutToSections,
  getSectionalReadinessReport,
  buildDraftManifest,
} from '@/lib/sectional-migrate';

export const dynamic = 'force-dynamic';

function err(error: any) {
  const message = error?.message || 'Sectional conversion failed';
  const status = message === 'Not authenticated' ? 401 : message.includes('Admin access required') ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}

function parseJson(value: any, fallback: any = {}) {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

async function resolveHandoff(body: any) {
  if (body?.handoffId) {
    return queryOne<any>('SELECT id, business_id, revision, status, layout FROM minisite_vendor_handoffs WHERE id = ?', [body.handoffId]);
  }
  if (body?.businessId) {
    return queryOne<any>(
      `SELECT id, business_id, revision, status, layout FROM minisite_vendor_handoffs
       WHERE business_id = ? ORDER BY (status = 'published') DESC, updated_at DESC LIMIT 1`,
      [body.businessId],
    );
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || 'convert_to_sectional');

    const handoff = await resolveHandoff(body);
    if (!handoff) return NextResponse.json({ error: 'Handoff not found. Provide handoffId or businessId.' }, { status: 404 });

    const businessId = handoff.business_id;
    const business = await queryOne<any>(
      `SELECT b.id, b.slug, b.name, b.type_id, b.template_id, b.custom_data,
              bt.name AS type_name
       FROM businesses b LEFT JOIN business_types bt ON bt.id = b.type_id WHERE b.id = ?`,
      [businessId],
    );
    if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

    const layout = parseJson(handoff.layout, {});
    const customData = normalizeCustomData(business.custom_data);

    // Action 1 — convert builder layout into a DRAFT sectional manifest (no publish, no data writes).
    if (action === 'convert_to_sectional') {
      const sections = builderLayoutToSections(layout, customData);
      if (!sections.length) {
        return NextResponse.json({
          ok: true,
          businessId,
          draftRevision: null,
          sections: [],
          report: [],
          note: 'This layout has no mappable components. Nothing was written.',
        });
      }
      const manifest = buildDraftManifest(businessId, business.template_id || null, sections);
      const saved = await saveDraftManifest(businessId, manifest, 'convert_to_sectional_draft', user.id);
      const report = await getSectionalReadinessReport(business.type_id || null, saved.sections.map((s) => s.id));

      return NextResponse.json({
        ok: true,
        businessId,
        businessName: business.name,
        slug: business.slug,
        draftRevision: saved.revision,
        unpublished: true,
        sections: saved.sections.map((s) => ({
          id: s.id,
          order: s.order,
          enabled: s.enabled,
          componentCount: s.components.length,
          contentKeys: Object.keys(s.content || {}),
        })),
        report,
        note: 'Saved as a DRAFT manifest only. Nothing is public yet. Review the readiness report, then publish when ready.',
      });
    }

    // Action 2 — publish the current DRAFT manifest (explicit, second click).
    if (action === 'publish_sectional_draft') {
      const published = await publishManifest(businessId, user.id);
      const report = await getSectionalReadinessReport(business.type_id || null, published.sections.map((s) => s.id));
      return NextResponse.json({
        ok: true,
        businessId,
        publishedRevision: published.revision,
        sections: published.sections.map((s) => s.id),
        report,
        note: 'Published the sectional manifest. It only overlays sections that already resolve for this business type; check the report for any still blocked.',
      });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error) {
    return err(error);
  }
}
