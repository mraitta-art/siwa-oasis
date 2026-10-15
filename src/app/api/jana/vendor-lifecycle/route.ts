import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, transaction } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// ── Default message templates ────────────────────────────────────────────────
const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  welcome: {
    subject: '🎉 تم قبول تسجيلك في SiWiFy.com',
    body: `مرحباً {vendor_name}! 🎉

تم قبول تسجيلك في منصة SiWiFy.com بنجاح.
يمكنك الآن إدارة ملفك التجاري ومنصة العرض الخاصة بك.

🔗 رابط منصتك: {minisite_url}

— فريق SiWiFy.com

Welcome {vendor_name}! Your registration on SiWiFy.com has been approved. Manage your business profile at: {minisite_url}`,
  },
  rejection: {
    subject: 'بخصوص طلب التسجيل في SiWiFy.com',
    body: `عزيزي {vendor_name},

نأسف لإعلامك بأنه تم رفض طلب تسجيلك في منصة SiWiFy.com.
{reason}

يمكنك التواصل معنا للمزيد من المعلومات.

— فريق SiWiFy.com`,
  },
  suspension: {
    subject: 'تعليق حسابك في SiWiFy.com',
    body: `عزيزي {vendor_name},

تم تعليق حسابك مؤقتاً في منصة SiWiFy.com.
السبب: {reason}

للاستفسار، يرجى التواصل مع الإدارة.

— فريق SiWiFy.com`,
  },
  archive: {
    subject: 'أرشفة حسابك في SiWiFy.com',
    body: `عزيزي {vendor_name},

تم أرشفة حسابك في منصة SiWiFy.com.
يمكنك التواصل معنا في حال رغبت في إعادة التفعيل.

— فريق SiWiFy.com`,
  },
  restoration: {
    subject: '🎉 إعادة تفعيل حسابك في SiWiFy.com',
    body: `مرحباً {vendor_name}! 🎉

تمت إعادة تفعيل حسابك في منصة SiWiFy.com.
يمكنك الآن الوصول إلى لوحة التحكم الخاصة بك مجدداً.

🔗 {minisite_url}

— فريق SiWiFy.com`,
  },
  removal: {
    subject: 'حذف حسابك من SiWiFy.com',
    body: `عزيزي {vendor_name},

تم حذف حسابك من منصة SiWiFy.com.
للاستفسار، تواصل مع الإدارة.

— فريق SiWiFy.com`,
  },
  generic: {
    subject: 'رسالة من إدارة SiWiFy.com',
    body: `رسالة من إدارة SiWiFy.com

عزيزي {vendor_name},

{message}

— فريق SiWiFy.com`,
  },
};

// ── Helper: get templates from DB or defaults ────────────────────────────────
async function getTemplates(): Promise<Record<string, { subject: string; body: string }>> {
  try {
    const row = await queryOne<{ config_value: string }>(
      "SELECT config_value FROM website_configs WHERE config_key = 'vendor_lifecycle_messages' LIMIT 1"
    );
    if (row?.config_value) {
      const parsed = JSON.parse(row.config_value);
      return { ...DEFAULT_TEMPLATES, ...parsed };
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_TEMPLATES;
}

// ── Helper: build minisite URL ───────────────────────────────────────────────
function buildMinisiteUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://siwify.com';
  return `${base}/biz/${slug}`;
}

// ── Helper: interpolate template variables ───────────────────────────────────
function interpolate(
  text: string,
  vars: { vendor_name?: string; business_name?: string; minisite_url?: string; reason?: string; message?: string }
): string {
  return text
    .replace(/\{vendor_name\}/g, vars.vendor_name || '')
    .replace(/\{business_name\}/g, vars.business_name || '')
    .replace(/\{minisite_url\}/g, vars.minisite_url || '')
    .replace(/\{reason\}/g, vars.reason || '')
    .replace(/\{message\}/g, vars.message || '');
}

// ── Helper: insert vendor message ────────────────────────────────────────────
async function insertVendorMessage(
  vendorId: string,
  businessId: string | null,
  subject: string,
  body: string,
  type: string,
  actionTrigger: string
) {
  const id = uuidv4();
  await execute(
    `INSERT INTO vendor_messages (id, vendor_id, business_id, subject, body, type, action_trigger)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, vendorId, businessId, subject, body, type, actionTrigger]
  );
}

// ── Helper: log lifecycle event ──────────────────────────────────────────────
async function logLifecycleEvent(
  vendorId: string,
  businessId: string | null,
  action: string,
  reason: string | null,
  performedBy: string
) {
  const id = uuidv4();
  await execute(
    `INSERT INTO vendor_lifecycle_events (id, vendor_id, business_id, action, reason, performed_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, vendorId, businessId, action, reason, performedBy]
  );
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const setting = searchParams.get('setting');

  // Return message templates
  if (setting === 'message_templates') {
    const templates = await getTemplates();
    return NextResponse.json({ templates });
  }

  const tab = (searchParams.get('tab') || 'pending') as string;
  const search = searchParams.get('search') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const validTabs = ['pending', 'approved', 'suspended', 'archived', 'removed'];
  const safeTab = validTabs.includes(tab) ? tab : 'pending';

  const searchParam = `%${search}%`;

  // Build search condition
  const searchCondition = search
    ? `AND (p.display_name LIKE ? OR p.email LIKE ? OR p.phone LIKE ? OR b.name LIKE ? OR b.slug LIKE ?)`
    : '';
  const searchValues = search ? [searchParam, searchParam, searchParam, searchParam, searchParam] : [];

  // Fetch vendors with business data
  const vendorRows = await query<any>(
    `SELECT
       p.id AS user_id,
       p.display_name,
       p.email,
       p.phone,
       p.approval_status,
       p.active,
       p.created_at AS registered_at,
       b.id AS business_id,
       b.name AS business_name,
       b.slug AS business_slug,
       b.type AS business_type,
       b.category AS business_category,
       b.status AS business_status,
       (
         SELECT vm.subject FROM vendor_messages vm
         WHERE vm.vendor_id = p.id
         ORDER BY vm.created_at DESC LIMIT 1
       ) AS last_message_subject,
       (
         SELECT vm.created_at FROM vendor_messages vm
         WHERE vm.vendor_id = p.id
         ORDER BY vm.created_at DESC LIMIT 1
       ) AS last_message_at,
       (
         SELECT vm.action_trigger FROM vendor_messages vm
         WHERE vm.vendor_id = p.id
         ORDER BY vm.created_at DESC LIMIT 1
       ) AS last_action_trigger
     FROM profiles p
     LEFT JOIN businesses b ON b.vendor_id = p.id AND b.status != 'deleted'
     WHERE p.role = 'vendor'
       AND p.approval_status = ?
       ${searchCondition}
     GROUP BY p.id
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [safeTab, ...searchValues, pageSize, offset]
  );

  // Count per tab
  const countRows = await query<any>(
    `SELECT approval_status, COUNT(*) AS cnt
     FROM profiles
     WHERE role = 'vendor'
     GROUP BY approval_status`
  );

  const counts: Record<string, number> = {
    pending: 0,
    approved: 0,
    suspended: 0,
    archived: 0,
    removed: 0,
  };
  for (const row of countRows) {
    if (row.approval_status in counts) {
      counts[row.approval_status] = parseInt(row.cnt, 10);
    }
  }

  // Total for pagination
  const totalRows = await query<any>(
    `SELECT COUNT(DISTINCT p.id) AS total
     FROM profiles p
     LEFT JOIN businesses b ON b.vendor_id = p.id AND b.status != 'deleted'
     WHERE p.role = 'vendor'
       AND p.approval_status = ?
       ${searchCondition}`,
    [safeTab, ...searchValues]
  );
  const total = parseInt(totalRows[0]?.total || '0', 10);

  return NextResponse.json({
    vendors: vendorRows,
    counts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

// ── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  // ── Update templates ──────────────────────────────────────────────────────
  if (body.updateTemplates) {
    const { templates } = body;
    if (!templates || typeof templates !== 'object') {
      return NextResponse.json({ error: 'Invalid templates payload' }, { status: 400 });
    }
    const json = JSON.stringify(templates);
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM website_configs WHERE config_key = 'vendor_lifecycle_messages' LIMIT 1"
    );
    if (existing) {
      await execute(
        "UPDATE website_configs SET config_value = ?, updated_at = NOW() WHERE config_key = 'vendor_lifecycle_messages'",
        [json]
      );
    } else {
      await execute(
        "INSERT INTO website_configs (id, config_key, config_value, created_at, updated_at) VALUES (?, 'vendor_lifecycle_messages', ?, NOW(), NOW())",
        [uuidv4(), json]
      );
    }
    return NextResponse.json({ success: true });
  }

  // ── Lifecycle actions ─────────────────────────────────────────────────────
  const { userId, action, reason, customMessage, notifyVia } = body;

  if (!userId || !action) {
    return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
  }

  const validActions = ['approve', 'reject', 'suspend', 'archive', 'restore', 'remove', 'send_message'];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  }

  // Fetch vendor + business
  const vendor = await queryOne<any>(
    `SELECT p.id, p.display_name, p.email, p.approval_status,
            b.id AS business_id, b.slug AS business_slug, b.name AS business_name, b.vendor_id AS biz_vendor_id
     FROM profiles p
     LEFT JOIN businesses b ON b.vendor_id = p.id AND b.status != 'deleted'
     WHERE p.id = ? AND p.role = 'vendor'
     LIMIT 1`,
    [userId]
  );

  if (!vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  }

  const templates = await getTemplates();
  const minisiteUrl = vendor.business_slug ? buildMinisiteUrl(vendor.business_slug) : '';
  const vars = {
    vendor_name: vendor.display_name || vendor.email,
    business_name: vendor.business_name || '',
    minisite_url: minisiteUrl,
    reason: reason || '',
    message: customMessage || '',
  };

  try {
    await transaction(async (conn) => {
      switch (action) {
        case 'approve': {
          await conn.query(
            `UPDATE profiles SET approval_status='approved', active=1, updated_at=NOW() WHERE id=?`,
            [userId]
          );
          if (vendor.business_id) {
            const bvId = vendor.biz_vendor_id || userId;
            await conn.query(
              `UPDATE businesses SET status='active', is_claimed=1, approved_by_vendor=1, vendor_id=?, updated_at=NOW() WHERE id=?`,
              [bvId, vendor.business_id]
            );
          }
          break;
        }
        case 'reject': {
          await conn.query(
            `UPDATE profiles SET approval_status='removed', active=0, updated_at=NOW() WHERE id=?`,
            [userId]
          );
          if (vendor.business_id) {
            await conn.query(
              `UPDATE businesses SET status='inactive', updated_at=NOW() WHERE id=?`,
              [vendor.business_id]
            );
          }
          break;
        }
        case 'suspend': {
          await conn.query(
            `UPDATE profiles SET approval_status='suspended', active=0, updated_at=NOW() WHERE id=?`,
            [userId]
          );
          if (vendor.business_id) {
            await conn.query(
              `UPDATE businesses SET status='inactive', updated_at=NOW() WHERE id=?`,
              [vendor.business_id]
            );
          }
          break;
        }
        case 'archive': {
          await conn.query(
            `UPDATE profiles SET approval_status='archived', active=0, updated_at=NOW() WHERE id=?`,
            [userId]
          );
          if (vendor.business_id) {
            await conn.query(
              `UPDATE businesses SET status='archived', updated_at=NOW() WHERE id=?`,
              [vendor.business_id]
            );
          }
          break;
        }
        case 'restore': {
          await conn.query(
            `UPDATE profiles SET approval_status='approved', active=1, updated_at=NOW() WHERE id=?`,
            [userId]
          );
          if (vendor.business_id) {
            await conn.query(
              `UPDATE businesses SET status='active', updated_at=NOW() WHERE id=?`,
              [vendor.business_id]
            );
          }
          break;
        }
        case 'remove': {
          await conn.query(
            `UPDATE profiles SET approval_status='removed', active=0, updated_at=NOW() WHERE id=?`,
            [userId]
          );
          if (vendor.business_id) {
            await conn.query(
              `UPDATE businesses SET status='removed', updated_at=NOW() WHERE id=?`,
              [vendor.business_id]
            );
          }
          break;
        }
        case 'send_message':
          // No status change — just send a message below
          break;
      }
    });

    // ── Insert message ──────────────────────────────────────────────────────
    const templateKeyMap: Record<string, string> = {
      approve: 'welcome',
      reject: 'rejection',
      suspend: 'suspension',
      archive: 'archive',
      restore: 'restoration',
      remove: 'removal',
      send_message: 'generic',
    };
    const templateKey = templateKeyMap[action] || 'generic';
    const template = templates[templateKey] || templates.generic;

    const subject = customMessage
      ? (body.subject || template.subject)
      : template.subject;
    const rawBody = customMessage || template.body;
    const finalBody = interpolate(rawBody, vars);
    const finalSubject = interpolate(subject, vars);

    await insertVendorMessage(
      userId,
      vendor.business_id || null,
      finalSubject,
      finalBody,
      action === 'send_message' ? 'info' : 'action',
      action
    );

    // ── Log lifecycle event ─────────────────────────────────────────────────
    if (action !== 'send_message') {
      await logLifecycleEvent(
        userId,
        vendor.business_id || null,
        action,
        reason || null,
        admin.id
      );
    }

    return NextResponse.json({ success: true, action, vendorId: userId });
  } catch (err: any) {
    console.error('[vendor-lifecycle PATCH]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
