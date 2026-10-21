import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { execute, query, queryOne, transaction } from '@/lib/db';

export const dynamic = 'force-dynamic';

type MemberType = 'contact' | 'business';

function normalizePhone(value: unknown) {
  const raw = String(value || '').trim();
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  return digits.length >= 8 && digits.length <= 15 ? digits : '';
}

function normalizeEmail(value: unknown) {
  const email = String(value || '').trim().toLowerCase();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function errorResponse(error: any) {
  const message = String(error?.message || 'CRM request failed');
  const status = message === 'Not authenticated' ? 401 : message.includes('Admin access required') ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}

async function verifyMembers(type: MemberType, ids: string[]) {
  if (ids.length === 0) return;
  const table = type === 'contact' ? 'crm_contacts' : 'businesses';
  const rows = await query<any>(
    `SELECT id FROM ${table} WHERE id IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  const found = new Set(rows.map((row: any) => String(row.id)));
  const missing = ids.filter(id => !found.has(id));
  if (missing.length) throw new Error(`Unknown ${type} member IDs: ${missing.join(', ')}`);
}

export async function GET() {
  try {
    await requireAdmin();
    const [contacts, groups, members, businesses, announcements] = await Promise.all([
      query<any>(
        `SELECT id, full_name, phone, phone_international, email, whatsapp_opt_in, opted_in_at, source, created_at
         FROM crm_contacts ORDER BY full_name ASC LIMIT 3000`
      ),
      query<any>(
        `SELECT id, name, description, created_at FROM crm_groups ORDER BY name ASC LIMIT 500`
      ),
      query<any>(
        `SELECT gm.group_id, gm.member_type, gm.member_id,
                c.full_name AS contact_name, c.phone AS contact_phone, c.whatsapp_opt_in,
                b.name AS business_name, b.slug AS business_slug
         FROM crm_group_members gm
         LEFT JOIN crm_contacts c ON gm.member_type = 'contact' AND c.id = gm.member_id
         LEFT JOIN businesses b ON gm.member_type = 'business' AND b.id = gm.member_id
         ORDER BY gm.group_id, gm.member_type, COALESCE(c.full_name, b.name)`
      ),
      query<any>(
        `SELECT id, name, slug FROM businesses ORDER BY name ASC LIMIT 3000`
      ),
      query<any>(
        `SELECT a.*, g.name AS group_name
         FROM crm_announcements a JOIN crm_groups g ON g.id = a.group_id
         ORDER BY a.published_at DESC LIMIT 500`
      ),
    ]);
    return NextResponse.json({ contacts, groups, members, businesses, announcements });
  } catch (error: any) {
    console.error('[jana/crm GET]', error);
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const action = String(body.action || '');

    if (action === 'import_contacts') {
      if (!Array.isArray(body.contacts) || body.contacts.length === 0 || body.contacts.length > 2000) {
        return NextResponse.json({ error: 'Provide between 1 and 2,000 contacts per import.' }, { status: 400 });
      }
      const accepted: {
        id: string;
        name: string;
        phone: string;
        internationalPhone: boolean;
        email: string | null;
        optedIn: boolean;
      }[] = [];
      const rejected: { index: number; reason: string }[] = [];
      for (const [index, item] of body.contacts.entries()) {
        const fullName = String(item?.full_name || '').trim().slice(0, 255);
        const rawPhone = String(item?.phone || '').trim();
        const phone = normalizePhone(rawPhone);
        const email = item?.email ? normalizeEmail(item.email) : null;
        const internationalPhone = /^\s*(\+|00)/.test(rawPhone);
        const optedIn = item?.whatsapp_opt_in === true;
        if (!fullName) {
          rejected.push({ index, reason: 'Name is required.' });
          continue;
        }
        if (!phone) {
          rejected.push({ index, reason: 'Phone must contain 8–15 digits.' });
          continue;
        }
        if (optedIn && !internationalPhone) {
          rejected.push({ index, reason: 'Opted-in WhatsApp numbers must include an international prefix (+ or 00).' });
          continue;
        }
        if (item?.email && !email) {
          rejected.push({ index, reason: 'Email address is invalid.' });
          continue;
        }
        accepted.push({
          id: randomUUID(),
          name: fullName,
          phone,
          internationalPhone,
          email,
          optedIn,
        });
      }
      if (!accepted.length) {
        return NextResponse.json({ error: 'No contacts were imported.', rejected }, { status: 400 });
      }
      await transaction(async connection => {
        for (let start = 0; start < accepted.length; start += 100) {
          const batch = accepted.slice(start, start + 100);
          const values = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, \'admin_import\')').join(', ');
          const parameters = batch.flatMap(contact => [
            contact.id,
            contact.name,
            contact.phone,
            contact.internationalPhone,
            contact.email,
            contact.optedIn,
            contact.optedIn ? new Date() : null,
          ]);
          await connection.execute(
            `INSERT INTO crm_contacts (id, full_name, phone, phone_international, email, whatsapp_opt_in, opted_in_at, source)
             VALUES ${values}
             ON DUPLICATE KEY UPDATE
               full_name = VALUES(full_name),
               phone_international = VALUES(phone_international),
               email = COALESCE(VALUES(email), email),
               whatsapp_opt_in = IF(VALUES(whatsapp_opt_in), TRUE, whatsapp_opt_in),
               opted_in_at = IF(VALUES(whatsapp_opt_in), COALESCE(opted_in_at, NOW()), opted_in_at),
               opted_out_at = IF(VALUES(whatsapp_opt_in), NULL, opted_out_at)`,
            parameters
          );
        }
      });
      return NextResponse.json({ success: true, imported: accepted.length, rejected });
    }

    if (action === 'save_group') {
      const id = String(body.id || randomUUID());
      const name = String(body.name || '').trim().slice(0, 160);
      const description = String(body.description || '').trim().slice(0, 500);
      if (!name) return NextResponse.json({ error: 'Group name is required.' }, { status: 400 });
      const existingGroup = await queryOne<any>('SELECT id FROM crm_groups WHERE name = ? LIMIT 1', [name]);
      if (existingGroup) return NextResponse.json({ error: 'A group with this name already exists.' }, { status: 409 });
      await execute(
        `INSERT INTO crm_groups (id, name, description, created_by) VALUES (?, ?, ?, ?)`,
        [id, name, description || null, admin.id]
      );
      return NextResponse.json({ success: true, id });
    }

    if (action === 'update_group') {
      const id = String(body.id || '');
      const name = String(body.name || '').trim().slice(0, 160);
      const description = String(body.description || '').trim().slice(0, 500);
      if (!id || !name) return NextResponse.json({ error: 'Group ID and name are required.' }, { status: 400 });
      const group = await queryOne<any>('SELECT id FROM crm_groups WHERE id = ? LIMIT 1', [id]);
      if (!group) return NextResponse.json({ error: 'CRM group not found.' }, { status: 404 });
      const duplicate = await queryOne<any>(
        'SELECT id FROM crm_groups WHERE name = ? AND id <> ? LIMIT 1',
        [name, id]
      );
      if (duplicate) return NextResponse.json({ error: 'A group with this name already exists.' }, { status: 409 });
      await execute(
        'UPDATE crm_groups SET name = ?, description = ? WHERE id = ?',
        [name, description || null, id]
      );
      return NextResponse.json({ success: true, id });
    }

    if (action === 'set_members') {
      const groupId = String(body.groupId || '');
      const memberType = body.memberType as MemberType;
      const ids = Array.isArray(body.memberIds)
        ? [...new Set((body.memberIds as unknown[])
          .map(id => String(id).trim())
          .filter((id): id is string => Boolean(id)))]
        : [];
      if (!groupId || !['contact', 'business'].includes(memberType)) {
        return NextResponse.json({ error: 'A group and valid member type are required.' }, { status: 400 });
      }
      if (ids.length > 3000) return NextResponse.json({ error: 'Group membership limit is 3,000.' }, { status: 400 });
      const group = await queryOne<any>('SELECT id FROM crm_groups WHERE id = ? LIMIT 1', [groupId]);
      if (!group) return NextResponse.json({ error: 'CRM group not found.' }, { status: 404 });
      await verifyMembers(memberType, ids);
      await transaction(async connection => {
        await connection.execute(
          'DELETE FROM crm_group_members WHERE group_id = ? AND member_type = ?',
          [groupId, memberType]
        );
        for (let start = 0; start < ids.length; start += 500) {
          const batch = ids.slice(start, start + 500);
          const values = batch.map(() => '(?, ?, ?)').join(', ');
          const parameters = batch.flatMap(memberId => [groupId, memberType, memberId]);
          await connection.execute(
            `INSERT INTO crm_group_members (group_id, member_type, member_id) VALUES ${values}`,
            parameters
          );
        }
      });
      return NextResponse.json({ success: true, count: ids.length });
    }

    if (action === 'set_contact_opt_in') {
      const contactId = String(body.contactId || '');
      if (typeof body.optedIn !== 'boolean' || !contactId) {
        return NextResponse.json({ error: 'Contact ID and explicit opt-in state are required.' }, { status: 400 });
      }
      if (body.optedIn) {
        const contact = await queryOne<any>('SELECT phone_international FROM crm_contacts WHERE id = ? LIMIT 1', [contactId]);
        if (!contact) return NextResponse.json({ error: 'Contact not found.' }, { status: 404 });
        if (!contact.phone_international) {
          return NextResponse.json({ error: 'Update this contact to an international phone number before enabling WhatsApp opt-in.' }, { status: 400 });
        }
      }
      const result = await execute(
        `UPDATE crm_contacts SET whatsapp_opt_in = ?, opted_in_at = ?, opted_out_at = ? WHERE id = ?`,
        [body.optedIn, body.optedIn ? new Date() : null, body.optedIn ? null : new Date(), contactId]
      );
      if (!result.affectedRows) return NextResponse.json({ error: 'Contact not found.' }, { status: 404 });
      return NextResponse.json({ success: true, optedIn: body.optedIn });
    }

    if (action === 'publish_announcement') {
      const groupId = String(body.groupId || '');
      const kind = body.kind === 'news' ? 'news' : body.kind === 'ribbon' ? 'ribbon' : '';
      const titleAr = String(body.titleAr || '').trim().slice(0, 255);
      const bodyAr = String(body.bodyAr || '').trim();
      const ctaUrl = String(body.ctaUrl || '').trim().slice(0, 1000);
      const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
      if (!groupId || !kind || !titleAr || !bodyAr) {
        return NextResponse.json({ error: 'Select a group and provide a kind, Arabic title, and Arabic message.' }, { status: 400 });
      }
      if (bodyAr.length > 10000) return NextResponse.json({ error: 'Message must be 10,000 characters or less.' }, { status: 400 });
      if (ctaUrl && !(/^(https?:\/\/|\/(?!\/))/.test(ctaUrl))) {
        return NextResponse.json({ error: 'CTA link must be a valid HTTP(S) URL or a site-relative path.' }, { status: 400 });
      }
      if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now())) {
        return NextResponse.json({ error: 'Expiry must be a future date.' }, { status: 400 });
      }
      const group = await queryOne<any>('SELECT id FROM crm_groups WHERE id = ? LIMIT 1', [groupId]);
      if (!group) return NextResponse.json({ error: 'CRM group not found.' }, { status: 404 });
      const businessMembers = await query<any>(
        `SELECT member_id FROM crm_group_members WHERE group_id = ? AND member_type = 'business'`,
        [groupId]
      );
      if (businessMembers.length === 0) {
        return NextResponse.json({ error: 'Add at least one registered business to this group before publishing dashboard news.' }, { status: 400 });
      }
      const id = randomUUID();
      await execute(
        `INSERT INTO crm_announcements
          (id, group_id, kind, title_ar, title_en, body_ar, body_en, cta_text_ar, cta_text_en, cta_url, created_by, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          groupId,
          kind,
          titleAr,
          String(body.titleEn || '').trim().slice(0, 255) || null,
          bodyAr,
          String(body.bodyEn || '').trim().slice(0, 10000) || null,
          String(body.ctaTextAr || '').trim().slice(0, 120) || null,
          String(body.ctaTextEn || '').trim().slice(0, 120) || null,
          ctaUrl || null,
          admin.id,
          expiresAt,
        ]
      );
      return NextResponse.json({ success: true, id, status: 'published' });
    }

    if (action === 'archive_announcement') {
      const announcementId = String(body.announcementId || '');
      if (!announcementId) return NextResponse.json({ error: 'Announcement ID is required.' }, { status: 400 });
      const result = await execute(
        `UPDATE crm_announcements SET status = 'archived' WHERE id = ? AND status = 'published'`,
        [announcementId]
      );
      if (!result.affectedRows) return NextResponse.json({ error: 'Published announcement not found.' }, { status: 404 });
      return NextResponse.json({ success: true, status: 'archived' });
    }

    if (action === 'delete_group') {
      const groupId = String(body.groupId || '');
      if (!groupId) return NextResponse.json({ error: 'Group ID is required.' }, { status: 400 });
      try {
        const result = await execute('DELETE FROM crm_groups WHERE id = ?', [groupId]);
        if (!result.affectedRows) return NextResponse.json({ error: 'Group not found.' }, { status: 404 });
      } catch (error: any) {
        if (String(error?.code || '') === 'ER_ROW_IS_REFERENCED_2') {
          return NextResponse.json({ error: 'This group has campaign history and cannot be deleted.' }, { status: 409 });
        }
        throw error;
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unsupported CRM action.' }, { status: 400 });
  } catch (error: any) {
    console.error('[jana/crm POST]', error);
    return errorResponse(error);
  }
}
