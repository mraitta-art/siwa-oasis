// Database integration helpers for Journey Request Policy Engine
// Replace mock data queries with these functions in production

import mysql from 'mysql2/promise';

// This would be your database connection pool
// Configure in .env.local with DATABASE_URL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'siwa_oasis',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// JOURNEY POLICIES
export async function getAllPolicies() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM admin_journey_policies WHERE is_active = TRUE ORDER BY priority DESC'
    );
    return rows;
  } finally {
    connection.release();
  }
}

export async function getPolicyById(policyId: string) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM admin_journey_policies WHERE id = ?',
      [policyId]
    ) as any;
    return rows?.[0] || null;
  } finally {
    connection.release();
  }
}

export async function getDefaultPolicy() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM admin_journey_policies WHERE is_default = TRUE LIMIT 1'
    ) as any;
    return rows?.[0] || null;
  } finally {
    connection.release();
  }
}

export async function createPolicy(policyData: any) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(
      `INSERT INTO admin_journey_policies 
       (policy_name, description, request_type, approval_required, auto_approve_enabled, 
        auto_approve_rule, approval_workflow, vendor_notification_enabled, auto_assign_to_vendor,
        assignment_rule, max_items_allowed, max_days_allowed, featured_boost_price,
        vendor_commission_percent, created_by_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        policyData.policy_name,
        policyData.description,
        policyData.request_type,
        policyData.approval_required,
        policyData.auto_approve_enabled,
        policyData.auto_approve_rule,
        policyData.approval_workflow,
        policyData.vendor_notification_enabled,
        policyData.auto_assign_to_vendor,
        policyData.assignment_rule,
        policyData.max_items_allowed,
        policyData.max_days_allowed,
        policyData.featured_boost_price,
        policyData.vendor_commission_percent,
        policyData.created_by_admin
      ]
    );
    return (result as any).insertId;
  } finally {
    connection.release();
  }
}

// JOURNEY REQUESTS
export async function submitJourneyRequest(requestData: any) {
  const connection = await pool.getConnection();
  try {
    // Match to policy
    const matchedPolicyId = await matchRequestToPolicy(requestData);
    
    const [result] = await connection.query(
      `INSERT INTO journey_requests
       (visitor_id, visitor_email, visitor_name, visitor_phone, visitor_group_size,
        title, description, vibe, pace, budget_usd_min, budget_usd_max,
        duration_days, preferred_start_date, requested_items, special_requirements,
        accessibility_needs, dietary_restrictions, matched_policy_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestData.visitor_id,
        requestData.visitor_email,
        requestData.visitor_name,
        requestData.visitor_phone,
        requestData.visitor_group_size,
        requestData.title,
        requestData.description,
        requestData.vibe,
        requestData.pace,
        requestData.budget_usd_min,
        requestData.budget_usd_max,
        requestData.duration_days,
        requestData.preferred_start_date,
        JSON.stringify(requestData.requested_items),
        requestData.special_requirements,
        requestData.accessibility_needs,
        requestData.dietary_restrictions,
        matchedPolicyId,
        'submitted'
      ]
    );
    
    const requestId = (result as any).insertId;
    
    // Notify matching vendors
    await notifyMatchingVendors(requestId, matchedPolicyId);
    
    return requestId;
  } finally {
    connection.release();
  }
}

export async function matchRequestToPolicy(requestData: any) {
  const connection = await pool.getConnection();
  try {
    const itemCount = (requestData.requested_items || []).length;
    const duration = requestData.duration_days || 3;
    const budget = requestData.budget_usd_max || 0;

    // Simple matching logic - in production, make this more sophisticated
    let policyId = 'policy_001'; // Default

    if (itemCount <= 5 && duration <= 7 && budget <= 500) {
      policyId = 'policy_001'; // Quick Custom
    } else if (duration > 7 || budget > 500) {
      policyId = 'policy_002'; // Premium Custom
    }

    return policyId;
  } finally {
    connection.release();
  }
}

export async function getJourneyRequest(requestId: string) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM journey_requests WHERE id = ?',
      [requestId]
    ) as any;
    return rows?.[0] || null;
  } finally {
    connection.release();
  }
}

export async function listJourneyRequests(filters: any = {}) {
  const connection = await pool.getConnection();
  try {
    let query = 'SELECT * FROM journey_requests WHERE 1=1';
    const params: any[] = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.policy_id) {
      query += ' AND matched_policy_id = ?';
      params.push(filters.policy_id);
    }

    if (filters.vibe) {
      query += ' AND vibe = ?';
      params.push(filters.vibe);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const [rows] = await connection.query(query, params);
    return rows;
  } finally {
    connection.release();
  }
}

export async function approveRequest(requestId: string, adminId: string, notes?: string) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      `UPDATE journey_requests 
       SET status = 'approved', approval_decision = 'admin_approved', 
           approved_by_admin = ?, approval_notes = ?, approved_at = NOW()
       WHERE id = ?`,
      [adminId, notes, requestId]
    );

    // Log approval
    await connection.query(
      `INSERT INTO journey_request_approvals
       (journey_request_id, approval_stage, approver_type, approver_id, 
        decision, decision_reason, decision_made_at)
       VALUES (?, 'admin_approval', 'admin', ?, 'approved', ?, NOW())`,
      [requestId, adminId, notes]
    );

    // Notify vendors
    await notifyMatchingVendors(requestId, null);

    return true;
  } finally {
    connection.release();
  }
}

// VENDOR REQUEST QUEUE
export async function notifyMatchingVendors(requestId: string, policyId: string | null) {
  const connection = await pool.getConnection();
  try {
    const request = await getJourneyRequest(requestId);
    if (!request) return;

    // Find vendors that match the requested items
    const requestedItems = JSON.parse(request.requested_items || '[]');
    
    for (const item of requestedItems) {
      // Query businesses matching the requested type
      const [businesses] = await connection.query(
        `SELECT id, vendor_id FROM businesses 
         WHERE business_type_id = ? AND vendor_id IS NOT NULL
         LIMIT 5`,
        [item.child_type]
      );

      for (const business of businesses as any[]) {
        // Calculate match score
        const matchScore = calculateMatchScore(request, item);

        // Add to vendor queue
        await connection.query(
          `INSERT INTO vendor_request_queue
           (vendor_id, business_id, journey_request_id, match_score, reason_for_match,
            vendor_status, notification_sent, created_at)
           VALUES (?, ?, ?, ?, ?, 'new', true, NOW())`,
          [
            business.vendor_id,
            business.id,
            requestId,
            matchScore,
            `${item.business_type} match - ${item.preferences}`
          ]
        );
      }
    }
  } finally {
    connection.release();
  }
}

export async function getVendorQueue(vendorId: string, status?: string) {
  const connection = await pool.getConnection();
  try {
    let query = `SELECT vrq.*, jr.title, jr.duration_days, jr.budget_usd_max, jr.requested_items
                 FROM vendor_request_queue vrq
                 JOIN journey_requests jr ON vrq.journey_request_id = jr.id
                 WHERE vrq.vendor_id = ?`;
    const params: any[] = [vendorId];

    if (status) {
      query += ' AND vrq.vendor_status = ?';
      params.push(status);
    }

    query += ' ORDER BY vrq.match_score DESC, vrq.created_at DESC LIMIT 50';

    const [rows] = await connection.query(query, params);
    return rows;
  } finally {
    connection.release();
  }
}

export async function updateVendorQueueItem(queueId: string, updates: any) {
  const connection = await pool.getConnection();
  try {
    const setClauses: string[] = [];
    const params: any[] = [];

    if (updates.vendor_status) {
      setClauses.push('vendor_status = ?');
      params.push(updates.vendor_status);
    }

    if (updates.vendor_proposed_price !== undefined) {
      setClauses.push('vendor_proposed_price = ?');
      params.push(updates.vendor_proposed_price);
    }

    if (updates.vendor_response_notes) {
      setClauses.push('vendor_response_notes = ?');
      params.push(updates.vendor_response_notes);
    }

    setClauses.push('updated_at = NOW()');
    params.push(queueId);

    if (setClauses.length > 0) {
      await connection.query(
        `UPDATE vendor_request_queue SET ${setClauses.join(', ')} WHERE id = ?`,
        params
      );
    }

    return true;
  } finally {
    connection.release();
  }
}

// ANALYTICS
export async function getDailyAnalytics(policyId?: string, days: number = 7) {
  const connection = await pool.getConnection();
  try {
    let query = `SELECT 
                   DATE(created_at) as date,
                   COUNT(*) as total_requests,
                   SUM(CASE WHEN approval_decision = 'auto_approved' THEN 1 ELSE 0 END) as auto_approved,
                   SUM(CASE WHEN approval_decision = 'admin_approved' THEN 1 ELSE 0 END) as admin_approved,
                   SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                   SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) as bookings_completed
                 FROM journey_requests
                 WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`;
    const params: any[] = [days];

    if (policyId) {
      query += ' AND matched_policy_id = ?';
      params.push(policyId);
    }

    query += ' GROUP BY DATE(created_at) ORDER BY date DESC';

    const [rows] = await connection.query(query, params);
    return rows;
  } finally {
    connection.release();
  }
}

export async function getVendorPerformance() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        v.id as vendor_id,
        v.name as vendor_name,
        b.business_type_id as business_type,
        COUNT(DISTINCT vrq.id) as requests_received,
        SUM(CASE WHEN vrq.opened_by_vendor THEN 1 ELSE 0 END) as requests_responded,
        SUM(CASE WHEN vrq.vendor_status IN ('quoted', 'booked') THEN 1 ELSE 0 END) as quotes_sent,
        SUM(CASE WHEN vrq.vendor_status = 'booked' THEN 1 ELSE 0 END) as bookings_completed,
        AVG(TIMESTAMPDIFF(HOUR, vrq.created_at, vrq.vendor_response_date)) as avg_response_time_hours,
        ROUND(SUM(CASE WHEN vrq.vendor_status = 'booked' THEN 1 ELSE 0 END) / 
              NULLIF(SUM(CASE WHEN vrq.vendor_status IN ('quoted', 'booked') THEN 1 ELSE 0 END), 0) * 100) as quote_win_rate
      FROM vendors v
      JOIN businesses b ON v.id = b.vendor_id
      LEFT JOIN vendor_request_queue vrq ON v.id = vrq.vendor_id
      GROUP BY v.id
      ORDER BY bookings_completed DESC
    `);
    return rows;
  } finally {
    connection.release();
  }
}

// Helper function to calculate match score
function calculateMatchScore(request: any, item: any): number {
  let score = 50; // Base score

  // Vibe match
  if (request.vibe === item.vibe) score += 20;

  // Budget consideration
  if (item.estimated_price && item.estimated_price <= request.budget_usd_max) {
    score += 15;
  }

  // Location/preference match
  if (item.location && request.location === item.location) {
    score += 15;
  }

  return Math.min(score, 100);
}

export default {
  // Policies
  getAllPolicies,
  getPolicyById,
  getDefaultPolicy,
  createPolicy,

  // Requests
  submitJourneyRequest,
  getJourneyRequest,
  listJourneyRequests,
  approveRequest,

  // Vendor Queue
  getVendorQueue,
  updateVendorQueueItem,

  // Analytics
  getDailyAnalytics,
  getVendorPerformance,
};
