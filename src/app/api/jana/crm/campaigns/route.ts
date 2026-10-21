import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { execute, query, queryOne, transaction } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BATCH_SIZE = 5;

function errorResponse(error: any) {
  const message = String(error?.message || 'WhatsApp campaign request failed');
  const status = message === 'Not authenticated'
    ? 401
    : message.includes('Admin access required')
      ? 403
      : message.startsWith('Configure WHATSAPP_')
        ? 503
        : 500;
  return NextResponse.json({ error: message }, { status });
}

function providerConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_CRM_BROADCAST_TEMPLATE;
  const apiVersion = process.env.WHATSAPP_API_VERSION;
  const languageCode = process.env.WHATSAPP_CRM_TEMPLATE_LANGUAGE || process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';
  if (!accessToken || !phoneNumberId || !templateName || !apiVersion) {
    throw new Error('Configure WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_CRM_BROADCAST_TEMPLATE, and WHATSAPP_API_VERSION before sending CRM campaigns.');
  }
  return { accessToken, phoneNumberId, templateName, apiVersion, languageCode };
}

async function refreshCampaignStatus(campaignId: string) {
  const counts = await query<any>(
    `SELECT status, COUNT(*) AS count FROM crm_whatsapp_campaign_recipients
     WHERE campaign_id = ? GROUP BY status`,
    [campaignId]
  );
  const countMap = new Map<string, number>(counts.map((row: any) => [row.status, Number(row.count)]));
  const queued = countMap.get('queued') || 0;
  const sending = countMap.get('sending') || 0;
  const failed = countMap.get('failed') || 0;
  const skipped = countMap.get('skipped') || 0;
  const successful = ['sent', 'delivered', 'read'].reduce((sum, status) => sum + (countMap.get(status) || 0), 0);
  const status = queued + sending > 0
    ? 'sending'
    : failed === 0 && skipped === 0
      ? 'sent'
      : successful > 0 || skipped > 0
        ? 'partial'
        : 'failed';
  await execute('UPDATE crm_whatsapp_campaigns SET status = ? WHERE id = ?', [status, campaignId]);
  return { status, queued, sending, failed, skipped, successful };
}

export async function GET() {
  try {
    await requireAdmin();
    const campaigns = await query<any>(
      `SELECT c.id, c.group_id, g.name AS group_name, c.template_name, c.language_code,
              c.message_text, c.status, c.created_at,
              COUNT(r.id) AS recipient_count,
              SUM(r.status IN ('sent', 'delivered', 'read')) AS sent_count,
              SUM(r.status = 'delivered') AS delivered_count,
              SUM(r.status = 'read') AS read_count,
              SUM(r.status = 'failed') AS failed_count,
              SUM(r.status = 'skipped') AS skipped_count,
              SUM(r.status IN ('queued', 'sending')) AS pending_count
       FROM crm_whatsapp_campaigns c
       JOIN crm_groups g ON g.id = c.group_id
       LEFT JOIN crm_whatsapp_campaign_recipients r ON r.campaign_id = c.id
       GROUP BY c.id, c.group_id, g.name, c.template_name, c.language_code,
                c.message_text, c.status, c.created_at
       ORDER BY c.created_at DESC
       LIMIT 100`
    );
    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error('[jana/crm/campaigns GET]', error);
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const action = String(body.action || '');

    if (action === 'create') {
      const config = providerConfig();
      const groupId = String(body.groupId || '');
      const messageText = String(body.messageText || '').trim();
      if (!groupId || !messageText) {
        return NextResponse.json({ error: 'Select a group and enter a message.' }, { status: 400 });
      }
      if (messageText.length > 900) {
        return NextResponse.json({ error: 'Message must be 900 characters or less to fit the approved template variable.' }, { status: 400 });
      }
      const group = await queryOne<any>('SELECT id FROM crm_groups WHERE id = ? LIMIT 1', [groupId]);
      if (!group) return NextResponse.json({ error: 'CRM group not found.' }, { status: 404 });
      const recipients = await query<any>(
        `SELECT c.id, c.full_name, c.phone
         FROM crm_group_members gm
         JOIN crm_contacts c ON c.id = gm.member_id
         WHERE gm.group_id = ? AND gm.member_type = 'contact'
           AND c.whatsapp_opt_in = TRUE AND c.phone_international = TRUE
         ORDER BY c.full_name ASC
         LIMIT 3000`,
        [groupId]
      );
      if (recipients.length === 0) {
        return NextResponse.json({ error: 'This group has no contacts with recorded WhatsApp opt-in.' }, { status: 400 });
      }

      const campaignId = randomUUID();
      await transaction(async connection => {
        await connection.execute(
          `INSERT INTO crm_whatsapp_campaigns
             (id, group_id, template_name, language_code, message_text, status, created_by)
           VALUES (?, ?, ?, ?, ?, 'queued', ?)`,
          [campaignId, groupId, config.templateName, config.languageCode, messageText, admin.id]
        );
        for (let start = 0; start < recipients.length; start += 250) {
          const batch = recipients.slice(start, start + 250);
          const values = batch.map(() => '(?, ?, ?, ?)').join(', ');
          const parameters = batch.flatMap((recipient: any) => [
            campaignId,
            recipient.id,
            recipient.phone,
            recipient.full_name,
          ]);
          await connection.execute(
            `INSERT INTO crm_whatsapp_campaign_recipients
               (campaign_id, contact_id, recipient_phone, recipient_name)
             VALUES ${values}`,
            parameters
          );
        }
      });
      return NextResponse.json({
        success: true,
        campaignId,
        status: 'queued',
        recipientCount: recipients.length,
        batchSize: BATCH_SIZE,
      });
    }

    if (action === 'send_batch') {
      const campaignId = String(body.campaignId || '');
      if (!campaignId) return NextResponse.json({ error: 'Campaign ID is required.' }, { status: 400 });
      const campaign = await queryOne<any>(
        'SELECT id, status, message_text, template_name, language_code FROM crm_whatsapp_campaigns WHERE id = ? LIMIT 1',
        [campaignId]
      );
      if (!campaign) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
      if (['sent', 'partial', 'failed'].includes(campaign.status)) {
        return NextResponse.json({ error: 'This campaign has no more recipients to send.' }, { status: 409 });
      }
      const config = providerConfig();
      if (config.templateName !== campaign.template_name || config.languageCode !== campaign.language_code) {
        return NextResponse.json({ error: 'WhatsApp template configuration changed after this campaign was created. Create a new campaign to use the active template.' }, { status: 409 });
      }

      const claimToken = randomUUID();
      await execute(
        `UPDATE crm_whatsapp_campaign_recipients r
         JOIN crm_contacts c ON c.id = r.contact_id
         SET r.status = 'skipped', r.claim_token = NULL,
             r.provider_error = 'Contact opt-in was revoked before this batch was sent.'
         WHERE r.campaign_id = ? AND r.status = 'queued'
           AND (c.whatsapp_opt_in = FALSE OR c.phone_international = FALSE)`,
        [campaignId]
      );
      await execute(
        `UPDATE crm_whatsapp_campaign_recipients
         SET status = 'failed', claim_token = NULL,
             provider_error = 'Send attempt was interrupted; not retried to prevent duplicate delivery.'
         WHERE campaign_id = ? AND status = 'sending'
           AND updated_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)`,
        [campaignId]
      );
      await execute(
        `UPDATE crm_whatsapp_campaign_recipients
         SET status = 'sending', claim_token = ?
         WHERE campaign_id = ? AND status = 'queued'
         ORDER BY id ASC LIMIT ?`,
        [claimToken, campaignId, BATCH_SIZE]
      );
      const claimed = await query<any>(
        `SELECT id, recipient_phone, recipient_name
         FROM crm_whatsapp_campaign_recipients
         WHERE campaign_id = ? AND claim_token = ? AND status = 'sending'`,
        [campaignId, claimToken]
      );

      const results = await Promise.all(claimed.map(async (recipient: any) => {
        try {
          const response = await fetch(`https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${config.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: recipient.recipient_phone,
              type: 'template',
              template: {
                name: campaign.template_name,
                language: { code: campaign.language_code },
                components: [{
                  type: 'body',
                  parameters: [{ type: 'text', text: campaign.message_text }],
                }],
              },
            }),
            signal: AbortSignal.timeout(15000),
          });
          const payload = await response.json().catch(() => ({}));
          const messageId = payload?.messages?.[0]?.id;
          if (!response.ok || !messageId) {
            const providerError = payload?.error?.message || `WhatsApp provider returned HTTP ${response.status}`;
            await execute(
              `UPDATE crm_whatsapp_campaign_recipients
               SET status = 'failed', provider_error = ?, claim_token = NULL WHERE id = ? AND claim_token = ?`,
              [String(providerError).slice(0, 2000), recipient.id, claimToken]
            );
            return { success: false };
          }
          await execute(
            `UPDATE crm_whatsapp_campaign_recipients
             SET status = 'sent', whatsapp_message_id = ?, provider_error = NULL, claim_token = NULL
             WHERE id = ? AND claim_token = ?`,
            [String(messageId), recipient.id, claimToken]
          );
          return { success: true };
        } catch (error: any) {
          const message = String(error?.message || 'WhatsApp send failed').slice(0, 2000);
          await execute(
            `UPDATE crm_whatsapp_campaign_recipients
             SET status = 'failed', provider_error = ?, claim_token = NULL WHERE id = ? AND claim_token = ?`,
            [message, recipient.id, claimToken]
          );
          return { success: false };
        }
      }));

      const summary = await refreshCampaignStatus(campaignId);
      return NextResponse.json({
        success: true,
        attempted: results.length,
        batchSucceeded: results.filter(result => result.success).length,
        ...summary,
      });
    }

    return NextResponse.json({ error: 'Unsupported campaign action.' }, { status: 400 });
  } catch (error: any) {
    console.error('[jana/crm/campaigns POST]', error);
    return errorResponse(error);
  }
}
