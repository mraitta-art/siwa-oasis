import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * PATCH /api/vendor/minisite/settings
 * Body: {
 *   hidden_sections: string[],
 *   section_labels: Record<string, string>,
 *   section_order: string[],
 *   minisite_color?: string,
 *   minisite_font?: string,
 * }
 * Saves minisite customization to the business custom_data JSON blob.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user.businessId) {
      return NextResponse.json({ error: 'No business linked to this account' }, { status: 404 });
    }

    const { hidden_sections, section_labels, section_order, minisite_color, minisite_font, custom_domain } = await req.json();

    let canEditLabels = false;
    try {
      const controls = (await query('SELECT allow_section_label_edit FROM vendor_service_controls WHERE business_id = ?', [user.businessId])) as any[];
      canEditLabels = controls.length > 0 && !!controls[0].allow_section_label_edit;
    } catch {
      canEditLabels = false;
    }

    // Load existing custom_data
    const rows = (await query('SELECT custom_data FROM businesses WHERE id = ?', [user.businessId])) as any[];
    if (rows.length === 0) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const existing = rows[0].custom_data
      ? (typeof rows[0].custom_data === 'string' ? JSON.parse(rows[0].custom_data) : rows[0].custom_data)
      : {};

    // Merge settings
    const updated = {
      ...existing,
      hidden_sections: hidden_sections ?? existing.hidden_sections ?? [],
      section_labels:  canEditLabels ? (section_labels ?? existing.section_labels ?? {}) : (existing.section_labels || {}),
      section_order:   section_order   ?? existing.section_order   ?? [],
    };

    const normalizedDomain = typeof custom_domain === 'string' && custom_domain.trim()
      ? custom_domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '')
      : null;

    if (normalizedDomain && !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(normalizedDomain)) {
      return NextResponse.json({ error: 'Enter a valid domain name, such as example.com' }, { status: 400 });
    }

    // A domain is not routed until an administrator verifies its DNS ownership.
    await execute(
      `UPDATE businesses SET
         custom_data = ?,
         minisite_color = ?,
         minisite_font  = ?,
         custom_domain = ?,
         custom_domain_verified = 0,
         updated_at = NOW()
       WHERE id = ?`,
      [
        JSON.stringify(updated),
        minisite_color || '#D4AF37',
        minisite_font  || 'Inter',
        normalizedDomain,
        user.businessId,
      ]
    );

    return NextResponse.json({ success: true, message: 'Settings saved', section_label_edit_enabled: canEditLabels });
  } catch (error: any) {
    console.error('[vendor/minisite/settings]', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

/**
 * GET /api/vendor/minisite/settings
 * Returns current minisite customization settings.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user.businessId) {
      return NextResponse.json({ error: 'No business linked' }, { status: 404 });
    }

    const rows = (await query(
      'SELECT custom_data, minisite_color, minisite_font, is_published, slug, custom_domain, custom_domain_verified FROM businesses WHERE id = ?',
      [user.businessId]
    )) as any[];

    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const biz = rows[0];
    const customData = biz.custom_data
      ? (typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data)
      : {};

    let sectionLabelEditEnabled = false;
    try {
      const controls = (await query('SELECT allow_section_label_edit FROM vendor_service_controls WHERE business_id = ?', [user.businessId])) as any[];
      sectionLabelEditEnabled = controls.length > 0 && !!controls[0].allow_section_label_edit;
    } catch {}

    return NextResponse.json({
      hidden_sections: customData.hidden_sections || [],
      section_labels:  customData.section_labels  || {},
      section_order:   customData.section_order   || [],
      minisite_color:  biz.minisite_color || '#D4AF37',
      minisite_font:   biz.minisite_font  || 'Inter',
      is_published:    !!biz.is_published,
      slug:            biz.slug || '',
      custom_domain:   biz.custom_domain || '',
      custom_domain_verified: !!biz.custom_domain_verified,
      section_label_edit_enabled: sectionLabelEditEnabled,
    });
  } catch (error: any) {
    console.error('[vendor/minisite/settings GET]', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
