import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { query, queryOne, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { preserveVendorContact } from '@/lib/vendor-contact-lock';
import { invalidateCache } from '@/lib/cache';
import { MINISITE_LAYOUT_KEY } from '@/lib/minisite-layout';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vendor/business
 * Returns the business data for the currently logged-in vendor.
 * Also accepts ?id=X to fetch a specific business — only if it belongs to the vendor
 * (or vendor is admin/super_admin).
 *
 * GET /api/vendor/business/sections
 * Returns sections for the vendor's business type.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedId = searchParams.get('id');
    const includeSections = searchParams.get('sections') === '1';

    // Resolve which business ID to use
    let businessId: string | null = null;

    const isAdmin = ['super_admin', 'content_admin', 'sales_manager', 'support_agent'].includes(user.role || '');

    if (requestedId) {
      // Admin can fetch any business; vendor can only fetch their own
      if (isAdmin) {
        businessId = requestedId;
      } else {
        // Verify the requested business belongs to this vendor
        const ownership = await queryOne(
          'SELECT id FROM businesses WHERE (id = ? OR slug = ?) AND vendor_id = ?',
          [requestedId, requestedId, user.id]
        ) as any;
        if (!ownership) {
          return NextResponse.json({ error: 'Business not found or access denied' }, { status: 403 });
        }
        businessId = ownership.id;
      }
    } else {
      // Fall back to vendor's linked business
      businessId = (user as any).businessId || null;
    }

    if (!businessId) {
      return NextResponse.json({ error: 'No business linked to this account' }, { status: 404 });
    }

    const business = await queryOne(`
      SELECT b.*, 
             bt.name as type_name, bt.icon as type_icon, bt.icon_color as type_icon_color,
             bt.parent_id as parent_type_id,
             parent_bt.name as parent_type_name,
             p.email as vendor_email, p.display_name as vendor_name
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      LEFT JOIN business_types parent_bt ON parent_bt.id = bt.parent_id
      LEFT JOIN profiles p ON b.vendor_id = p.id
      WHERE b.id = ? OR b.slug = ?
    `, [businessId, businessId]) as any;

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Parse JSON fields safely
    if (business.custom_data) {
      business.custom_data = typeof business.custom_data === 'string'
        ? JSON.parse(business.custom_data)
        : business.custom_data;
    }

    // Optionally include sections for this business type
    if (includeSections && business.type_id) {
      const sections = await query(
        'SELECT * FROM business_sections WHERE type_id = ? OR is_global = 1 ORDER BY sort_order ASC',
        [business.type_id]
      ) as any[];
      return NextResponse.json({ business, sections });
    }

    return NextResponse.json(business);
  } catch (err: any) {
    console.error('[vendor/business GET]', err);
    return NextResponse.json({ error: err.message || 'Failed to load business' }, { status: 500 });
  }
}

/**
 * PATCH /api/vendor/business
 * Allows vendors to update public business content while keeping contact number and slug fixed.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { custom_data, phone, whatsapp, description, name } = body;

    const businessId = (user as any).businessId;
    if (!businessId) {
      return NextResponse.json({ error: 'No business linked to this account' }, { status: 404 });
    }
    if (phone !== undefined || whatsapp !== undefined) {
      return NextResponse.json({ error: 'The business contact number is fixed to the WhatsApp invitation. Contact SiWiFy to request a change.' }, { status: 403 });
    }

    // Only allow updating safe vendor-editable fields
    const updates: string[] = [];
    const params: any[] = [];

    let oldBusinessName: string | null = null;
    let businessSlug: string | null = null;
    if (name !== undefined) {
      const business = await queryOne<any>('SELECT name, slug FROM businesses WHERE id = ?', [businessId]);
      if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      oldBusinessName = business.name || '';
      businessSlug = business.slug || businessId;
    }

    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (name !== undefined) {
      const businessName = typeof name === 'string' ? name.trim() : '';
      if (!businessName || businessName.length > 255) {
        return NextResponse.json({ error: 'Enter a business name between 1 and 255 characters.' }, { status: 400 });
      }
      updates.push('name = ?');
      params.push(businessName);
    }
    if (custom_data !== undefined) {
      const current = await queryOne<any>('SELECT custom_data FROM businesses WHERE id = ?', [businessId]);
      const currentData = current?.custom_data
        ? (typeof current.custom_data === 'string' ? JSON.parse(current.custom_data) : current.custom_data)
        : {};
      updates.push('custom_data = ?');
      params.push(JSON.stringify(preserveVendorContact(currentData, custom_data)));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    params.push(businessId);
    await execute(`UPDATE businesses SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, params);

    if (name !== undefined && businessSlug && oldBusinessName !== name.trim()) {
      const layoutRow = await queryOne<any>(
        'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
        [MINISITE_LAYOUT_KEY(businessSlug)]
      );
      if (layoutRow?.config) {
        const config = typeof layoutRow.config === 'string' ? JSON.parse(layoutRow.config) : layoutRow.config;
        if (Array.isArray(config?.components)) {
          let changed = false;
          config.components = config.components.map((component: any) => {
            if (component.type !== 'vendor_hero' || component.props?.title !== oldBusinessName) return component;
            changed = true;
            return { ...component, props: { ...component.props, title: name.trim() } };
          });
          if (changed) {
            await execute('UPDATE website_configs SET config = ? WHERE type = ?', [
              JSON.stringify(config),
              MINISITE_LAYOUT_KEY(businessSlug),
            ]);
          }
        }
      }
      invalidateCache.websiteSettings();
      revalidatePath(`/${businessSlug}`);
      revalidatePath('/[slug]', 'page');
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[vendor/business PATCH]', err);
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 });
  }
}
