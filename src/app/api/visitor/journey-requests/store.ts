const journeyRequests: any[] = [
  {
    id: 'req_001',
    visitor_name: 'Ahmed',
    visitor_email: 'visitor@example.com',
    visitor_phone: '+20 123 456 7890',
    title: 'Siwa Wellness Escape',
    description: 'Looking for spa, desert, and authentic food',
    duration_days: 3,
    budget_usd_min: 300,
    budget_usd_max: 450,
    group_size: 2,
    vibe: 'wellness',
    pace: 'slow',
    preferred_start_date: '',
    preferred_vendor_type: '',
    preferred_vendor_id: '',
    special_requirements: '',
    dietary_restrictions: '',
    selected_offer: null,
    manual_offer_details: null,
    requested_items: [],
    matched_policy_id: 'policy_001',
    status: 'approved',
    approval_decision: 'auto_approved',
    created_at: new Date().toISOString(),
    interested_vendors: 3
  },
  {
    id: 'req_002',
    visitor_name: 'Sarah',
    visitor_email: 'adventure@example.com',
    visitor_phone: '+20 987 654 3210',
    title: 'Adventure & Photography',
    description: 'Dunes, lakes, wildlife photography',
    duration_days: 5,
    budget_usd_min: 600,
    budget_usd_max: 800,
    group_size: 4,
    vibe: 'adventure',
    pace: 'active',
    preferred_start_date: '',
    preferred_vendor_type: '',
    preferred_vendor_id: '',
    special_requirements: '',
    dietary_restrictions: '',
    selected_offer: null,
    manual_offer_details: null,
    requested_items: [],
    matched_policy_id: 'policy_002',
    status: 'under_review',
    approval_decision: 'pending',
    created_at: new Date().toISOString(),
    interested_vendors: 1
  }
];

export function listJourneyRequests() {
  return journeyRequests;
}

export function createJourneyRequest(requestData: any) {
  const id = `req_${Math.random().toString(36).substring(2, 10)}`;
  const createdAt = new Date().toISOString();
  const request = {
    id,
    visitor_name: requestData.visitor_name || '',
    visitor_email: requestData.visitor_email || '',
    visitor_phone: requestData.visitor_phone || '',
    title: requestData.title || '',
    description: requestData.description || '',
    duration_days: requestData.duration_days || 3,
    budget_usd_min: requestData.budget_usd_min || 0,
    budget_usd_max: requestData.budget_usd_max || 0,
    group_size: requestData.group_size || 1,
    vibe: requestData.vibe || 'adventure',
    pace: requestData.pace || 'moderate',
    preferred_start_date: requestData.preferred_start_date || '',
    preferred_vendor_type: requestData.preferred_vendor_type || null,
    preferred_vendor_id: requestData.preferred_vendor_id || null,
    special_requirements: requestData.special_requirements || '',
    dietary_restrictions: requestData.dietary_restrictions || '',
    selected_offer: requestData.selected_offer || null,
    manual_offer_details: requestData.manual_offer_details || null,
    requested_items: requestData.requested_items || [],
    matched_policy_id: requestData.matched_policy_id || 'policy_001',
    status: requestData.status || 'under_review',
    approval_decision: requestData.approval_decision || 'pending',
    created_at: createdAt,
    interested_vendors: requestData.interested_vendors || 0
  };

  journeyRequests.unshift(request);
  return request;
}

export function findJourneyRequestById(id: string) {
  return journeyRequests.find((request) => request.id === id) || null;
}

export function updateJourneyRequest(id: string, updates: any) {
  const request = findJourneyRequestById(id);
  if (!request) return null;

  Object.assign(request, updates);
  request.updated_at = new Date().toISOString();
  return request;
}
