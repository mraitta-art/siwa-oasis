import { NextRequest, NextResponse } from "next/server";

/**
 * Admin Auction Management API
 * POST /api/admin/auctions/open - Open auction for visitor request
 * GET /api/admin/auctions - View all auctions
 * POST /api/admin/auctions/{id}/close - Close auction and declare winner
 */

interface OpenAuctionRequest {
  recommendation_id: string;
  title: string;
  description: string;
  category: string;
  starting_price: number;
  reserve_price?: number;
  min_bid_increment?: number;
  duration_days: number;
  admin_note?: string;
  // NEW: Contact visibility control
  show_visitor_contact?: boolean; // Default: false (hidden)
  contact_visibility_level?: 'none' | 'partial' | 'full' | 'email_only'; // Default: 'none'
  admin_contact_email?: string; // Where vendor replies go (default: vendor-replies@siwatoday.com)
}

interface AuctionResponse {
  success: boolean;
  auction_id?: string;
  error?: string;
}

// Simulated auctions database
const auctionsDb: Record<
  string,
  {
    id: string;
    recommendation_id: string;
    title: string;
    status: string;
    starting_price: number;
    current_price: number;
    total_bids: number;
    unique_bidders: number;
    auction_end_time: string;
    opened_at: string;
    // NEW: Contact visibility fields
    show_visitor_contact: boolean;
    contact_visibility_level: string;
    admin_contact_email: string;
  }
> = {};

// Simulated recommendations database
const recommendationsDb: Record<
  string,
  {
    id: string;
    business_name: string;
    votes: number;
    visitor_name: string;
    visitor_email: string;
  }
> = {
  rec_001: {
    id: "rec_001",
    business_name: "Authentic Egyptian Cooking Class",
    votes: 8,
    visitor_name: "John Smith",
    visitor_email: "john@example.com",
  },
};

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

    // Open auction
    if (pathname.includes("/open")) {
      const body: OpenAuctionRequest = await request.json();

      // Validate required fields
      if (
        !body.recommendation_id ||
        !body.title ||
        !body.starting_price ||
        !body.duration_days
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required fields",
          },
          { status: 400 }
        );
      }

      // Get recommendation
      const recommendation = recommendationsDb[body.recommendation_id];
      if (!recommendation) {
        return NextResponse.json(
          {
            success: false,
            error: "Recommendation not found",
          },
          { status: 404 }
        );
      }

      // Create auction
      const auctionId = `auc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + body.duration_days);

      // NEW: Contact visibility settings (defaults to hidden)
      const showVisitorContact = body.show_visitor_contact ?? false;
      const contactVisibilityLevel = body.contact_visibility_level ?? 'none';
      const adminContactEmail = body.admin_contact_email ?? 'vendor-replies@siwatoday.com';

      auctionsDb[auctionId] = {
        id: auctionId,
        recommendation_id: body.recommendation_id,
        title: body.title,
        status: "open",
        starting_price: body.starting_price,
        current_price: body.starting_price,
        total_bids: 0,
        unique_bidders: 0,
        auction_end_time: endTime.toISOString(),
        opened_at: new Date().toISOString(),
        // NEW: Contact visibility fields
        show_visitor_contact: showVisitorContact,
        contact_visibility_level: contactVisibilityLevel,
        admin_contact_email: adminContactEmail,
      };

      console.log(
        `📢 Auction opened: ${auctionId} - ${body.title}\n` +
        `   Contact: ${showVisitorContact ? '✓ VISIBLE' : '❌ HIDDEN (replies to ' + adminContactEmail + ')'}`
      );

      return NextResponse.json(
        {
          success: true,
          auction_id: auctionId,
          title: body.title,
          starting_price: body.starting_price,
          auction_end_time: endTime.toISOString(),
          status: "open",
          contact_visibility: {
            show_visitor_contact: showVisitorContact,
            contact_visibility_level: contactVisibilityLevel,
            vendor_replies_to: adminContactEmail,
          },
          message: showVisitorContact
            ? "Auction opened with VISIBLE contact. Vendors can reach out directly."
            : "Auction opened with HIDDEN contact. Vendor replies will come to admin for approval.",
        },
        { status: 201 }
      );
    }

    // Close auction
    if (pathname.includes("/close")) {
      const auctionId = pathname.split("/")[4];

      const auction = auctionsDb[auctionId];
      if (!auction) {
        return NextResponse.json(
          { success: false, error: "Auction not found" },
          { status: 404 }
        );
      }

      // Update auction status
      auction.status = "closed";

      console.log(
        `🏁 Auction closed: ${auctionId} - Final price: $${auction.current_price}`
      );

      return NextResponse.json(
        {
          success: true,
          auction_id: auctionId,
          status: "closed",
          final_price: auction.current_price,
          total_bids: auction.total_bids,
          unique_bidders: auction.unique_bidders,
          message: "Auction closed. Winner notification will be sent.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing auction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process auction" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/auctions - List all auctions
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
    const status = searchParams.get("status");

    let auctions = Object.values(auctionsDb);

    if (status) {
      auctions = auctions.filter((a) => a.status === status);
    }

    return NextResponse.json(
      {
        success: true,
        auctions: auctions.map((a) => ({
          ...a,
          time_remaining_hours: Math.round(
            (new Date(a.auction_end_time).getTime() - Date.now()) / (1000 * 60 * 60)
          ),
        })),
        total: auctions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching auctions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch auctions" },
      { status: 500 }
    );
  }
}
