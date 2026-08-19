import { NextRequest, NextResponse } from 'next/server';
import { query, execute, normalizeCustomData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * VENDOR STORYTELLER API
 * Handles the merging of DNA Blueprint structure with actual Business Content.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.businessId) {
      return NextResponse.json({ error: 'No business linked to this account' }, { status: 404 });
    }

    // 1. Fetch Business and its Typology
    const business = (await query('SELECT * FROM businesses WHERE id = ?', [user.businessId])) as any[];
    if (business.length === 0) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    const biz = business[0];

    // 2. Fetch full typology chain (child → parent)
    const typesToFetch: string[] = [];
    let currentTypeId = biz.type_id;
    let childType: any = null;
    let parentType: any = null;

    while (currentTypeId) {
      const typeRes = (await query(
        'SELECT id, name, icon, icon_color, parent_id, is_parent FROM business_types WHERE id = ?',
        [currentTypeId]
      )) as any[];
      if (typeRes.length === 0) break;
      const t = typeRes[0];
      typesToFetch.push(t.id);
      if (!childType) childType = t;          // first iteration = the direct typology
      if (!t.parent_id) parentType = t;       // no parent = this IS the parent
      else {
        // look up the parent info
        const pRes = (await query(
          'SELECT id, name, icon, icon_color FROM business_types WHERE id = ?',
          [t.parent_id]
        )) as any[];
        if (pRes.length > 0) parentType = pRes[0];
      }
      currentTypeId = t.parent_id;
    }
    // Always include the SECTION_TEMPLATE for universal DNA
    typesToFetch.push('SECTION_TEMPLATE');

    // 3. Fetch the Form Fields (The Structure/DNA) — also pull section feature flags
    const fields = (await query(
      'SELECT f.*, s.name as section_name, s.icon as section_icon, s.enable_gallery, s.enable_blog, ' +
      's.required as section_required, s.vendor_editable as section_vendor_editable, ' +
      's.inheritance_rules as section_inheritance_rules, s.curation_policy as section_curation_policy ' +
      'FROM form_fields f ' +
      'JOIN sections s ON f.section_id = s.id ' +
      'WHERE f.business_type_id IN (?) ' +
      'ORDER BY s.sort_order ASC, f.sort_order ASC',
      [typesToFetch]
    )) as any[];

    // 4. Parse & Normalize custom_data
    const currentData = normalizeCustomData(biz.custom_data);

    // 5. Group fields by section for the UI
    const sections: Record<string, any> = {};
    fields.forEach(f => {
      if (!sections[f.section_id]) {
        // Parse section overrides for the direct child typology (biz.type_id)
        const rules = (() => {
          try {
            return typeof f.section_inheritance_rules === 'string'
              ? JSON.parse(f.section_inheritance_rules)
              : f.section_inheritance_rules || {};
          } catch {
            return {};
          }
        })();
        const typologyRules = rules.typologies?.[biz.type_id] || {};
        
        // Resolve required status: Typology Required Override -> Base Section Required
        const isRequiredOverride = typologyRules.required_override;
        const sectionRequired = isRequiredOverride === 'required'
          ? true
          : (isRequiredOverride === 'optional' ? false : f.section_required !== 0);

        // Resolve Order Lock override
        const orderLocked = !!typologyRules.order_locked;

        sections[f.section_id] = {
          id: f.section_id,
          name: f.section_name,
          icon: f.section_icon,
          required: sectionRequired,
          vendor_editable: f.section_vendor_editable !== 0,
          curation_policy: f.section_curation_policy || 'manual_review',
          order_locked: orderLocked,
          cta_phone_override: typologyRules.cta_phone || null,
          // Feature flags — admin-controlled per section
          enable_gallery: f.enable_gallery !== 0,
          enable_blog:    f.enable_blog    !== 0,
          fields: []
        };
      }
      
      // Merge current value into field definition
      const value = currentData[f.section_id]?.[f.name] || '';
      sections[f.section_id].fields.push({
        ...f,
        value,
        options: f.options ? (typeof f.options === 'string' ? JSON.parse(f.options) : f.options) : null
      });
    });

    // 6. Fetch Tier Features
    const tierResult = (await query('SELECT features FROM subscription_tiers WHERE id = ?', [biz.subscription_tier])) as any[];
    const tierFeatures = tierResult.length > 0 ? (typeof tierResult[0].features === 'string' ? JSON.parse(tierResult[0].features) : tierResult[0].features) : {};

    // 7. Merge Admin Overrides
    let allowedSections = tierFeatures.allowedSections || [];
    if (biz.admin_overrides) {
      try {
        const overrides = typeof biz.admin_overrides === 'string' ? JSON.parse(biz.admin_overrides) : biz.admin_overrides;
        if (Array.isArray(overrides.allowed_sections)) {
          allowedSections = [...new Set([...allowedSections, ...overrides.allowed_sections])];
        }
      } catch (e) {
        console.error("Failed to parse admin_overrides:", e);
      }
    }
    tierFeatures.allowedSections = allowedSections;

    // 8. Fetch Section Controls (Admin Overrides & Custom Labels)
    const controlsResult = await query(
      'SELECT section_id, custom_label, admin_locked_label, admin_hidden, admin_disabled, cta_phone FROM business_section_controls WHERE business_id = ?',
      [biz.id]
    ) as any[];
    const sectionControls: Record<string, any> = {};
    controlsResult.forEach(c => {
      sectionControls[c.section_id] = {
        custom_label: c.custom_label,
        admin_locked_label: c.admin_locked_label === 1,
        admin_hidden: c.admin_hidden === 1,
        admin_disabled: c.admin_disabled === 1,
        cta_phone: c.cta_phone || null,
      };
    });

    // Fetch profile fields for verification status
    const profileRes = (await query('SELECT verification_status, trust_rejection_note FROM profiles WHERE id = ?', [user.id])) as any[];
    const verificationStatus = profileRes.length > 0 ? profileRes[0].verification_status : 'unverified';
    const trustRejectionNote = profileRes.length > 0 ? profileRes[0].trust_rejection_note : null;

    return NextResponse.json({
      business: {
        id: biz.id,
        name: biz.name,
        slug: biz.slug || biz.id,
        description: biz.description || '',
        type_id: biz.type_id,
        status: biz.status,
        published: biz.published,
        is_published: !!(biz.published === 1 || biz.published === true || biz.status === 'active'),
        tier: biz.subscription_tier,
        is_trusted: biz.is_trusted === 1,
        minisite_visible_until: biz.minisite_visible_until
      },
      verificationStatus,
      trustRejectionNote,
      // ── TYPOLOGY IDENTITY ─────────────────────────────────
      typology: {
        child: childType  ? { id: childType.id,  name: childType.name,  icon: childType.icon,  color: childType.icon_color  } : null,
        parent: parentType? { id: parentType.id, name: parentType.name, icon: parentType.icon, color: parentType.icon_color } : null,
      },
      tierFeatures,
      structure: Object.values(sections),
      sectionControls // NEW
    });

  } catch (error) {
    console.error('Vendor API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { data, section_labels, hidden_sections } = body;

    // Start from current custom_data to avoid overwriting unrelated fields
    const existing = (await query(
      'SELECT custom_data FROM businesses WHERE id = ?',
      [user.businessId]
    )) as any[];
    const currentData = existing.length > 0 ? normalizeCustomData(existing[0].custom_data) : {};

    // Merge new section field data
    const merged = { ...currentData, ...(data || {}) };

    // Persist vendor-customised tab labels
    if (section_labels && typeof section_labels === 'object') {
      merged.section_labels = section_labels;
      merged.basic = { ...(merged.basic || {}), section_labels };

      // Persist to the dedicated table as well
      for (const [secId, label] of Object.entries(section_labels)) {
        // Skip empty labels to avoid clearing admin locks if not needed, or update if empty string
        await execute(
          `INSERT INTO business_section_controls (id, business_id, section_id, custom_label) 
           VALUES (UUID(), ?, ?, ?)
           ON DUPLICATE KEY UPDATE custom_label = ?`,
          [user.businessId, secId, label as string, label as string]
        );
      }
    }

    // Persist vendor-controlled section visibility (hidden_sections)
    if (Array.isArray(hidden_sections)) {
      merged.basic = {
        ...(merged.basic || {}),
        hidden_sections,
      };
    }

    await execute(
      'UPDATE businesses SET custom_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(merged), user.businessId]
    );

    return NextResponse.json({ success: true, message: 'Story updated and live!' });

  } catch (error) {
    console.error('Vendor Update Error:', error);
    return NextResponse.json({ error: 'Failed to save changes' }, { status: 500 });
  }
}
