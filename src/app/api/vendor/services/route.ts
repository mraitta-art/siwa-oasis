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

function appliesToField(field: any, attributes: Record<string, any>) {
  const condition = parse(field.applies_to, null);
  if (!condition || !condition.field || !Array.isArray(condition.values)) return true;
  const selected = attributes[condition.field];
  return condition.values.includes(selected);
}

function validateAttributes(fields: any[], input: unknown) {
  const submitted = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, any> : {};
  const allowedNames = new Set(fields.map(field => field.name));
  const unknownNames = Object.keys(submitted).filter(name => !allowedNames.has(name));
  if (unknownNames.length) return { error: 'Unknown service fields were submitted', fields: unknownNames };

  const submittedAttributes = Object.fromEntries(
    Object.entries(submitted).filter(([name, value]) => allowedNames.has(name) && value !== '' && value !== null && value !== undefined)
  );
  const activeFields = fields.filter(field => appliesToField(field, submittedAttributes));
  const activeNames = new Set(activeFields.map(field => field.name));
  const attributes = Object.fromEntries(
    Object.entries(submittedAttributes).filter(([name]) => activeNames.has(name))
  );
  const missing = activeFields
    .filter(field => field.required && (attributes[field.name] === undefined || attributes[field.name] === ''))
    .map(field => field.name);
  if (missing.length) return { error: 'Required service fields are missing', fields: missing };

  for (const field of activeFields) {
    const value = attributes[field.name];
    if (value === undefined) continue;
    const options = parse(field.options);
    if (field.field_type === 'select' && !options.includes(value)) {
      return { error: `${field.label} has an invalid selection`, fields: [field.name] };
    }
    if (field.field_type === 'multiselect' && (!Array.isArray(value) || value.some(option => !options.includes(option)))) {
      return { error: `${field.label} has an invalid selection`, fields: [field.name] };
    }
    if (field.field_type === 'number' && !Number.isFinite(Number(value))) {
      return { error: `${field.label} must be a number`, fields: [field.name] };
    }
  }
  return { attributes };
}

function normalizedPrice(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireVendor();
    const category = request.nextUrl.searchParams.get('category');
    const templates = await query(`
      SELECT t.id AS template_id, t.category, t.label AS template_label, t.description AS template_description,
             f.id AS field_id, f.name, f.label, f.field_type, f.required, f.options, f.validation, f.applies_to, f.display_order
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
    const fields = await query<any>('SELECT name, label, field_type, required, options, applies_to FROM vendor_service_template_fields WHERE template_id = ? AND active = TRUE', [template[0].id]);
    const validation = validateAttributes(fields, body.attributes);
    if (validation.error) return NextResponse.json(validation, { status: 400 });
    const attributes = validation.attributes || {};
    const price = normalizedPrice(body.price);
    if (price === undefined) return NextResponse.json({ error: 'Price must be a non-negative number' }, { status: 400 });
    const id = randomUUID();
    await execute(`
      INSERT INTO vendor_services
        (id, business_id, vendor_id, category, service_type, title, description, attributes, price, currency, price_unit, capacity, availability, approval_status, audience_scopes, placements, booking_mode, package_eligible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?, ?, ?, ?)`,
      [id, user.businessId, user.id, body.category, body.service_type || attributes.vehicle_type || null, body.title, body.description || null, JSON.stringify(attributes), price, body.currency || 'EGP', body.price_unit || null, body.capacity || attributes.passenger_capacity || null, body.availability || null, JSON.stringify(normalizeAudienceScopes(body.audience_scopes || ['public'])), JSON.stringify(normalizePlacements(body.placements || ['minisite'])), ['request', 'book', 'contact'].includes(body.booking_mode) ? body.booking_mode : 'request', body.package_eligible ? 1 : 0]
    );
    return NextResponse.json({ success: true, id, approval_status: 'pending_approval' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create service' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireVendor();
    const body = await request.json();
    const id = String(body.id || '').trim();
    if (!id) return NextResponse.json({ error: 'Service id is required' }, { status: 400 });
    const rows = await query<any>(
      'SELECT id, category FROM vendor_services WHERE id = ? AND business_id = ? LIMIT 1',
      [id, user.businessId]
    );
    if (!rows.length) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    const category = body.category || rows[0].category;
    const templates = await query<any>(
      'SELECT id FROM vendor_service_templates WHERE category = ? AND active = TRUE ORDER BY id LIMIT 1',
      [category]
    );
    if (!templates.length) return NextResponse.json({ error: 'No active service template exists for this category' }, { status: 400 });
    const fields = await query<any>(
      'SELECT name, label, field_type, required, options, applies_to FROM vendor_service_template_fields WHERE template_id = ? AND active = TRUE',
      [templates[0].id]
    );
    const validation = validateAttributes(fields, body.attributes);
    if (validation.error) return NextResponse.json(validation, { status: 400 });
    const attributes = validation.attributes || {};
    const price = normalizedPrice(body.price);
    if (price === undefined) return NextResponse.json({ error: 'Price must be a non-negative number' }, { status: 400 });
    if (!body.title) return NextResponse.json({ error: 'Service name is required' }, { status: 400 });
    await execute(
      `UPDATE vendor_services
       SET category = ?, service_type = ?, title = ?, description = ?, attributes = ?,
           price = ?, currency = ?, price_unit = ?, capacity = ?, availability = ?,
           approval_status = 'pending_approval', approved_by = NULL, approved_at = NULL,
           rejection_note = NULL
       WHERE id = ? AND business_id = ?`,
      [
        category,
        body.service_type || attributes.vehicle_type || null,
        body.title,
        body.description || null,
        JSON.stringify(attributes),
        price,
        body.currency || 'EGP',
        body.price_unit || null,
        body.capacity || attributes.passenger_capacity || null,
        body.availability || null,
        id,
        user.businessId,
      ]
    );
    return NextResponse.json({ success: true, id, approval_status: 'pending_approval' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireVendor();
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Service id is required' }, { status: 400 });
    const result: any = await execute('DELETE FROM vendor_services WHERE id = ? AND business_id = ?', [id, user.businessId]);
    if (!result.affectedRows) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete service' }, { status: 500 });
  }
}