// API Route: /api/admin/recommendations
// Purpose: Admin permission system - approve/reject/assign recommendations
// Features: Permission control, visibility management, vendor outreach

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// GET Handler: Retrieve Recommendations (Admin Only)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin token required' },
        { status: 401 }
      );
    }

    // In production, verify admin permissions
    // const token = authHeader.substring(7);
    // const admin = await db.query('SELECT * FROM admin_permission_settings WHERE token = ?', [token]);
    // if (!admin) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Sample data
    const sampleRecommendations = [
      {
        id: 'rec_001',
        business_name: "Ali's Restaurant",
        parent_type_id: 'food_and_beverage',
        visitor_name: 'John Smith',
        visitor_email: 'john@example.com',
        votes: 5,
        urgency_level: 'high',
        status: 'pending',
        permit_decision: 'pending',
        admin_permission_required: true,
        visible_to_public: false,
        visible_to_admin: true,
        contact_email: 'ali@bistro.com',
        contact_phone: '+20123456789',
        created_at: '2026-06-08T10:00:00Z',
        days_pending: 1,
        sales_status: 'not_contacted',
      },
      {
        id: 'rec_002',
        business_name: 'Desert Rose Eco-Camp',
        parent_type_id: 'accommodation',
        visitor_name: 'Sarah Johnson',
        visitor_email: 'sarah@example.com',
        votes: 3,
        urgency_level: 'medium',
        status: 'under_review',
        permit_decision: 'pending',
        admin_permission_required: true,
        visible_to_public: false,
        visible_to_admin: true,
        contact_email: 'info@ecocamp.com',
        contact_phone: '+20987654321',
        created_at: '2026-06-07T14:00:00Z',
        days_pending: 2,
        sales_status: 'outreach_sent',
      },
    ];

    let filtered = sampleRecommendations.filter((r) => r.status === status);
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json(
      {
        success: true,
        recommendations: paginated,
        pagination: {
          limit,
          offset,
          total: filtered.length,
          page: Math.floor(offset / limit) + 1,
        },
        stats: {
          pending: sampleRecommendations.filter((r) => r.status === 'pending').length,
          under_review: sampleRecommendations.filter((r) => r.status === 'under_review').length,
          approved: sampleRecommendations.filter((r) => r.status === 'approved').length,
          potential_revenue: 5000,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve recommendations' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST Handler: Make Permission Decision (Admin)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin token required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recommendation_id, decision, notes, assign_to_sales, visible_to_public } = body;

    if (!recommendation_id || !decision) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: recommendation_id, decision' },
        { status: 400 }
      );
    }

    const validDecisions = ['approve_free', 'approve_vendor_outreach', 'reject'];
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'Invalid decision', valid_options: validDecisions },
        { status: 400 }
      );
    }

    let newStatus = 'pending';
    let permitDecision = 'pending';
    let publicVisibility = false;

    if (decision === 'approve_free') {
      newStatus = 'approved_free';
      permitDecision = 'approved';
      publicVisibility = true;
    } else if (decision === 'approve_vendor_outreach') {
      newStatus = 'vendor_outreach';
      permitDecision = 'approved';
      publicVisibility = false;
    } else if (decision === 'reject') {
      newStatus = 'rejected';
      permitDecision = 'rejected';
      publicVisibility = false;
    }

    // In production, update database:
    // await db.query(
    //   `UPDATE visitor_recommendations 
    //    SET status = ?, permit_decision = ?, visible_to_public = ?, 
    //        admin_permission_notes = ?, admin_permission_date = NOW(),
    //        sales_lead_assigned_to = ?
    //    WHERE id = ?`,
    //   [newStatus, permitDecision, publicVisibility, notes || null, assign_to_sales || null, recommendation_id]
    // );

    // Create audit trail
    // await db.query(
    //   `INSERT INTO admin_permissions_audit (recommendation_id, admin_id, action, permission_granted, notes)
    //    VALUES (?, ?, ?, ?, ?)`,
    //   [recommendation_id, admin_id, decision, permitDecision === 'approved', notes || null]
    // );

    return NextResponse.json(
      {
        success: true,
        recommendation_id,
        decision,
        new_status: newStatus,
        permission_granted: permitDecision === 'approved',
        visible_to_public: publicVisibility,
        assigned_to_sales: assign_to_sales || null,
        audit_logged: true,
        next_step:
          decision === 'approve_vendor_outreach'
            ? 'Send vendor outreach email'
            : 'Add to website',
        message: `Recommendation ${decision.replace('_', ' ').toLowerCase()} successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing permission decision:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process decision' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH Handler: Send Vendor Outreach (Sales Team)
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    // Check sales team authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Sales token required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      recommendation_id,
      vendor_name,
      vendor_email,
      vendor_phone,
      offering_type,
      monthly_price,
      term_months,
      email_template,
    } = body;

    if (!recommendation_id || !vendor_email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: recommendation_id, vendor_email' },
        { status: 400 }
      );
    }

    // In production:
    // 1. Create vendor_sales_pipeline entry
    // 2. Send email to vendor
    // 3. Update recommendation status
    // 4. Log outreach in audit trail

    const outreachId = `outreach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json(
      {
        success: true,
        outreach_id: outreachId,
        recommendation_id,
        vendor_email,
        vendor_name,
        status: 'outreach_sent',
        offering_type,
        monthly_price,
        term_months,
        email_sent: true,
        follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        message: `Outreach email sent to ${vendor_email}. Follow-up scheduled in 7 days.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending vendor outreach:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send vendor outreach' },
      { status: 500 }
    );
  }
}
