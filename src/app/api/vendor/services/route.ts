import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireVendor } from '@/lib/auth';
import { normalizeAudienceScopes, normalizePlacements } from '@/lib/vendor-service-policy';
import { randomUUID } from 'crypto';

function parse(value: unknown, fallback: any = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') { try { return JSON.parse(value); } catch { return fallback; } }
  return value ?? fallback;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireVendor();
    const category = request.nextUrl.searchParams.get('category');
    const templates = await query(`
      SELECT t.id AS template_id, t.category, t.label AS template_label, t.description AS template_description,
             f.id AS field_id, f.name, f.label, f.field_type, f.required, f.options, f.validation, f.display_order
      FROM vendor_service_templates t
      LEFT JOIN vendor_service_template_fields f ON f.template_id = t.id AND f.active = TRUE
      WHERE t.active = TRUE ${category ? 'AND t.category = ?' : ''}
      ORDER BY t.category, f.display_order, f.name`, category ? [category] : []);
    const services = await query('SELECT * FROM vendor_services WHERE business_id = ? ORDER BY updated_at DESC', [user.businessId]);
    return NextResponse.json({ templates, services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load vendor services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireVendor();
    const body = await request.json();
    if (!body.category || !body.title) return NextResponse.json({ error: 'Category and title are required' }, { status: 400 });
    const template = await query<any>('SELECT id FROM vendor_service_templates WHERE category = ? AND active = TRUE ORDER BY id LIMIT 1', [body.category]);
    if (!template.length) return NextResponse.json({ error: 'No active service template exists for this category' }, { status: 400 });
    const fields = await query<any>('SELECT name, required FROM vendor_service_template_fields WHERE template_id = ? AND active = TRUE', [template[0].id]);
    const attributes = body.attributes && typeof body.attributes === 'object' ? body.attributes : {};
    const missing = fields.filter(field => field.required && (attributes[field.name] === undefined || attributes[field.name] === '')).map(field => field.name);
    if (missing.length) return NextResponse.json({ error: 'Required service fields are missing', fields: missing }, { status: 400 });
    const id = randomUUID();
    await execute(`
      INSERT INTO vendor_services
        (id, business_id, vendor_id, category, service_type, title, description, attributes, price, currency, price_unit, capacity, availability, approval_status, audience_scopes, placements, booking_mode, package_eligible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?, ?, ?, ?)`,
      [id, user.businessId, user.id, body.category, body.service_type || null, body.title, body.description || null, JSON.stringify(attributes), body.price || null, body.currency || 'EGP', body.price_unit || null, body.capacity || null, body.availability || null, JSON.stringify(normalizeAudienceScopes(body.audience_scopes || ['public'])), JSON.stringify(normalizePlacements(body.placements || ['minisite'])), ['request', 'book', 'contact'].includes(body.booking_mode) ? body.booking_mode : 'request', body.package_eligible ? 1 : 0]
    );
    return NextResponse.json({ success: true, id, approval_status: 'pending_approval' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create service' }, { status: 500 });
  }
}