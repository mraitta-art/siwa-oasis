export const dynamic = 'force-dynamic';

import { query, queryOne, execute, normalizeCustomData } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';
import { createBusinessEntity } from '@/lib/business-creation';

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
      const customData = normalizeCustomData(biz.custom_data);

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
    const { business_name, business_type, email, phone, description, custom_data, logo_url } = body;

    if (!business_name || !business_type) {
      return Response.json({ error: 'Name and Type are required' }, { status: 400 });
    }

    const baseCustomData = custom_data ? { ...custom_data } : {};
    if (!baseCustomData.basic) baseCustomData.basic = {};
    if (!baseCustomData.sec_1_identity) baseCustomData.sec_1_identity = {};
    if (!baseCustomData.business_info) baseCustomData.business_info = {};

    const finalLogo = logo_url || baseCustomData.basic.business_logo || baseCustomData.basic.logo || baseCustomData.sec_1_identity.business_logo || baseCustomData.sec_1_identity.logo || baseCustomData.business_info.business_logo || baseCustomData.business_info.logo || baseCustomData.business_logo || baseCustomData.logo || '';

    if (finalLogo) {
      baseCustomData.business_logo = finalLogo;
      baseCustomData.logo = finalLogo;
      baseCustomData.logo_url = finalLogo;
      baseCustomData.basic.business_logo = finalLogo;
      baseCustomData.basic.logo = finalLogo;
      baseCustomData.basic.logo_url = finalLogo;
      baseCustomData.basic.display_name = business_name;
      baseCustomData.business_info.business_logo = finalLogo;
      baseCustomData.business_info.logo = finalLogo;
      baseCustomData.business_info.logo_url = finalLogo;
      baseCustomData.sec_1_identity.business_logo = finalLogo;
      baseCustomData.sec_1_identity.logo = finalLogo;
      baseCustomData.sec_1_identity.logo_url = finalLogo;
    }

    baseCustomData.basic.display_name = business_name;
    if (email) baseCustomData.basic.email_address = email;
    if (phone) baseCustomData.basic.phone_number = phone;
    if (description) baseCustomData.basic.description = description;

    const created = await createBusinessEntity({
      name: business_name,
      type_id: business_type,
      custom_data: baseCustomData,
      status: 'pending',
      is_standalone: true,
      source: 'public_business_submission',
    });

    return Response.json({
      success: true,
      id: created.id,
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
    const { id, status, template_id, subscription_tier, is_standalone, custom_data, logo_url } = body;

    if (!id || !status) {
      return Response.json({ error: 'Missing id or status' }, { status: 400 });
    }

    let mergedCustomData = custom_data;
    if (custom_data !== undefined) {
      const existing = await queryOne('SELECT custom_data FROM businesses WHERE id = ?', [id]) as any;
      let current = {};
      try {
        current = typeof existing?.custom_data === 'string' ? JSON.parse(existing.custom_data) : existing?.custom_data || {};
      } catch {}
      mergedCustomData = { ...current, ...custom_data };
      for (const section of Object.keys(custom_data || {})) {
        if (current[section] && typeof custom_data[section] === 'object') {
          mergedCustomData[section] = { ...current[section], ...custom_data[section] };
        }
      }
    }

    const effectiveLogo = logo_url || mergedCustomData?.basic?.business_logo || mergedCustomData?.basic?.logo || mergedCustomData?.sec_1_identity?.business_logo || mergedCustomData?.sec_1_identity?.logo || mergedCustomData?.business_info?.business_logo || mergedCustomData?.business_info?.logo || mergedCustomData?.business_logo || mergedCustomData?.logo || '';
    if (effectiveLogo) {
      mergedCustomData = { ...(mergedCustomData || {}) };
      mergedCustomData.business_logo = effectiveLogo;
      mergedCustomData.logo = effectiveLogo;
      mergedCustomData.logo_url = effectiveLogo;
      mergedCustomData.basic = { ...(mergedCustomData.basic || {}), business_logo: effectiveLogo, logo: effectiveLogo, logo_url: effectiveLogo };
      mergedCustomData.sec_1_identity = { ...(mergedCustomData.sec_1_identity || {}), business_logo: effectiveLogo, logo: effectiveLogo, logo_url: effectiveLogo };
      mergedCustomData.business_info = { ...(mergedCustomData.business_info || {}), business_logo: effectiveLogo, logo: effectiveLogo, logo_url: effectiveLogo };
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
    if (mergedCustomData !== undefined) {
      sets.push('custom_data = ?');
      params.push(JSON.stringify(mergedCustomData));
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
