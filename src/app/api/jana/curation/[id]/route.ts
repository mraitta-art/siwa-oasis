import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // 1. Fetch Business Details
    const bizRow = await queryOne(
      `SELECT b.*, 
              bt.name as type_name, 
              bt.icon as type_icon, 
              bt.icon_color as type_icon_color,
              bt.sections as type_sections,
              bt.own_sections as type_own_sections,
              p.email as vendor_email, 
              p.display_name as vendor_name,
              p.phone as vendor_phone,
              mt.name as template_name
       FROM businesses b
       LEFT JOIN business_types bt ON b.type_id = bt.id
       LEFT JOIN profiles p ON b.vendor_id = p.id
       LEFT JOIN minisite_templates mt ON b.template_id = mt.id
       WHERE b.id = ?`,
      [id]
    ) as any;

    if (!bizRow) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Normalize JSON structures
    try { if (typeof bizRow.custom_data === 'string') bizRow.custom_data = JSON.parse(bizRow.custom_data); } catch { bizRow.custom_data = {}; }
    try { if (typeof bizRow.curation_data === 'string') bizRow.curation_data = JSON.parse(bizRow.curation_data); } catch { bizRow.curation_data = {}; }
    if (!bizRow.custom_data) bizRow.custom_data = {};
    if (!bizRow.curation_data) bizRow.curation_data = {};

    // 2. Resolve Sections for this Typology
    let sectionIds: string[] = [];
    try {
      const parsedSections = typeof bizRow.type_sections === 'string' ? JSON.parse(bizRow.type_sections || '[]') : (bizRow.type_sections || []);
      const parsedOwnSections = typeof bizRow.type_own_sections === 'string' ? JSON.parse(bizRow.type_own_sections || '[]') : (bizRow.type_own_sections || []);
      sectionIds = Array.from(new Set([...parsedSections, ...parsedOwnSections]));
    } catch {}

    let sections: any[] = [];
    if (sectionIds.length > 0) {
      const placeholders = sectionIds.map(() => '?').join(',');
      sections = await query(
        `SELECT * FROM sections WHERE (id IN (${placeholders}) OR is_universal = 1) ORDER BY sort_order ASC`,
        sectionIds
      );
    } else {
      sections = await query('SELECT * FROM sections WHERE is_universal = 1 ORDER BY sort_order ASC');
    }

    // 3. Fetch Section Controls for this Business
    const sectionControlsList = await query(
      'SELECT section_id, custom_label, admin_locked_label, admin_hidden, admin_disabled, cta_phone FROM business_section_controls WHERE business_id = ?',
      [id]
    );
    const sectionControls: Record<string, any> = {};
    (sectionControlsList || []).forEach((c: any) => {
      sectionControls[c.section_id] = c;
    });

    // 4. Fetch Form Fields for this Typology
    const formFields = await query(
      `SELECT * FROM form_fields WHERE business_type_id IN (?, 'SECTION_TEMPLATE') ORDER BY section_id, display_order ASC`,
      [bizRow.type_id]
    );

    // 5. Fetch Vendor Gallery Items for this Business
    let gallery: any[] = [];
    try {
      gallery = await query(
        `SELECT vg.*, s.name as section_name 
         FROM vendor_gallery vg
         LEFT JOIN sections s ON vg.section_id = s.id
         WHERE vg.business_id = ? OR (vg.vendor_id = ? AND vg.vendor_id IS NOT NULL AND vg.vendor_id <> '')
         ORDER BY vg.created_at DESC`,
        [id, bizRow.vendor_id || '']
      );
    } catch (e: any) {
      console.warn('Gallery query warning:', e?.message);
    }

    // 6. Fetch Section Components & Data Instances
    let components: any[] = [];
    if (sectionIds.length > 0) {
      try {
        const placeholders = sectionIds.map(() => '?').join(',');
        const compRows = await query(
          `SELECT sc.id as component_id, sc.section_id, sc.component_type, sc.label as component_label, sc.config,
                  sc.is_required, sc.is_repeatable, sc.max_items, sc.display_order as comp_order,
                  scd.id as data_id, scd.data as data_json, scd.status as data_status, scd.title as data_title, scd.display_order as data_order
           FROM section_components sc
           LEFT JOIN section_component_data scd ON sc.id = scd.section_component_id AND scd.business_id = ?
           WHERE sc.section_id IN (${placeholders})
           ORDER BY sc.section_id, sc.display_order, scd.display_order`,
          [id, ...sectionIds]
        );

        const compMap: Record<string, any> = {};
        (compRows || []).forEach((row: any) => {
          if (!compMap[row.component_id]) {
            let config = {};
            try { config = typeof row.config === 'string' ? JSON.parse(row.config) : (row.config || {}); } catch {}
            compMap[row.component_id] = {
              id: row.component_id,
              section_id: row.section_id,
              component_type: row.component_type,
              label: row.component_label,
              config,
              is_required: row.is_required,
              is_repeatable: row.is_repeatable,
              max_items: row.max_items,
              instances: []
            };
          }
          if (row.data_id) {
            let parsedData = {};
            try { parsedData = typeof row.data_json === 'string' ? JSON.parse(row.data_json) : (row.data_json || {}); } catch {}
            compMap[row.component_id].instances.push({
              id: row.data_id,
              title: row.data_title,
              status: row.data_status,
              data: parsedData,
              display_order: row.data_order
            });
          }
        });
        components = Object.values(compMap);
      } catch (e: any) {
        console.warn('Components query warning:', e?.message);
      }
    }

    // 7. Fetch Section Blogs
    let blogs: any[] = [];
    try {
      blogs = await query(
        `SELECT sb.*, s.name as section_name 
         FROM section_blogs sb
         LEFT JOIN sections s ON sb.section_id = s.id
         WHERE sb.business_id = ?
         ORDER BY sb.created_at DESC`,
        [id]
      );
    } catch (e: any) {
      console.warn('Blogs query warning:', e?.message);
    }

    // 8. Fetch Quick Switcher Businesses list
    const otherBusinesses = await query(
      `SELECT id, name, slug, subscription_tier, status, is_trusted FROM businesses ORDER BY name ASC LIMIT 200`
    );

    return NextResponse.json({
      success: true,
      business: bizRow,
      sections,
      sectionControls,
      formFields: formFields || [],
      gallery: gallery || [],
      components: components || [],
      blogs: blogs || [],
      otherBusinesses: otherBusinesses || []
    });
  } catch (error: any) {
    console.error('Unified Curation GET Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const {
      businessUpdates,
      customData,
      curationData,
      sectionControls,
      galleryUpdates,
      blogUpdates,
      componentDataUpdates
    } = body;

    // 1. Business Record Updates
    if (businessUpdates && typeof businessUpdates === 'object') {
      const sets: string[] = [];
      const sqlParams: any[] = [];
      const allowed = ['name', 'subscription_tier', 'status', 'is_trusted', 'is_master', 'is_recommended', 'is_featured', 'template_id', 'minisite_visible_until'];
      for (const [key, val] of Object.entries(businessUpdates)) {
        if (allowed.includes(key)) {
          sets.push(`${key} = ?`);
          sqlParams.push(['is_trusted', 'is_master', 'is_recommended', 'is_featured'].includes(key) ? (val ? 1 : 0) : val);
        }
      }
      if (sets.length > 0) {
        sqlParams.push(id);
        await execute(`UPDATE businesses SET ${sets.join(', ')} WHERE id = ?`, sqlParams);
      }
    }

    // 2. Custom Data (Deep Merge)
    if (customData && typeof customData === 'object') {
      const existing = await queryOne('SELECT custom_data FROM businesses WHERE id = ?', [id]) as any;
      let currentData: Record<string, any> = {};
      try {
        currentData = typeof existing?.custom_data === 'string' ? JSON.parse(existing.custom_data) : (existing?.custom_data || {});
      } catch {}

      const mergedData = { ...currentData, ...customData };
      for (const secKey of Object.keys(customData)) {
        if (currentData[secKey] && typeof customData[secKey] === 'object') {
          mergedData[secKey] = { ...currentData[secKey], ...customData[secKey] };
        }
      }

      await execute('UPDATE businesses SET custom_data = ? WHERE id = ?', [JSON.stringify(mergedData), id]);
    }

    // 3. Curation Data Updates
    if (curationData && typeof curationData === 'object') {
      await execute('UPDATE businesses SET curation_data = ? WHERE id = ?', [JSON.stringify(curationData), id]);
    }

    // 4. Section Controls Upsert
    if (sectionControls && typeof sectionControls === 'object') {
      for (const [secId, ctrl] of Object.entries(sectionControls as Record<string, any>)) {
        await execute(
          `INSERT INTO business_section_controls 
             (id, business_id, section_id, custom_label, admin_locked_label, admin_hidden, admin_disabled, cta_phone)
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             custom_label = VALUES(custom_label),
             admin_locked_label = VALUES(admin_locked_label),
             admin_hidden = VALUES(admin_hidden),
             admin_disabled = VALUES(admin_disabled),
             cta_phone = VALUES(cta_phone)`,
          [
            id,
            secId,
            ctrl.custom_label || null,
            ctrl.admin_locked_label ? 1 : 0,
            ctrl.admin_hidden ? 1 : 0,
            ctrl.admin_disabled ? 1 : 0,
            ctrl.cta_phone || null
          ]
        );
      }
    }

    // 5. Vendor Gallery Updates
    if (Array.isArray(galleryUpdates)) {
      for (const item of galleryUpdates) {
        if (!item.id) continue;
        const sets: string[] = [];
        const itemParams: any[] = [];

        if (item.approval_status !== undefined) {
          sets.push('approval_status = ?');
          itemParams.push(item.approval_status);
        }
        if (item.is_hero !== undefined) {
          sets.push('is_hero = ?');
          itemParams.push(item.is_hero ? 1 : 0);
        }
        if (item.placement !== undefined) {
          sets.push('placement = ?');
          itemParams.push(item.placement);
        }
        if (item.show_on_minisite !== undefined) {
          sets.push('show_on_minisite = ?');
          itemParams.push(item.show_on_minisite ? 1 : 0);
        }
        if (item.show_on_main !== undefined) {
          sets.push('show_on_main = ?');
          itemParams.push(item.show_on_main ? 1 : 0);
        }
        if (item.caption !== undefined) {
          sets.push('caption = ?');
          itemParams.push(item.caption);
        }
        if (item.slide_data !== undefined) {
          sets.push('slide_data = ?');
          itemParams.push(typeof item.slide_data === 'object' ? JSON.stringify(item.slide_data) : item.slide_data);
        }

        if (sets.length > 0) {
          itemParams.push(item.id);
          await execute(`UPDATE vendor_gallery SET ${sets.join(', ')} WHERE id = ?`, itemParams);
        }
      }
    }

    // 6. Section Blogs Updates
    if (Array.isArray(blogUpdates)) {
      for (const blog of blogUpdates) {
        if (!blog.id) continue;
        const sets: string[] = [];
        const blogParams: any[] = [];
        if (blog.status !== undefined) { sets.push('status = ?'); blogParams.push(blog.status); }
        if (blog.show_on_minisite !== undefined) { sets.push('show_on_minisite = ?'); blogParams.push(blog.show_on_minisite ? 1 : 0); }
        if (blog.show_on_main !== undefined) { sets.push('show_on_main = ?'); blogParams.push(blog.show_on_main ? 1 : 0); }
        if (blog.title !== undefined) { sets.push('title = ?'); blogParams.push(blog.title); }
        if (blog.content !== undefined) { sets.push('content = ?'); blogParams.push(blog.content); }

        if (sets.length > 0) {
          blogParams.push(blog.id);
          await execute(`UPDATE section_blogs SET ${sets.join(', ')} WHERE id = ?`, blogParams);
        }
      }
    }

    // 7. Component Data Updates
    if (Array.isArray(componentDataUpdates)) {
      for (const inst of componentDataUpdates) {
        const componentStatus = ['draft', 'pending_approval', 'published'].includes(inst.status)
          ? inst.status
          : 'pending_approval';

        if (inst.data_id) {
          await execute(
            `UPDATE section_component_data 
             SET title = ?, data = ?, status = ?, display_order = ? 
             WHERE id = ?`,
            [
              inst.title || null,
              typeof inst.data === 'object' ? JSON.stringify(inst.data) : (inst.data || '{}'),
              componentStatus,
              inst.display_order || 0,
              inst.data_id
            ]
          );
          await execute(
            `UPDATE vendor_services
             SET approval_status = ?, approved_at = CASE WHEN ? = 'published' THEN NOW() ELSE NULL END,
                 rejection_note = CASE WHEN ? = 'rejected' THEN COALESCE(?, rejection_note) ELSE NULL END
             WHERE source_component_data_id = ?`,
            [componentStatus, componentStatus, componentStatus, inst.approval_notes || null, inst.data_id]
          );
        } else if (inst.component_id) {
          // New instance insertion
          const insertedComponentDataId = uuidv4();
          await execute(
            `INSERT INTO section_component_data 
               (id, section_component_id, business_id, title, data, status, display_order, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              insertedComponentDataId,
              inst.component_id,
              id,
              inst.title || null,
              typeof inst.data === 'object' ? JSON.stringify(inst.data) : (inst.data || '{}'),
              componentStatus,
              inst.display_order || 0
            ]
          );
          await execute(
            `UPDATE vendor_services
             SET approval_status = ?, approved_at = CASE WHEN ? = 'published' THEN NOW() ELSE NULL END
             WHERE source_component_data_id = ?`,
            [componentStatus, componentStatus, insertedComponentDataId]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All content controls unified and saved successfully!'
    });
  } catch (error: any) {
    console.error('Unified Curation PATCH Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
