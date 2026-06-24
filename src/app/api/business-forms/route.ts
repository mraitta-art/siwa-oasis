export const dynamic = 'force-dynamic';

import { query, queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';

// Helper to create URL-friendly slugs
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

// GET: Retrieve pending business forms (requires Admin)
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    // Fetch businesses with selected status (default to pending)
    const sql = `
      SELECT b.id, b.name as business_name, b.type_id as business_type, bt.name as type_name,
             b.subscription_tier, b.status, b.created_at, b.custom_data, b.is_standalone, b.template_id
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      WHERE b.status = ?
      ORDER BY b.created_at DESC
    `;
    const results = await query(sql, [status]) as any[];

    // Parse JSON custom_data and map fields for client compatibility
    const mapped = results.map(biz => {
      let customData = {};
      try {
        customData = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data || {};
      } catch (e) {}

      const basic = (customData as any).basic || {};
      return {
        id: biz.id,
        business_name: biz.business_name,
        business_type: biz.business_type,
        type_name: biz.type_name,
        email: basic.email_address || basic.email || '',
        phone: basic.phone_number || basic.phone || '',
        description: basic.description || '',
        status: biz.status,
        created_at: biz.created_at,
        custom_data: customData,
        is_standalone: biz.is_standalone,
        template_id: biz.template_id,
        subscription_tier: biz.subscription_tier
      };
    });

    return Response.json(mapped);
  } catch (error: any) {
    console.error('GET business-forms error:', error);
    return Response.json({ error: error.message }, { status: error.message.includes('authenticated') ? 401 : 500 });
  }
}

// POST: Public / Vendor submission of new business (saves as pending)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { business_name, business_type, email, phone, description, custom_data } = body;

    if (!business_name || !business_type) {
      return Response.json({ error: 'Name and Type are required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const slug = slugify(business_name);

    // Build the dynamic custom_data structure
    const baseCustomData = custom_data || {};
    if (!baseCustomData.basic) {
      baseCustomData.basic = {};
    }
    // Ensure contact details are synced to custom_data.basic
    baseCustomData.basic.display_name = business_name;
    if (email) baseCustomData.basic.email_address = email;
    if (phone) baseCustomData.basic.phone_number = phone;
    if (description) baseCustomData.basic.description = description;

    // Resolve default template from subscription tier (free)
    let template_id = null;
    try {
      const tierRow = await queryOne('SELECT default_template_id FROM subscription_tiers WHERE id = ?', ['free']) as any;
      if (tierRow?.default_template_id) {
        template_id = tierRow.default_template_id;
      }
    } catch (e) {}

    const sql = `
      INSERT INTO businesses (id, name, slug, type_id, subscription_tier, status, custom_data, published, is_standalone, template_id)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, 1, 1, ?)
    `;

    await execute(sql, [
      id,
      business_name,
      slug,
      business_type,
      'free',
      JSON.stringify(baseCustomData),
      template_id
    ]);

    return Response.json({
      success: true,
      id,
      message: 'Business registration submitted for review.'
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST business-forms error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Approve / reject or update a pending submission (requires Admin)
export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, status, template_id, subscription_tier, is_standalone, custom_data } = body;

    if (!id || !status) {
      return Response.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const sets: string[] = ['status = ?'];
    const params: any[] = [status];

    if (template_id !== undefined) {
      sets.push('template_id = ?');
      params.push(template_id);
    }
    if (subscription_tier !== undefined) {
      sets.push('subscription_tier = ?');
      params.push(subscription_tier);
    }
    if (is_standalone !== undefined) {
      sets.push('is_standalone = ?');
      params.push(is_standalone ? 1 : 0);
    }
    if (custom_data !== undefined) {
      sets.push('custom_data = ?');
      params.push(JSON.stringify(custom_data));
    }

    params.push(id);

    const updateSql = `
      UPDATE businesses 
      SET ${sets.join(', ')}
      WHERE id = ?
    `;

    await execute(updateSql, params);

    return Response.json({
      success: true,
      message: `Business registration ${id} status updated to ${status}`
    });
  } catch (error: any) {
    console.error('PATCH business-forms error:', error);
    return Response.json({ error: error.message }, { status: error.message.includes('authenticated') ? 401 : 500 });
  }
}

// DELETE: Delete a pending submission (requires Admin)
export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json({ error: 'Missing id' }, { status: 400 });
    }

    await execute('DELETE FROM businesses WHERE id = ?', [id]);

    return Response.json({
      success: true,
      message: 'Business registration deleted'
    });
  } catch (error: any) {
    console.error('DELETE business-forms error:', error);
    return Response.json({ error: error.message }, { status: error.message.includes('authenticated') ? 401 : 500 });
  }
}
