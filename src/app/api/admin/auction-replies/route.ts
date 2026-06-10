export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";

/**
 * Admin Auction Reply Management
 * GET /api/admin/auction-replies - View all vendor replies
 * POST /api/admin/auction-replies/{id}/permit-contact - Permit vendor to contact visitor
 * POST /api/admin/auction-replies/{id}/respond - Admin responds to vendor
 */

interface PermitContactRequest {
  reply_id: string;
  permit: boolean; // true = allow vendor contact, false = deny
  reason?: string;
}

interface AdminResponseRequest {
  message: string;
}

// Simulated auction replies database
const auctionRepliesDb: Record<
  string,
  {
    id: string;
    auction_id: string;
    auction_title: string;
    vendor_id: string;
    vendor_name: string;
    vendor_email: string;
    reply_message: string;
    bid_amount: number;
    status: string;
    created_at: string;
    contact_permitted: boolean;
  }
> = {
  reply_001: {
    id: "reply_001",
    auction_id: "auc_001",
    auction_title: "Authentic Egyptian Cooking Class",
    vendor_id: "vendor_001",
    vendor_name: "Chef D - Culinary Masters",
    vendor_email: "chef@culinary.com",
    reply_message:
      "I can start immediately with multiple weekly sessions. Professional kitchen, experienced instructors. High quality guaranteed.",
    bid_amount: 350,
    status: "received",
    created_at: "2026-06-09T14:30:00Z",
    contact_permitted: false,
  },
};

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
    const status = searchParams.get("status") || "received";

    let replies = Object.values(auctionRepliesDb).filter(
      (r) => r.status === status
    );

    return NextResponse.json(
      {
        success: true,
        replies: replies.map((r) => ({
          id: r.id,
          auction_id: r.auction_id,
          auction_title: r.auction_title,
          vendor_name: r.vendor_name,
          vendor_email: r.vendor_email,
          message: r.reply_message,
          bid_amount: r.bid_amount,
          status: r.status,
          contact_permitted: r.contact_permitted,
          created_at: r.created_at,
        })),
        total: replies.length,
        pending: replies.filter((r) => r.status === "received").length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching auction replies:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch replies" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/auction-replies/{id}/permit-contact
 * Admin permits or denies vendor contact with visitor
 */
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

    const pathname = request.nextUrl.pathname;
    const replyId = pathname.split("/")[4];
    const action = pathname.split("/")[5]; // "permit-contact" or "respond"

    const reply = auctionRepliesDb[replyId];
    if (!reply) {
      return NextResponse.json(
        { success: false, error: "Reply not found" },
        { status: 404 }
      );
    }

    // Permit or deny contact
    if (action === "permit-contact") {
      const body: PermitContactRequest = await request.json();

      if (body.permit === undefined) {
        return NextResponse.json(
          { success: false, error: "permit field required (true/false)" },
          { status: 400 }
        );
      }

      if (body.permit) {
        // PERMIT: Share visitor contact with vendor
        reply.status = "contact_permitted";
        reply.contact_permitted = true;

        console.log(
          `✅ PERMITTED: Vendor ${reply.vendor_name} can now contact visitor`
        );

        return NextResponse.json(
          {
            success: true,
            action: "contact_permitted",
            reply_id: replyId,
            vendor_name: reply.vendor_name,
            vendor_email: reply.vendor_email,
            message:
              "Vendor contact has been PERMITTED. Vendor will receive visitor contact information.",
            notification_sent_to_vendor: `Visitor contact will be sent to ${reply.vendor_email}`,
          },
          { status: 200 }
        );
      } else {
        // DENY: Do not share contact
        reply.status = "contact_denied";
        reply.contact_permitted = false;

        console.log(
          `❌ DENIED: Vendor ${reply.vendor_name} cannot contact visitor`
        );

        return NextResponse.json(
          {
            success: true,
            action: "contact_denied",
            reply_id: replyId,
            vendor_name: reply.vendor_name,
            vendor_email: reply.vendor_email,
            reason: body.reason || "No reason provided",
            message:
              "Vendor contact has been DENIED. Vendor will be notified.",
            notification_sent_to_vendor: `Denial notification will be sent to ${reply.vendor_email}`,
          },
          { status: 200 }
        );
      }
    }

    // Admin responds to vendor
    if (action === "respond") {
      const body: AdminResponseRequest = await request.json();

      if (!body.message) {
        return NextResponse.json(
          { success: false, error: "Message required" },
          { status: 400 }
        );
      }

      reply.status = "responded";

      console.log(
        `📧 Admin responded to vendor ${reply.vendor_name}: "${body.message}"`
      );

      return NextResponse.json(
        {
          success: true,
          action: "responded",
          reply_id: replyId,
          message: "Response sent to vendor",
          email_sent_to: reply.vendor_email,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing auction reply:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process reply" },
      { status: 500 }
    );
  }
}
