import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (verifyToken && mode === 'subscribe' && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Webhook verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return NextResponse.json({ error: 'Webhook signature verification is not configured' }, { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256') || '';
  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    const messageChanges = Array.isArray(payload?.entry)
      ? payload.entry.flatMap((entry: any) => Array.isArray(entry?.changes) ? entry.changes : [])
      : [];
    const unsubscribeCommands = new Set([
      'stop', 'unsubscribe', 'cancel', 'end', 'quit', 'remove',
      'إلغاء الاشتراك', 'الغاء الاشتراك', 'إلغاء', 'الغاء', 'إيقاف', 'ايقاف', 'توقف', 'وقف',
    ]);
    for (const change of messageChanges) {
      const messages = change?.value?.messages;
      if (!Array.isArray(messages)) continue;
      for (const message of messages) {
        const command = String(message?.text?.body || '').trim().toLowerCase();
        if (!unsubscribeCommands.has(command)) continue;
        const phone = String(message?.from || '').replace(/\D/g, '');
        if (phone.length < 8 || phone.length > 15) continue;
        await execute(
          `UPDATE crm_contacts
           SET whatsapp_opt_in = FALSE, opted_in_at = NULL, opted_out_at = NOW()
           WHERE phone = ?`,
          [phone]
        );
      }
    }

    const changes = Array.isArray(payload?.entry)
      ? messageChanges
      : [];
    for (const change of changes) {
      const statuses = change?.value?.statuses;
      if (!Array.isArray(statuses)) continue;
      for (const update of statuses) {
        const messageId = String(update?.id || '');
        const providerStatus = String(update?.status || '');
        if (!messageId || !['sent', 'delivered', 'read', 'failed'].includes(providerStatus)) continue;
        const handoff = await queryOne<any>(
          'SELECT id, status FROM minisite_vendor_handoffs WHERE whatsapp_message_id = ? LIMIT 1',
          [messageId]
        );
        if (!handoff) {
          const recipient = await queryOne<any>(
            `SELECT id, status FROM crm_whatsapp_campaign_recipients
             WHERE whatsapp_message_id = ? LIMIT 1`,
            [messageId]
          );
          if (!recipient) continue;
          const statusRank: Record<string, number> = { sent: 0, delivered: 1, read: 2, failed: 3 };
          if ((statusRank[providerStatus] ?? -1) >= (statusRank[recipient.status] ?? -1)) {
            await execute(
              `UPDATE crm_whatsapp_campaign_recipients
               SET status = ?,
                   provider_error = CASE WHEN ? = 'failed' THEN ? ELSE provider_error END
               WHERE id = ? AND status <> 'failed'`,
              [
                providerStatus,
                providerStatus,
                JSON.stringify(update?.errors || []).slice(0, 2000),
                recipient.id,
              ]
            );
          }
          continue;
        }

        const eventPayload = {
          message_id: messageId,
          provider_status: providerStatus,
          timestamp: update?.timestamp || null,
          errors: Array.isArray(update?.errors)
            ? update.errors.map((item: any) => ({ code: item?.code, title: item?.title, message: item?.message }))
            : [],
        };
        const providerTrackedStatuses = ['sent', 'delivered', 'read', 'failed'];
        if (providerTrackedStatuses.includes(handoff.status)) {
          await execute(
            `UPDATE minisite_vendor_handoffs SET status = ?,
               whatsapp_error = CASE WHEN ? = 'failed' THEN ? ELSE whatsapp_error END
             WHERE id = ? AND status NOT IN ('accepted', 'changes_requested', 'published', 'expired')`,
            [
              providerStatus,
              providerStatus,
              JSON.stringify(eventPayload.errors).slice(0, 2000),
              handoff.id,
            ]
          );
        }
        await execute(
          `INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload)
           VALUES (?, ?, ?)`,
          [handoff.id, `whatsapp_${providerStatus}`, JSON.stringify(eventPayload)]
        );
      }
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[webhooks/whatsapp]', error);
    return NextResponse.json({ error: 'Unable to process WhatsApp webhook' }, { status: 500 });
  }
}
