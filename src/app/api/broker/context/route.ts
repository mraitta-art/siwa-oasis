import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

/**
 * GET /api/broker/context?slug=...&developer=...&development=...&unit=...
 * Resolves broker branding and contact details for minisites.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerSlug = searchParams.get('slug');
    const developerId = searchParams.get('developer_id');
    const developmentId = searchParams.get('development_id');
    const unitId = searchParams.get('unit_id');

    if (!brokerSlug) {
      return NextResponse.json({ active: false });
    }

    // Try finding exact unit match first, then development match, then developer match
    let assignment = null;

    if (unitId) {
      assignment = await queryOne(`
        SELECT bia.*, p.display_name AS broker_name, p.email AS broker_email
        FROM broker_inventory_assignments bia
        JOIN profiles p ON bia.broker_id = p.id
        WHERE bia.broker_slug = ? AND bia.unit_business_id = ? AND bia.status = 'active'
      `, [brokerSlug, unitId]);
    }

    if (!assignment && developmentId) {
      assignment = await queryOne(`
        SELECT bia.*, p.display_name AS broker_name, p.email AS broker_email
        FROM broker_inventory_assignments bia
        JOIN profiles p ON bia.broker_id = p.id
        WHERE bia.broker_slug = ? AND bia.development_id = ? AND bia.status = 'active'
      `, [brokerSlug, developmentId]);
    }

    if (!assignment && developerId) {
      assignment = await queryOne(`
        SELECT bia.*, p.display_name AS broker_name, p.email AS broker_email
        FROM broker_inventory_assignments bia
        JOIN profiles p ON bia.broker_id = p.id
        WHERE bia.broker_slug = ? AND bia.developer_id = ? AND bia.status = 'active'
      `, [brokerSlug, developerId]);
    }

    // Fallback: general broker slug check
    if (!assignment) {
      assignment = await queryOne(`
        SELECT bia.*, p.display_name AS broker_name, p.email AS broker_email
        FROM broker_inventory_assignments bia
        JOIN profiles p ON bia.broker_id = p.id
        WHERE bia.broker_slug = ? AND bia.status = 'active'
        LIMIT 1
      `, [brokerSlug]);
    }

    if (!assignment) {
      return NextResponse.json({ active: false });
    }

    return NextResponse.json({
      active: true,
      broker: {
        id: assignment.broker_id,
        name: assignment.broker_name || 'Certified Real Estate Broker',
        email: assignment.broker_email,
        phone: assignment.custom_phone || null,
        whatsapp: assignment.custom_whatsapp || assignment.custom_phone || null,
        slug: assignment.broker_slug,
        commissionRate: assignment.commission_rate,
        assignmentLevel: assignment.assignment_level
      }
    });
  } catch (error: any) {
    console.error('[API broker/context error]:', error);
    return NextResponse.json({ active: false, error: error.message }, { status: 500 });
  }
}
