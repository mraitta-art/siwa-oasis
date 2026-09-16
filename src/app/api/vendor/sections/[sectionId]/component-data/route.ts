import { db } from '@/lib/db';
import { getCurrentUser, requireVendor } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { normalizeAudienceScopes, normalizePlacements } from '@/lib/vendor-service-policy';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const user = await requireVendor();
    const { sectionId } = await params;

    const query = `
      SELECT sc.id, scd.id as data_id, scd.data, scd.status, scd.title
      FROM section_components sc
      LEFT JOIN section_component_data scd ON sc.id = scd.section_component_id AND scd.business_id = ?
      WHERE sc.section_id = ?
      ORDER BY sc.display_order, scd.display_order
    `;

    const [rows] = await db.query(query, [user.businessId, sectionId]);

    const grouped: Record<string, any[]> = {};
    rows?.forEach((row: any) => {
      if (!grouped[row.id]) {
        grouped[row.id] = [];
      }
      if (row.data_id) {
        grouped[row.id].push({
          id: row.data_id,
          data: JSON.parse(row.data || '{}'),
          status: row.status,
          title: row.title
        });
      }
    });

    return Response.json(grouped);
  } catch (error) {
    console.error('Get component data error:', error);
    return Response.json({ error: 'Failed to load data' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const user = await requireVendor();
    const { sectionId } = await params;
    const componentData = await request.json();

    if (!user.businessId) {
      return Response.json({ error: 'Business context missing' }, { status: 403 });
    }

    for (const [componentId, instances] of Object.entries(componentData)) {
      const dataArray = instances as any[];
      const [componentRows] = await db.query(
        'SELECT component_type FROM section_components WHERE id = ? AND section_id = ?',
        [componentId, sectionId]
      );
      const componentType = (componentRows as any[])?.[0]?.component_type;

      if (componentType === 'service_catalog') {
        await db.query(
          'DELETE FROM vendor_services WHERE business_id = ? AND source_component_id = ?',
          [user.businessId, componentId]
        );
      }

      await db.query(
        'DELETE FROM section_component_data WHERE section_component_id = ? AND business_id = ?',
        [componentId, user.businessId]
      );

      for (let idx = 0; idx < dataArray.length; idx++) {
        const inst = dataArray[idx];
        if (!inst.data || Object.keys(inst.data).length === 0) continue;

        const componentDataId = uuidv4();
        await db.query(
          `INSERT INTO section_component_data 
           (id, section_component_id, business_id, data, status, display_order, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            componentDataId,
            componentId,
            user.businessId,
            JSON.stringify(inst.data),
            'pending_approval',
            idx
          ]
        );

        if (componentType === 'service_catalog') {
          const requestedAudiences = normalizeAudienceScopes(inst.data.audience_scopes || inst.data.audiences);
          const requestedPlacements = normalizePlacements(inst.data.placements);
          const bookingMode = ['request', 'book', 'contact'].includes(inst.data.booking_mode) ? inst.data.booking_mode : 'request';
          await db.query(
            `INSERT INTO vendor_services
             (id, business_id, vendor_id, source_component_id, source_component_data_id, category, service_type, title, description, attributes, price, currency, price_unit, capacity, availability, approval_status, audience_scopes, placements, booking_mode, package_eligible)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               category = VALUES(category), service_type = VALUES(service_type), title = VALUES(title), description = VALUES(description), attributes = VALUES(attributes), price = VALUES(price), currency = VALUES(currency), price_unit = VALUES(price_unit), capacity = VALUES(capacity), availability = VALUES(availability), approval_status = 'pending_approval', audience_scopes = VALUES(audience_scopes), placements = VALUES(placements), booking_mode = VALUES(booking_mode), package_eligible = VALUES(package_eligible)`,
            [
              uuidv4(), user.businessId, user.id, componentId, componentDataId,
              inst.data.category || 'Other', inst.data.service_type || null, inst.data.title || inst.title || 'Vendor service',
              inst.data.description || null, JSON.stringify(inst.data), inst.data.price || null, inst.data.currency || 'EGP',
              inst.data.price_unit || null, inst.data.capacity || null, inst.data.availability || null,
              JSON.stringify(requestedAudiences), JSON.stringify(requestedPlacements), bookingMode, inst.data.package_eligible ? 1 : 0
            ]
          );
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Save component data error:', error);
    return Response.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
