// API Route: /api/visitor-recommendations
// Purpose: Submit new business recommendations and retrieve recommendations (admin)
// Supports Hybrid Mode: Captures visitor suggestions for businesses not in database

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// POST Handler: Submit Visitor Recommendation
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'business_name',
      'parent_type_id',
      'visitor_email',
      'visitor_name',
    ];

    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          missing_fields: missingFields,
        },
        { status: 400 }
      );
    }

    // Validate parent type
    const validParentTypes = [
      'accommodation',
      'food_and_beverage',
      'adventure_safari',
      'health_wellness',
      'crafts_trade',
      'logistics_transport',
    ];

    if (!validParentTypes.includes(body.parent_type_id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parent_type_id',
          valid_types: validParentTypes,
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.visitor_email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid visitor email format',
        },
        { status: 400 }
      );
    }

    // Generate recommendation ID
    const recommendationId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create recommendation object
    const recommendation = {
      id: recommendationId,
      business_name: body.business_name.trim(),
      business_type_id: body.business_type_id || null,
      parent_type_id: body.parent_type_id,
      description: body.description || null,
      location: body.location || null,
      website: body.website || null,
      contact_email: body.contact_email || null,
      contact_phone: body.contact_phone || null,
      visitor_id: body.visitor_id || null,
      visitor_name: body.visitor_name.trim(),
      visitor_email: body.visitor_email.toLowerCase().trim(),
      visitor_phone: body.visitor_phone || null,
      visitor_country: body.visitor_country || null,
      visitor_language: body.visitor_language || 'en',
      journey_id: body.journey_id || null,
      journey_package_id: body.journey_package_id || null,
      journey_context: body.journey_context || null,
      why_recommended: body.why_recommended || null,
      urgency_level: body.urgency_level || 'medium',
      status: 'pending',
      votes: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // In production, save to database:
    // await db.query(
    //   `INSERT INTO visitor_recommendations (
    //     id, business_name, business_type_id, parent_type_id, description,
    //     location, website, contact_email, contact_phone,
    //     visitor_id, visitor_name, visitor_email, visitor_phone,
    //     visitor_country, visitor_language, journey_id, journey_package_id,
    //     journey_context, why_recommended, urgency_level, status, votes,
    //     created_at, updated_at
    //   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    //   [
    //     recommendation.id, recommendation.business_name, recommendation.business_type_id,
    //     recommendation.parent_type_id, recommendation.description,
    //     recommendation.location, recommendation.website, recommendation.contact_email,
    //     recommendation.contact_phone, recommendation.visitor_id, recommendation.visitor_name,
    //     recommendation.visitor_email, recommendation.visitor_phone,
    //     recommendation.visitor_country, recommendation.visitor_language,
    //     recommendation.journey_id, recommendation.journey_package_id,
    //     recommendation.journey_context, recommendation.why_recommended,
    //     recommendation.urgency_level, recommendation.status, recommendation.votes,
    //     recommendation.created_at, recommendation.updated_at
    //   ]
    // );

    // Return success response
    return NextResponse.json(
      {
        success: true,
        recommendation_id: recommendationId,
        business_name: recommendation.business_name,
        message:
          'Thank you for your recommendation! Our team will review it and consider adding this business to our platform.',
        next_steps: {
          email_confirmation: `Confirmation sent to ${body.visitor_email}`,
          admin_review: 'Our admin team reviews recommendations daily',
          follow_up: 'We will contact you if we have questions about your suggestion',
        },
        contact: {
          email: 'recommendations@siwatoday.com',
          phone: '+20 1234567890',
          website: 'https://siwatoday.com',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing recommendation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process recommendation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET Handler: Retrieve Recommendations (Admin)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Admin token required',
        },
        { status: 401 }
      );
    }

    // In production, verify token with database
    // const token = authHeader.substring(7);
    // const admin = await db.query('SELECT * FROM admins WHERE token = ?', [token]);
    // if (!admin) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const parentType = url.searchParams.get('parent_type');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';

    // In production, query database:
    // let query = 'SELECT * FROM visitor_recommendations WHERE status = ?';
    // let params: any[] = [status];
    //
    // if (parentType) {
    //   query += ' AND parent_type_id = ?';
    //   params.push(parentType);
    // }
    //
    // query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    // params.push(limit, offset);
    //
    // const recommendations = await db.query(query, params);
    // const total = await db.query('SELECT COUNT(*) as count FROM visitor_recommendations WHERE status = ?', [status]);

    // Sample data response structure
    const sampleRecommendations = [
      {
        id: 'rec_1',
        business_name: "Ali's Authentic Siwan Bistro",
        business_type_id: 'modern_siwan_restaurant',
        parent_type_id: 'food_and_beverage',
        description: 'Traditional Siwan cuisine with modern presentation',
        location: 'Siwa main square',
        visitor_name: 'John Smith',
        visitor_email: 'john@example.com',
        visitor_country: 'United States',
        journey_context: '3-Day Culinary Escape',
        why_recommended: 'Best local food, authentic flavors, great service',
        urgency_level: 'high',
        votes: 3,
        status: 'pending',
        created_at: '2026-06-07T14:32:00Z',
      },
      {
        id: 'rec_2',
        business_name: 'Desert Rose Eco-Camp',
        business_type_id: 'eco_lodge',
        parent_type_id: 'accommodation',
        description: 'Sustainable eco-lodge with solar power',
        location: 'Outside Siwa',
        visitor_name: 'Sarah Johnson',
        visitor_email: 'sarah@example.com',
        visitor_country: 'United Kingdom',
        journey_context: 'Sustainable Tourism',
        why_recommended: 'Amazing environmental practices, beautiful location',
        urgency_level: 'medium',
        votes: 2,
        status: 'pending',
        created_at: '2026-06-08T10:15:00Z',
      },
      {
        id: 'rec_3',
        business_name: 'Siwa Traditional Crafts Workshop',
        business_type_id: 'craft_workshop',
        parent_type_id: 'crafts_trade',
        description: 'Interactive weaving and pottery workshop',
        location: 'Old town Siwa',
        visitor_name: 'Maria Garcia',
        visitor_email: 'maria@example.com',
        visitor_country: 'Spain',
        journey_context: 'Cultural Immersion',
        why_recommended: 'Incredible hands-on experience, local artisans',
        urgency_level: 'high',
        votes: 5,
        status: 'under_review',
        created_at: '2026-06-05T16:45:00Z',
      },
    ];

    // Filter by status
    let filtered = sampleRecommendations.filter((r) => r.status === status);

    // Filter by parent type if provided
    if (parentType) {
      filtered = filtered.filter((r) => r.parent_type_id === parentType);
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    // Apply limit and offset
    const paginated = filtered.slice(offset, offset + limit);

    // Calculate stats
    const stats = {
      total: sampleRecommendations.length,
      pending: sampleRecommendations.filter((r) => r.status === 'pending').length,
      under_review: sampleRecommendations.filter((r) => r.status === 'under_review').length,
      approved: sampleRecommendations.filter((r) => r.status === 'approved').length,
      converted: sampleRecommendations.filter((r) => r.status === 'converted').length,
      ignored: sampleRecommendations.filter((r) => r.status === 'ignored').length,
    };

    // Get breakdown by parent type
    const byParentType: Record<string, number> = {};
    sampleRecommendations.forEach((r) => {
      byParentType[r.parent_type_id] = (byParentType[r.parent_type_id] || 0) + 1;
    });

    return NextResponse.json(
      {
        success: true,
        recommendations: paginated,
        pagination: {
          limit,
          offset,
          total: filtered.length,
          page: Math.floor(offset / limit) + 1,
          pages: Math.ceil(filtered.length / limit),
        },
        stats,
        breakdown: {
          by_parent_type: byParentType,
          by_status: stats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving recommendations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH Handler: Update Recommendation Status (Admin)
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Admin token required',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recommendation_id, status, admin_notes } = body;

    if (!recommendation_id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: recommendation_id, status',
        },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'under_review', 'approved', 'converted', 'ignored'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status',
          valid_statuses: validStatuses,
        },
        { status: 400 }
      );
    }

    // In production, update database:
    // await db.query(
    //   `UPDATE visitor_recommendations 
    //    SET status = ?, admin_notes = ?, reviewed_at = NOW()
    //    WHERE id = ?`,
    //   [status, admin_notes || null, recommendation_id]
    // );

    return NextResponse.json(
      {
        success: true,
        recommendation_id,
        new_status: status,
        message: `Recommendation status updated to: ${status}`,
        updated_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating recommendation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update recommendation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
