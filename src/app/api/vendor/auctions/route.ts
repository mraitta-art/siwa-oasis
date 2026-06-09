import { NextRequest, NextResponse } from "next/server";

/**
 * Vendor Auction API
 * GET /api/vendor/auctions - Browse available auctions
 * GET /api/vendor/auctions/{id} - View auction details
 * POST /api/vendor/auctions/{id}/bid - Place a bid
 * POST /api/vendor/auctions/{id}/watch - Watch/unwatch auction
 */

interface BidRequest {
  bid_amount: number;
  contract_duration_months?: number;
  vendor_notes?: string;
}

// Simulated auctions database
const auctionsDb: Record<
  string,
  {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    starting_price: number;
    current_price: number;
    current_leading_vendor: string;
    total_bids: number;
    unique_bidders: number;
    auction_end_time: string;
    bid_history: Array<{
      vendor_name: string;
      bid_amount: number;
      time: string;
    }>;
  }
> = {
  auc_001: {
    id: "auc_001",
    title: "Authentic Egyptian Cooking Class",
    description:
      "Visitor from USA wants to learn authentic Egyptian cooking with 8 other interested travelers",
    category: "culinary_experience",
    status: "open",
    starting_price: 250,
    current_price: 200,
    current_leading_vendor: "Chef B",
    total_bids: 3,
    unique_bidders: 2,
    auction_end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    bid_history: [
      {
        vendor_name: "Chef A",
        bid_amount: 150,
        time: "5 hours ago",
      },
      {
        vendor_name: "Chef B",
        bid_amount: 175,
        time: "2 hours ago",
      },
      {
        vendor_name: "Chef B",
        bid_amount: 200,
        time: "30 minutes ago",
      },
    ],
  },
};

// Simulated vendor bids
const vendorBids: Record<string, Record<string, number>> = {
  vendor_001: {
    auc_001: 175,
  },
};

// Simulated watchers
const auctionWatchers: Record<string, Set<string>> = {
  auc_001: new Set(["vendor_001", "vendor_002"]),
};

export async function GET(request: NextRequest) {
  try {
    // Check vendor authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pathname = request.nextUrl.pathname;
    const auctionId = pathname.split("/")[5]; // Get auction ID if in path

    // Get specific auction
    if (auctionId && auctionId !== "watch" && auctionId !== "bid") {
      const auction = auctionsDb[auctionId];
      if (!auction) {
        return NextResponse.json(
          { success: false, error: "Auction not found" },
          { status: 404 }
        );
      }

      const hoursRemaining = Math.round(
        (new Date(auction.auction_end_time).getTime() - Date.now()) / (1000 * 60 * 60)
      );

      const minNextBid = auction.current_price + 50;

      return NextResponse.json(
        {
          success: true,
          auction: {
            ...auction,
            hours_remaining: hoursRemaining,
            min_next_bid: minNextBid,
            watchers: auctionWatchers[auctionId]?.size || 0,
            price_increase_percent:
              ((auction.current_price - auction.starting_price) /
                auction.starting_price) *
              100,
          },
        },
        { status: 200 }
      );
    }

    // List all auctions
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "open";
    const category = searchParams.get("category");

    let auctions = Object.values(auctionsDb).filter((a) => a.status === status);

    if (category) {
      auctions = auctions.filter((a) => a.category === category);
    }

    return NextResponse.json(
      {
        success: true,
        auctions: auctions.map((a) => {
          const hoursRemaining = Math.round(
            (new Date(a.auction_end_time).getTime() - Date.now()) / (1000 * 60 * 60)
          );
          return {
            id: a.id,
            title: a.title,
            category: a.category,
            starting_price: a.starting_price,
            current_price: a.current_price,
            current_leading_bid_by: a.current_leading_vendor,
            auction_end_time: a.auction_end_time,
            hours_remaining: hoursRemaining,
            total_bids: a.total_bids,
            unique_bidders: a.unique_bidders,
            can_bid: hoursRemaining > 0,
            min_next_bid: a.current_price + 50,
          };
        }),
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

/**
 * POST /api/vendor/auctions/{id}/bid - Place a bid
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pathname = request.nextUrl.pathname;
    const pathParts = pathname.split("/");
    const auctionId = pathParts[5];
    const action = pathParts[6]; // bid, watch, etc

    // Place bid
    if (action === "bid") {
      const body: BidRequest = await request.json();

      if (!body.bid_amount) {
        return NextResponse.json(
          { success: false, error: "Bid amount required" },
          { status: 400 }
        );
      }

      const auction = auctionsDb[auctionId];
      if (!auction) {
        return NextResponse.json(
          { success: false, error: "Auction not found" },
          { status: 404 }
        );
      }

      const minBid = auction.current_price + 50;
      if (body.bid_amount < minBid) {
        return NextResponse.json(
          {
            success: false,
            error: `Bid amount must be at least $${minBid}`,
          },
          { status: 400 }
        );
      }

      // Update auction
      auction.current_price = body.bid_amount;
      auction.total_bids += 1;
      auction.current_leading_vendor = "Your Bid";
      auction.bid_history.push({
        vendor_name: "Your Bid",
        bid_amount: body.bid_amount,
        time: "just now",
      });

      const isWinning = auction.current_price > 200; // Simplified logic

      return NextResponse.json(
        {
          success: true,
          bid_id: `bid_${Date.now()}`,
          auction_id: auctionId,
          bid_amount: body.bid_amount,
          total_contract_value: body.bid_amount * (body.contract_duration_months || 12),
          is_winning_bid: isWinning,
          message: isWinning ? "Bid placed! You are currently winning." : "Bid placed!",
          current_price: auction.current_price,
          next_minimum_bid: auction.current_price + 50,
        },
        { status: 201 }
      );
    }

    // Watch auction
    if (action === "watch") {
      const body = await request.json();

      if (!auctionWatchers[auctionId]) {
        auctionWatchers[auctionId] = new Set();
      }

      const vendorId = "vendor_001"; // From token in production
      const watching = body.watch !== false;

      if (watching) {
        auctionWatchers[auctionId].add(vendorId);
      } else {
        auctionWatchers[auctionId].delete(vendorId);
      }

      return NextResponse.json(
        {
          success: true,
          auction_id: auctionId,
          watching,
          message: watching
            ? "Now watching this auction. You will receive notifications."
            : "Stopped watching this auction.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing bid:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process bid" },
      { status: 500 }
    );
  }
}
