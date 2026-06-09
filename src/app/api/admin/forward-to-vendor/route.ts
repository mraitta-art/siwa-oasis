import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/forward-to-vendor
 * Forward a visitor recommendation to a selected vendor
 *
 * Purpose: Send vendor notification when:
 * - Admin approves recommendation and decides to contact vendor
 * - Recommendation reaches milestone (5, 10, 20, etc requests)
 * - Manual forward by admin
 *
 * Request body:
 * {
 *   recommendation_id: string,           // rec_123
 *   vendor_email: string,                // ali@bistro.com
 *   vendor_name?: string,                // Ali Hassan
 *   notification_type: string,           // initial_request | milestone | followup
 *   include_visitor_feedback: boolean,   // Show what visitors said
 *   include_sales_offer?: boolean        // Include pricing/upgrade offer
 * }
 *
 * Response: {success, notification_id, status, email_preview, next_followup}
 */

interface ForwardToVendorRequest {
  recommendation_id: string;
  vendor_email: string;
  vendor_name?: string;
  notification_type: "initial_request" | "milestone" | "followup";
  include_visitor_feedback?: boolean;
  include_sales_offer?: boolean;
  
  // NEW: Contact data sharing control
  contact_data_sharing_level?: "none" | "names_only" | "emails_only" | "full_contact" | "anonymous";
  include_all_visitors?: boolean;
  specific_visitor_emails?: string[];
  admin_note?: string;
}

interface Recommendation {
  id: string;
  business_name: string;
  parent_type_id: string;
  description?: string;
  visitor_name: string;
  visitor_email: string;
  visitor_country?: string;
  why_recommended?: string;
  votes: number;
  created_at: string;
}

// Helper function to build email based on contact sharing level
function buildEmailBody(
  sharingLevel: string,
  recommendation: Recommendation,
  vendorName: string | undefined
): string {
  const visitorFeedback = [
    recommendation.why_recommended || "Amazing cuisine",
    "Great service and prices",
    "Highly recommended!",
    "Worth a visit!",
  ];

  if (sharingLevel === "none") {
    return `Dear ${vendorName || "Business Owner"},

Great news! ${recommendation.votes} visitors recommended your business on Siwa Oasis.

They loved your service!

Join Siwa Oasis Premium ($500/month) to connect with these interested travelers.`;
  }

  if (sharingLevel === "anonymous") {
    return `Dear ${vendorName || "Business Owner"},

Exciting news! ${recommendation.votes} visitors recommended your business!

This shows real demand for what you offer.

[Claim Your Profile to See Who Recommended You]`;
  }

  if (sharingLevel === "names_only") {
    return `Dear ${vendorName || "Business Owner"},

Great news! These ${recommendation.votes} people recommended your business:

1. John (USA)
2. Sarah (UK)  
3. Maria (Spain)
4. Ahmed (Egypt)
5. Lisa (Germany)

They said:
✓ "${visitorFeedback[0]}"
✓ "Great service"
✓ "Excellent value"

Premium listing ($500/month) connects you directly with visitors like these!`;
  }

  if (sharingLevel === "emails_only") {
    return `Dear ${vendorName || "Business Owner"},

Great news! These ${recommendation.votes} visitors recommended you:

1. John Smith - john@example.com
2. Sarah Johnson - sarah@example.com
3. Maria Garcia - maria@example.com

You can contact them directly about bookings and feedback.

Upgrade to Featured ($500/month) for more visibility!`;
  }

  if (sharingLevel === "full_contact") {
    return `Dear ${vendorName || "Business Owner"},

Great news! These ${recommendation.votes} visitors want to connect with you:

1. John Smith
   Email: john@example.com
   Phone: +1 234 567 890
   Country: USA
   Message: "${visitorFeedback[0]}"

2. Sarah Johnson
   Email: sarah@example.com
   Phone: +44 1234 567 890
   Country: UK
   Message: "Great service"

3. Maria Garcia
   Email: maria@example.com
   Phone: +34 912 345 678
   Country: Spain
   Message: "Excellent value"

You can reach out directly about reservations and feedback.

Premium listing ($500/month) for enhanced visibility!`;
  }

  return "";
}

// Simulated recommendation database
const recommendationsDb: Record<string, Recommendation> = {
  rec_001: {
    id: "rec_001",
    business_name: "Ali's Restaurant",
    parent_type_id: "food_beverage",
    description: "Local Egyptian cuisine with international options",
    visitor_name: "John Smith",
    visitor_email: "john@example.com",
    visitor_country: "USA",
    why_recommended: "Best local food in Siwa!",
    votes: 10,
    created_at: "2026-06-08T10:30:00Z",
  },
};

// Simulated notifications sent log
const sentNotifications: Record<
  string,
  {
    id: string;
    recommendation_id: string;
    vendor_email: string;
    status: string;
    sent_at: string;
  }
> = {};

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: ForwardToVendorRequest = await request.json();

    // Validate required fields
    if (
      !body.recommendation_id ||
      !body.vendor_email ||
      !body.notification_type
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: recommendation_id, vendor_email, notification_type",
        },
        { status: 400 }
      );
    }

    // Default contact sharing level
    const sharingLevel = body.contact_data_sharing_level || "names_only";

    // Get recommendation details (in production, query database)
    const recommendation = recommendationsDb[body.recommendation_id];
    if (!recommendation) {
      return NextResponse.json(
        {
          success: false,
          error: `Recommendation ${body.recommendation_id} not found`,
        },
        { status: 404 }
      );
    }

    // Generate notification ID
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build email content based on type
    let emailSubject = "";
    let emailBody = "";
    let emailPreview = "";

    if (body.notification_type === "initial_request") {
      emailSubject = `🌟 ${recommendation.votes} Visitors Are Asking For You! (${recommendation.business_name})`;
      emailPreview = `${recommendation.votes} Visitors Are Asking For You`;

      // Build email body based on contact sharing level
      emailBody = buildEmailBody(sharingLevel, recommendation, body.vendor_name);
    } else if (body.notification_type === "milestone") {
      const nextMilestone = Math.ceil(recommendation.votes / 5) * 5;
      emailSubject = `🎉 Congratulations! ${recommendation.business_name} Reached ${nextMilestone} Visitor Requests!`;
      emailPreview = `You Reached ${nextMilestone} Visitor Requests`;

      emailBody = `
Dear ${body.vendor_name || "Business Owner"},

Your business just hit a major milestone! 🔥

Your business now has ${recommendation.votes} visitor requests from travelers 
wanting to experience what you offer.

This shows real, growing demand.

Your visitor request growth:
├─ Week 1: 5 requests
├─ Week 2: 10 requests
├─ Week 3: ${recommendation.votes} requests
└─ Trend: ⬆️ GROWING!

WHAT'S NEXT?
────────────
Get your profile live to start capturing bookings before you miss them!

[Claim Your Profile - Takes 2 minutes]

Already claimed? Upgrade to Featured and watch bookings multiply.

[Upgrade to Featured: $500/month]

See what visitors are saying:
[View All ${recommendation.votes} Visitor Requests]

This kind of interest doesn't last forever. Act now!

Best regards,
Siwa Oasis Team
`;
    } else if (body.notification_type === "followup") {
      emailSubject = `${recommendation.business_name} - Your Visitor Requests Are Real Business Opportunity`;
      emailPreview = `Your Visitor Requests Are a Real Opportunity`;

      emailBody = `
Dear ${body.vendor_name || "Business Owner"},

Following up on our earlier message...

You have ${recommendation.votes} visitors ACTIVELY LOOKING for your business.

This isn't marketing hype—this is real, local demand.

WHAT YOU'RE MISSING:
════════════════════
❌ No online visibility → Tourists can't find you
❌ No direct booking → Lost reservations daily
❌ No profile → Competitors get the bookings

WHAT YOU GAIN:
═══════════════
✅ Featured on Siwa Oasis (seen by 50,000+ travelers/year)
✅ Direct booking system
✅ Real customer reviews
✅ New bookings from tourism platform
✅ Professional online presence in 15 minutes

QUICK NUMBERS:
═══════════════
Premium Listing: $500/month
10-15 extra bookings = $500-750 revenue
ROI: 100-150% per month!

READY TO START?
────────────────
Schedule 15-minute call with us:
[Schedule Free Consultation]

Or reply to this email with your availability.

Looking forward to partnering!

Ahmed Hassan
Business Development
Siwa Oasis
sales@siwatoday.com
+20 1234 567 890
`;
    }

    // Simulate sending email (in production, integrate with SendGrid/Mailgun)
    console.log(
      `📧 Would send email to ${body.vendor_email} with subject: "${emailSubject}"`
    );

    // Store notification record
    sentNotifications[notificationId] = {
      id: notificationId,
      recommendation_id: body.recommendation_id,
      vendor_email: body.vendor_email,
      status: "queued", // In production: would be "sent" after email service confirms
      sent_at: new Date().toISOString(),
    };

    // Calculate next follow-up date (7 days if no response)
    const nextFollowup = new Date();
    nextFollowup.setDate(nextFollowup.getDate() + 7);

    return NextResponse.json(
      {
        success: true,
        notification_id: notificationId,
        recommendation_id: body.recommendation_id,
        vendor_email: body.vendor_email,
        vendor_name: body.vendor_name,
        notification_type: body.notification_type,
        status: "queued",
        email_subject: emailSubject,
        email_preview: emailPreview,
        visitor_count: recommendation.votes,
        business_name: recommendation.business_name,
        contact_data_sharing_level: sharingLevel,
        visitor_contact_shared: sharingLevel !== "none" && sharingLevel !== "anonymous",
        followup_scheduled: nextFollowup.toISOString().split("T")[0],
        privacy_note: `Contact data sharing level: ${sharingLevel}. Visitor privacy ${sharingLevel === "none" ? "fully protected" : "partially shared"}.`,
        message:
          "Notification queued for delivery. Vendor will receive email within 5 minutes.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error forwarding to vendor:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to forward recommendation to vendor",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/forward-to-vendor?recommendation_id=rec_123
 * Get forwarding status and history
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const recommendationId = searchParams.get("recommendation_id");

    if (!recommendationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing recommendation_id parameter",
        },
        { status: 400 }
      );
    }

    // Get forwarding history for this recommendation
    const notifications = Object.values(sentNotifications).filter(
      (n) => n.recommendation_id === recommendationId
    );

    const recommendation = recommendationsDb[recommendationId];
    if (!recommendation) {
      return NextResponse.json(
        {
          success: false,
          error: `Recommendation ${recommendationId} not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        recommendation_id: recommendationId,
        business_name: recommendation.business_name,
        total_visitors: recommendation.votes,
        forwarding_history: notifications.map((n) => ({
          notification_id: n.id,
          vendor_email: n.vendor_email,
          status: n.status,
          sent_at: n.sent_at,
        })),
        metadata: {
          total_forwarded: notifications.length,
          last_forwarded: notifications.length > 0 ? notifications[0].sent_at : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting forwarding status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get forwarding status",
      },
      { status: 500 }
    );
  }
}
