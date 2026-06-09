import { NextRequest, NextResponse } from "next/server";

/**
 * Vendor Communication Channels Management API
 * GET /api/vendor/communication-channels - Get vendor's channels
 * POST /api/vendor/add-communication-channel - Add new channel
 * PATCH /api/vendor/update-channel-preferences - Update preferences
 * DELETE /api/vendor/remove-communication-channel - Remove channel
 */

interface AddChannelRequest {
  channel_type:
    | "email"
    | "sms"
    | "whatsapp"
    | "wechat"
    | "telegram"
    | "phone"
    | "alipay"
    | "wechat_pay";
  identifier: string; // Phone, email, WeChat ID, etc
  preferred_language?:
    | "english"
    | "arabic"
    | "chinese_simplified"
    | "spanish"
    | "german";
  is_primary?: boolean;
}

interface UpdatePreferencesRequest {
  email?: { enabled: boolean; frequency: string };
  sms?: { enabled: boolean; frequency: string };
  whatsapp?: { enabled: boolean; frequency: string };
  wechat?: { enabled: boolean; frequency: string };
  phone?: { enabled: boolean };
  telegram?: { enabled: boolean };
}

// Simulated vendor channels database
const vendorChannelsDb: Record<
  string,
  {
    vendor_id: string;
    channels: Array<{
      id: string;
      type: string;
      identifier: string;
      status: string;
      verified: boolean;
      is_primary: boolean;
      messages_sent: number;
      last_used_at: string;
    }>;
    preferences: Record<string, any>;
    preferred_language: string;
  }
> = {
  vendor_001: {
    vendor_id: "vendor_001",
    channels: [
      {
        id: "ch_email_001",
        type: "email",
        identifier: "ali@bistro.com",
        status: "active",
        verified: true,
        is_primary: true,
        messages_sent: 15,
        last_used_at: "2026-06-09T10:00:00Z",
      },
    ],
    preferences: {
      email: { enabled: true, frequency: "daily", digest: false },
      sms: { enabled: false },
    },
    preferred_language: "english",
  },
};

/**
 * GET /api/vendor/communication-channels
 * Get vendor's configured communication channels
 */
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

    // Get vendor from token (simplified - in production use actual JWT decoding)
    const vendorId = "vendor_001"; // From token in production

    const vendorData = vendorChannelsDb[vendorId];
    if (!vendorData) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    const activeChannels = vendorData.channels.filter((c) => c.status === "active");
    const unverifiedChannels = vendorData.channels.filter(
      (c) => c.status === "pending_verification"
    );

    return NextResponse.json(
      {
        success: true,
        vendor_id: vendorId,
        channels: vendorData.channels.map((ch) => ({
          id: ch.id,
          type: ch.type,
          identifier: ch.identifier,
          status: ch.status,
          verified: ch.verified,
          is_primary: ch.is_primary,
          messages_sent: ch.messages_sent,
          last_used_at: ch.last_used_at,
        })),
        summary: {
          active_channels: activeChannels.length,
          unverified_channels: unverifiedChannels.length,
          total_messages_received: vendorData.channels.reduce(
            (sum, c) => sum + c.messages_sent,
            0
          ),
          preferred_language: vendorData.preferred_language,
        },
        available_channels_to_add: [
          "sms",
          "whatsapp",
          "wechat",
          "telegram",
          "phone",
        ],
        message:
          activeChannels.length === 1
            ? "Add more channels to improve notification delivery!"
            : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching vendor channels:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/add-communication-channel
 * Add new communication channel
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

    const body: AddChannelRequest = await request.json();

    if (!body.channel_type || !body.identifier) {
      return NextResponse.json(
        { success: false, error: "Missing channel_type or identifier" },
        { status: 400 }
      );
    }

    // Validate identifier format
    if (
      body.channel_type === "email" &&
      !body.identifier.includes("@")
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (
      body.channel_type === "phone" &&
      !body.identifier.startsWith("+")
    ) {
      return NextResponse.json(
        { success: false, error: "Phone must start with +" },
        { status: 400 }
      );
    }

    // Get vendor from token
    const vendorId = "vendor_001"; // From token in production
    const vendorData = vendorChannelsDb[vendorId];

    if (!vendorData) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Check if channel already exists
    const existingChannel = vendorData.channels.find(
      (c) => c.type === body.channel_type
    );
    if (existingChannel) {
      return NextResponse.json(
        {
          success: false,
          error: `${body.channel_type} channel already configured`,
        },
        { status: 400 }
      );
    }

    // Create new channel
    const newChannel = {
      id: `ch_${body.channel_type}_${Date.now()}`,
      type: body.channel_type,
      identifier: body.identifier,
      status: "pending_verification",
      verified: false,
      is_primary: body.is_primary || false,
      messages_sent: 0,
      last_used_at: null,
    };

    vendorData.channels.push(newChannel as any);

    console.log(
      `✅ New channel added for vendor: ${body.channel_type} → ${body.identifier}`
    );

    return NextResponse.json(
      {
        success: true,
        channel_id: newChannel.id,
        channel_type: body.channel_type,
        identifier: body.identifier,
        status: "pending_verification",
        message: `Channel added! Verification code sent to ${body.identifier}`,
        next_step: `Please verify your ${body.channel_type} to confirm.`,
        verification_required:
          body.channel_type !== "wechat", // Some channels don't require verification
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding communication channel:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add channel" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vendor/update-channel-preferences
 * Update notification preferences for channels
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: UpdatePreferencesRequest = await request.json();

    // Get vendor from token
    const vendorId = "vendor_001"; // From token in production
    const vendorData = vendorChannelsDb[vendorId];

    if (!vendorData) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Update preferences
    vendorData.preferences = {
      ...vendorData.preferences,
      ...body,
    };

    const activeChannels = Object.keys(body)
      .filter((key) => body[key as keyof UpdatePreferencesRequest]?.enabled)
      .join(", ");

    console.log(`📋 Preferences updated for vendor ${vendorId}`);

    return NextResponse.json(
      {
        success: true,
        preferences_updated: true,
        vendor_id: vendorId,
        active_channels: activeChannels || "None",
        preferences: vendorData.preferences,
        message: "Your notification preferences have been saved.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendor/remove-communication-channel/{channel_id}
 * Remove a communication channel
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pathname = request.nextUrl.pathname;
    const channelId = pathname.split("/")[5]; // /api/vendor/remove-communication-channel/{channelId}

    // Get vendor from token
    const vendorId = "vendor_001"; // From token in production
    const vendorData = vendorChannelsDb[vendorId];

    if (!vendorData) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    const channelIndex = vendorData.channels.findIndex(
      (c) => c.id === channelId
    );
    if (channelIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Channel not found" },
        { status: 404 }
      );
    }

    const removedChannel = vendorData.channels[channelIndex];

    if (removedChannel.is_primary) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot remove primary channel. Set another channel as primary first.",
        },
        { status: 400 }
      );
    }

    vendorData.channels.splice(channelIndex, 1);

    console.log(
      `🗑️ Channel removed: ${removedChannel.type} → ${removedChannel.identifier}`
    );

    return NextResponse.json(
      {
        success: true,
        removed_channel: removedChannel.type,
        message: `${removedChannel.type} channel has been removed.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing channel:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove channel" },
      { status: 500 }
    );
  }
}
