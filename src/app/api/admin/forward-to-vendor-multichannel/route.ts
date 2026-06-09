import { NextRequest, NextResponse } from "next/server";

/**
 * Multi-Channel Vendor Communication API
 * POST /api/admin/forward-to-vendor-multichannel
 *
 * Forward recommendation to vendor via multiple channels:
 * - Email
 * - SMS
 * - WhatsApp
 * - WeChat
 * - Phone Call (IVR)
 * - Telegram
 * - Alipay
 * - WeChat Pay
 */

interface ChannelConfig {
  type:
    | "email"
    | "sms"
    | "whatsapp"
    | "wechat"
    | "phone_call"
    | "telegram"
    | "alipay"
    | "wechat_pay";
  enabled: boolean;
  priority?: number; // 1 = highest priority
}

interface ForwardMultiChannelRequest {
  recommendation_id: string;
  vendor_id: string;
  vendor_email?: string;
  vendor_phone?: string;
  vendor_whatsapp?: string;
  vendor_wechat_id?: string;
  vendor_telegram_id?: string;

  // Channels to use
  channels: ChannelConfig[];

  notification_type: "initial_request" | "milestone" | "followup";
  contact_data_sharing_level:
    | "none"
    | "names_only"
    | "emails_only"
    | "full_contact"
    | "anonymous";

  preferred_language?: "english" | "arabic" | "chinese_simplified" | "chinese_traditional" | "spanish";
  include_visitor_feedback?: boolean;
  admin_note?: string;
}

interface ChannelResult {
  type: string;
  status: "sent" | "failed" | "queued" | "not_configured";
  recipient?: string;
  message_id?: string;
  sent_at?: string;
  error?: string;
  cost?: number;
}

// Simulated vendor data
const vendorChannels: Record<
  string,
  {
    email?: string;
    phone?: string;
    whatsapp?: string;
    wechat?: string;
    telegram?: string;
  }
> = {
  vendor_001: {
    email: "ali@bistro.com",
    phone: "+20 1234567890",
    whatsapp: "+20 1234567890",
    wechat: "AlisBistro",
  },
};

// Helper: Build channel-specific message
function buildChannelMessage(
  channel: string,
  language: string,
  vendorName: string,
  visitorCount: number
): string {
  if (channel === "email") {
    return `<h1>🌟 ${visitorCount} Visitors Are Asking For You!</h1>
<p>Your business was recommended ${visitorCount} times on Siwa Oasis.</p>
<p><a href="https://siwatoday.com/vendor/requests">View Your Requests</a></p>`;
  }

  if (channel === "sms") {
    return `Hi ${vendorName}! ${visitorCount} people on Siwa Oasis asked for you! Claim FREE profile: siwa.co/claim`;
  }

  if (channel === "whatsapp") {
    return `🌟 ${visitorCount} Visitors Asking For You!\n\nBusiness: Your Business\nRequests: ${visitorCount}\n\n[CLAIM PROFILE] [VIEW REQUESTS]`;
  }

  if (channel === "wechat" && language.includes("chinese")) {
    return `🌟 ${visitorCount}位游客正在寻找你！\n\n[领取免费资料] [查看请求] [升级商家]`;
  }

  if (channel === "telegram") {
    return `🌟 *${visitorCount} Visitors Asking For You!*\n\n[Claim Profile] [View Requests]`;
  }

  if (channel === "phone_call") {
    return `Hello ${vendorName}, this is Siwa Oasis. ${visitorCount} visitors have requested your business. Press 1 to view requests.`;
  }

  return `You have ${visitorCount} visitor requests on Siwa Oasis!`;
}

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

    const body: ForwardMultiChannelRequest = await request.json();

    // Validate required fields
    if (!body.recommendation_id || !body.vendor_id || !body.channels || body.channels.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: recommendation_id, vendor_id, channels",
        },
        { status: 400 }
      );
    }

    const vendor = vendorChannels[body.vendor_id];
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Process each channel
    const results: ChannelResult[] = [];
    let totalCost = 0;

    for (const channel of body.channels) {
      if (!channel.enabled) continue;

      let result: ChannelResult = { type: channel.type, status: "queued" };

      switch (channel.type) {
        case "email":
          if (body.vendor_email || vendor.email) {
            result = {
              type: "email",
              status: "sent",
              recipient: body.vendor_email || vendor.email,
              message_id: `msg_email_${Date.now()}`,
              sent_at: new Date().toISOString(),
              cost: 0.02,
            };
            totalCost += 0.02;
            console.log(`📧 Email sent to ${body.vendor_email || vendor.email}`);
          } else {
            result = {
              type: "email",
              status: "failed",
              error: "No email address on file",
            };
          }
          break;

        case "sms":
          if (body.vendor_phone || vendor.phone) {
            result = {
              type: "sms",
              status: "sent",
              recipient: body.vendor_phone || vendor.phone,
              message_id: `msg_sms_${Date.now()}`,
              sent_at: new Date().toISOString(),
              cost: 0.03,
            };
            totalCost += 0.03;
            console.log(`📱 SMS sent to ${body.vendor_phone || vendor.phone}`);
          } else {
            result = {
              type: "sms",
              status: "failed",
              error: "No phone number on file",
            };
          }
          break;

        case "whatsapp":
          if (body.vendor_whatsapp || vendor.whatsapp) {
            result = {
              type: "whatsapp",
              status: "sent",
              recipient: body.vendor_whatsapp || vendor.whatsapp,
              message_id: `msg_wa_${Date.now()}`,
              sent_at: new Date().toISOString(),
              cost: 0.04,
            };
            totalCost += 0.04;
            console.log(
              `💬 WhatsApp sent to ${body.vendor_whatsapp || vendor.whatsapp}`
            );
          } else {
            result = {
              type: "whatsapp",
              status: "failed",
              error: "No WhatsApp number on file",
            };
          }
          break;

        case "wechat":
          if (body.vendor_wechat_id || vendor.wechat) {
            result = {
              type: "wechat",
              status: "sent",
              recipient: body.vendor_wechat_id || vendor.wechat,
              message_id: `msg_wechat_${Date.now()}`,
              sent_at: new Date().toISOString(),
              cost: 0.05,
            };
            totalCost += 0.05;
            console.log(
              `🔴 WeChat sent to ${body.vendor_wechat_id || vendor.wechat}`
            );
          } else {
            result = {
              type: "wechat",
              status: "failed",
              error: "No WeChat ID on file",
            };
          }
          break;

        case "phone_call":
          if (body.vendor_phone || vendor.phone) {
            result = {
              type: "phone_call",
              status: "sent",
              recipient: body.vendor_phone || vendor.phone,
              message_id: `msg_call_${Date.now()}`,
              sent_at: new Date().toISOString(),
              cost: 0.25,
            };
            totalCost += 0.25;
            console.log(`☎️ Phone call initiated to ${body.vendor_phone || vendor.phone}`);
          } else {
            result = {
              type: "phone_call",
              status: "failed",
              error: "No phone number on file",
            };
          }
          break;

        case "telegram":
          if (body.vendor_telegram_id) {
            result = {
              type: "telegram",
              status: "sent",
              recipient: body.vendor_telegram_id,
              message_id: `msg_tg_${Date.now()}`,
              sent_at: new Date().toISOString(),
              cost: 0.0, // Free
            };
            console.log(`📲 Telegram sent to @${body.vendor_telegram_id}`);
          } else {
            result = {
              type: "telegram",
              status: "failed",
              error: "No Telegram ID on file",
            };
          }
          break;

        case "alipay":
          result = {
            type: "alipay",
            status: "not_configured",
            error: "Alipay integration requires payment account setup",
          };
          break;

        case "wechat_pay":
          result = {
            type: "wechat_pay",
            status: "not_configured",
            error: "WeChat Pay integration requires payment account setup",
          };
          break;

        default:
          result = {
            type: channel.type,
            status: "failed",
            error: "Unknown channel type",
          };
      }

      results.push(result);
    }

    // Summary
    const successCount = results.filter((r) => r.status === "sent").length;
    const failedCount = results.filter((r) => r.status === "failed").length;
    const partialSuccess = successCount > 0 && failedCount > 0;

    return NextResponse.json(
      {
        success: true,
        notification_id: `notif_${Date.now()}`,
        recommendation_id: body.recommendation_id,
        vendor_id: body.vendor_id,
        channels_sent: results,
        summary: {
          total_channels: results.length,
          successful: successCount,
          failed: failedCount,
          partial_delivery: partialSuccess,
          total_cost: `$${totalCost.toFixed(2)}`,
        },
        message: `Notification sent via ${successCount} channel${successCount !== 1 ? "s" : ""}${
          failedCount > 0 ? ` (${failedCount} failed)` : ""
        }`,
        recommended_fallback:
          failedCount > 0
            ? "Consider adding missing contact information to vendor profile"
            : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending multi-channel notification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/vendor-channels/{vendor_id}
 * Get all communication channels for a vendor
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pathname = request.nextUrl.pathname;
    const vendorId = pathname.split("/")[4];

    const vendor = vendorChannels[vendorId];
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        vendor_id: vendorId,
        channels: [
          {
            type: "email",
            configured: !!vendor.email,
            identifier: vendor.email || null,
            primary: true,
          },
          {
            type: "phone",
            configured: !!vendor.phone,
            identifier: vendor.phone || null,
          },
          {
            type: "whatsapp",
            configured: !!vendor.whatsapp,
            identifier: vendor.whatsapp || null,
          },
          {
            type: "wechat",
            configured: !!vendor.wechat,
            identifier: vendor.wechat || null,
          },
          {
            type: "telegram",
            configured: false,
            identifier: null,
          },
        ],
        available_channels: Object.keys(vendor).length,
        message: "Configure missing channels to improve delivery rate",
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
