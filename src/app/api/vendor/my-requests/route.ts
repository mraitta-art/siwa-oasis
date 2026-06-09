import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/vendor/my-requests
 * Get all visitor requests for a vendor's business
 *
 * Purpose: Vendor portal to see:
 * - How many people requested them
 * - What visitors said
 * - Who the visitors are
 * - Visitor contact information
 * - Call to action to claim profile or upgrade
 *
 * Authorization: Bearer vendor_token (from claim link)
 *
 * Response:
 * {
 *   vendor_email: string,
 *   business_name: string,
 *   profile_claimed: boolean,
 *   total_requests: number,
 *   unique_visitors: number,
 *   requests: [{visitor_name, reason, country, date}],
 *   recommended_action: string
 * }
 */

interface VendorRequest {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_country: string;
  reason: string;
  date: string;
  urgency: "low" | "medium" | "high";
}

// Simulated vendor database
const vendorsDb: Record<
  string,
  {
    email: string;
    business_name: string;
    claimed: boolean;
    profile_complete: boolean;
    created_at: string;
  }
> = {
  vendor_001: {
    email: "ali@bistro.com",
    business_name: "Ali's Restaurant",
    claimed: false,
    profile_complete: false,
    created_at: "2026-06-08T10:30:00Z",
  },
};

// Simulated vendor requests
const vendorRequestsDb: Record<string, VendorRequest[]> = {
  vendor_001: [
    {
      id: "req_001",
      visitor_name: "John Smith",
      visitor_email: "john@example.com",
      visitor_country: "USA",
      reason: "Best local food in Siwa!",
      date: "2026-06-08T10:30:00Z",
      urgency: "high",
    },
    {
      id: "req_002",
      visitor_name: "Sarah Johnson",
      visitor_email: "sarah@example.com",
      visitor_country: "UK",
      reason: "Amazing authentic cuisine",
      date: "2026-06-09T14:15:00Z",
      urgency: "medium",
    },
    {
      id: "req_003",
      visitor_name: "Maria Garcia",
      visitor_email: "maria@example.com",
      visitor_country: "Spain",
      reason: "Great service and prices",
      date: "2026-06-09T16:45:00Z",
      urgency: "medium",
    },
    {
      id: "req_004",
      visitor_name: "Ahmed Hassan",
      visitor_email: "ahmed@example.com",
      visitor_country: "Egypt",
      reason: "Highly recommended!",
      date: "2026-06-10T09:20:00Z",
      urgency: "medium",
    },
    {
      id: "req_005",
      visitor_name: "Lisa Mueller",
      visitor_email: "lisa@example.com",
      visitor_country: "Germany",
      reason: "Worth a visit!",
      date: "2026-06-10T11:00:00Z",
      urgency: "low",
    },
    {
      id: "req_006",
      visitor_name: "James Wilson",
      visitor_email: "james@example.com",
      visitor_country: "USA",
      reason: "Best restaurant experience in Siwa",
      date: "2026-06-11T08:30:00Z",
      urgency: "high",
    },
    {
      id: "req_007",
      visitor_name: "Emma Brown",
      visitor_email: "emma@example.com",
      visitor_country: "UK",
      reason: "Excellent food quality",
      date: "2026-06-11T13:45:00Z",
      urgency: "medium",
    },
    {
      id: "req_008",
      visitor_name: "Carlos Rodriguez",
      visitor_email: "carlos@example.com",
      visitor_country: "Spain",
      reason: "Authentic local flavors",
      date: "2026-06-12T10:15:00Z",
      urgency: "medium",
    },
    {
      id: "req_009",
      visitor_name: "Sophie Martin",
      visitor_email: "sophie@example.com",
      visitor_country: "France",
      reason: "Perfect dinner spot",
      date: "2026-06-12T15:30:00Z",
      urgency: "low",
    },
    {
      id: "req_010",
      visitor_name: "Marco Rossi",
      visitor_email: "marco@example.com",
      visitor_country: "Italy",
      reason: "Wonderful local experience",
      date: "2026-06-13T09:00:00Z",
      urgency: "low",
    },
  ],
};

function parseVendorToken(token: string): string | null {
  // In production, verify JWT token and extract vendor_id
  // For demo: token format is vendor_001
  try {
    if (token.startsWith("vendor_")) {
      return token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const vendorId = parseVendorToken(token);

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "Invalid vendor token" },
        { status: 401 }
      );
    }

    // Get vendor details
    const vendor = vendorsDb[vendorId];
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Get vendor's requests
    const requests = vendorRequestsDb[vendorId] || [];

    // Calculate statistics
    const uniqueCountries = new Set(requests.map((r) => r.visitor_country));
    const highPriority = requests.filter((r) => r.urgency === "high");
    const recentRequests = requests.slice(0, 3);

    // Determine recommended action
    let recommendedAction = "";
    if (!vendor.claimed) {
      recommendedAction =
        "CLAIM YOUR PROFILE - Free 2-minute setup to enable bookings!";
    } else if (!vendor.profile_complete) {
      recommendedAction = "COMPLETE YOUR PROFILE - Add photos and details";
    } else {
      recommendedAction = "UPGRADE TO FEATURED - Get $500/month premium placement";
    }

    const response = {
      success: true,
      vendor: {
        id: vendorId,
        email: vendor.email,
        business_name: vendor.business_name,
        profile_claimed: vendor.claimed,
        profile_complete: vendor.profile_complete,
      },
      requests_summary: {
        total_requests: requests.length,
        unique_visitors: new Set(requests.map((r) => r.visitor_name)).size,
        countries_represented: Array.from(uniqueCountries),
        high_priority_count: highPriority.length,
        requests_this_week: requests.filter((r) => {
          const date = new Date(r.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return date >= weekAgo;
        }).length,
        most_recent: requests.length > 0 ? requests[0].date : null,
      },
      recent_requests: recentRequests.map((r) => ({
        id: r.id,
        visitor_name: r.visitor_name,
        visitor_country: r.visitor_country,
        message: r.reason,
        date: r.date,
        urgency: r.urgency,
      })),
      all_requests: requests.map((r) => ({
        id: r.id,
        visitor_name: r.visitor_name,
        visitor_email: r.visitor_email,
        visitor_country: r.visitor_country,
        message: r.reason,
        date: r.date,
        urgency: r.urgency,
      })),
      recommended_action: recommendedAction,
      next_steps: !vendor.claimed
        ? [
            "1. Claim your profile (takes 2 minutes)",
            "2. Add business photos",
            "3. Enable direct bookings",
            "4. Start receiving reservations",
          ]
        : [
            "1. Complete your profile (add more details & photos)",
            "2. Reply to high-priority requests",
            "3. Upgrade to Featured ($500/month)",
            "4. Get white-glove support",
          ],
      cta: {
        primary: vendor.claimed
          ? {
              action: "upgrade_featured",
              text: "Upgrade to Featured - $500/month",
              link: "https://siwatoday.com/vendor/upgrade-featured",
            }
          : {
              action: "claim_profile",
              text: "Claim Your Profile - Takes 2 Minutes",
              link: "https://siwatoday.com/vendor/claim",
            },
        secondary: {
          action: "view_all_requests",
          text: "View All Requests",
          link: "https://siwatoday.com/vendor/requests",
        },
      },
      metadata: {
        profile_created_at: vendor.created_at,
        last_request_at:
          requests.length > 0 ? requests[requests.length - 1].date : null,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching vendor requests:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vendor requests" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/my-requests/respond
 * Vendor responds to requests (interest in profile claim/upgrade)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const vendorId = parseVendorToken(token);

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "Invalid vendor token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { response_message, interest_level, contact_preference, phone } =
      body;

    // Validate
    if (
      !response_message ||
      !interest_level ||
      !contact_preference
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: response_message, interest_level, contact_preference",
        },
        { status: 400 }
      );
    }

    // Store vendor response (in production: save to database)
    const responseRecord = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vendor_id: vendorId,
      response_message,
      interest_level,
      contact_preference,
      phone: phone || null,
      responded_at: new Date().toISOString(),
    };

    console.log("📝 Vendor response received:", responseRecord);

    return NextResponse.json(
      {
        success: true,
        message:
          "Thank you! Our team will contact you within 24 hours to discuss your options.",
        response_id: responseRecord.id,
        next_steps: [
          "Our sales team will call you at " +
            (phone || "the number you provided"),
          "We'll discuss Featured and Premium options",
          "No obligations - just explore what's best for you",
        ],
        support: {
          email: "vendor-support@siwatoday.com",
          phone: "+20 1234 567 890",
          chat: "https://siwatoday.com/vendor-chat",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing vendor response:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process your response" },
      { status: 500 }
    );
  }
}
