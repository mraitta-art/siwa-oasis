import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import VanityBusinessClient from '@/components/VanityBusinessClient';
import { query as safeQuery, normalizeCustomData } from '@/lib/db';
import { filterCoreSectionsForBusinessType, getEffectiveSectionLabel, isSectionApprovedForMinisite, isSectionHidden } from '@/lib/section-registry';
import { normalizeMinisiteTemplate } from '@/lib/minisite-template';
import { getPublishedManifest } from '@/lib/minisite-manifest';

export const dynamic = 'force-dynamic';

/**
 * SERVER-SIDE SEO ENGINE FOR PER-SECTION SUB-PATH URLS
 * Enhancement #10: Emits rich, section-specific title, description, and OG image
 */
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string; section: string }> 
}): Promise<Metadata> {
  const { slug, section } = await params;
  try {
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let biz: any = null;

    if (isId) {
      const [bizById] = await safeQuery<any>(
        `SELECT b.*, t.features as tier_features FROM businesses b LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id WHERE b.id = ?`,
        [slug]
      );
      if (bizById?.slug) return { title: `Redirecting to ${bizById.name}...` };
      biz = bizById;
    } else {
      const [row] = await safeQuery<any>(
        `SELECT b.*, t.features as tier_features FROM businesses b LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id WHERE b.slug = ? OR (b.custom_domain = ? AND b.custom_domain_verified = 1) OR LOWER(REPLACE(TRIM(b.name), ' ', '-')) = ?`,
        [slug, slug, slug]
      );
      biz = row ?? null;
    }

    if (!biz) return { title: 'Business Not Found - SiWiFy.com' };

    biz.custom_data = normalizeCustomData(biz.custom_data);
    const data = biz.custom_data || {};
    const identity = { ...(data.business_info || {}), ...(data.sec_1_identity || {}), ...(data.basic || {}) };

    // Fetch section details & label
    const [secRow] = await safeQuery<any>('SELECT name, description FROM sections WHERE id = ? LIMIT 1', [section]);
    const sectionName = secRow?.name || section.replace(/^(sec_\d+_)?/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    // Check custom section label override
    const [ctrl] = await safeQuery<any>('SELECT custom_label FROM business_section_controls WHERE business_id = ? AND section_id = ? LIMIT 1', [biz.id, section]);
    const sectionLabel = ctrl?.custom_label || data.section_labels?.[section] || sectionName;

    // Fetch section gallery or blog for description and image
    const [blogRow] = await safeQuery<any>(
      `SELECT title, excerpt FROM section_blogs WHERE business_id = ? AND section_id = ? AND status = 'published' AND show_on_minisite = 1 LIMIT 1`,
      [biz.id, section]
    );

    const [imgRow] = await safeQuery<any>(
      `SELECT url FROM vendor_gallery WHERE business_id = ? AND section_id = ? AND approval_status = 'approved' AND show_on_minisite = 1 ORDER BY is_hero DESC LIMIT 1`,
      [biz.id, section]
    );

    const logoUrl = identity.business_logo || identity.logo || data.business_info?.business_logo || data.business_info?.logo;
    const ogImage = imgRow?.url || logoUrl || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62';

    const rawDesc = blogRow?.excerpt || data[section]?.description || data[section]?.section_news || identity.description || `Explore ${sectionLabel} offered by ${biz.name} in Siwa Oasis.`;
    const cleanDesc = String(rawDesc).substring(0, 160).replace(/<[^>]*>/g, '');

    return {
      title: `${biz.name} — ${sectionLabel} | Siwa Oasis Registry`,
      description: cleanDesc,
      openGraph: {
        title: `${biz.name} — ${sectionLabel}`,
        description: cleanDesc,
        type: 'website',
        url: `https://siwify.com/${biz.slug || slug}/${section}`,
        images: [{ url: ogImage, width: 1200, height: 630 }]
      }
    };
  } catch {
    return { title: 'SiWiFy.com Minisite' };
  }
}

/**
 * VANITY URL SECTION SUB-PATH SERVER COMPONENT
 * Deep-links directly into a specific minisite section tab
 */
export default async function VanitySectionPage({ 
  params 
}: { 
  params: Promise<{ slug: string; section: string }> 
}) {
  const { slug, section } = await params;
  
  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  
  try {
    let siteSettings: any = null;
    try {
      const [mainCfg] = await safeQuery<any>("SELECT config FROM website_configs WHERE type = 'website_main' LIMIT 1");
      if (mainCfg) {
        const parsed = typeof mainCfg.config === 'string' ? JSON.parse(mainCfg.config) : mainCfg.config;
        siteSettings = parsed?.site_settings || null;
      }
    } catch {}

    const platformName = siteSettings?.site_name || 'SiWiFy.com';
    let biz: any = null;

    if (isId) {
      const [bizById] = await safeQuery<any>(
        `SELECT b.*, t.features as tier_features, mt.settings as template_features, mt.components as template_components
         FROM businesses b
         LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id
         LEFT JOIN minisite_templates mt ON b.template_id = mt.id
         WHERE b.id = ?`,
        [slug]
      );
      if (bizById?.slug) redirect(`/${bizById.slug}/${section}`);
    } else {
      const [row] = await safeQuery<any>(
        `SELECT b.*, t.features as tier_features, mt.settings as template_features, mt.components as template_components
         FROM businesses b
         LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id
         LEFT JOIN minisite_templates mt ON b.template_id = mt.id
         WHERE b.slug = ? OR (b.custom_domain = ? AND b.custom_domain_verified = 1) OR LOWER(REPLACE(TRIM(b.name), ' ', '-')) = ?`,
        [slug, slug, slug]
      );
      biz = row ?? null;
    }

    if (biz) {
      try {
        const [serviceControl] = await safeQuery<any>(
          'SELECT minisite_status as service_minisite_status, services_expires_at as service_expires_at FROM vendor_service_controls WHERE business_id = ?',
          [biz.id]
        );
        Object.assign(biz, serviceControl || {});
      } catch {}

      biz.custom_data = normalizeCustomData(biz.custom_data);
      try { if (typeof biz.tier_features === 'string') biz.tier_features = JSON.parse(biz.tier_features); } catch {}
      try { if (typeof biz.template_features === 'string') biz.template_features = JSON.parse(biz.template_features); } catch {}
    }

    if (!biz) {
      redirect(`/${slug}`);
    }

    // Expiration check
    const isExpired = biz.is_master !== 1 && !biz.is_trusted && biz.minisite_visible_until && new Date(biz.minisite_visible_until) < new Date();
    if (isExpired) {
      redirect(`/${slug}`);
    }

    const serviceExpired = biz.service_expires_at && new Date(biz.service_expires_at) < new Date();
    if (biz.service_minisite_status === 'suspended' || biz.service_minisite_status === 'expired' || serviceExpired) {
      redirect(`/${slug}`);
    }

    // Fetch sections directly from DB by traversing the typology hierarchy
    let currentTypeId: string | null = biz.type_id;
    const collectedSectionIds = new Set<string>();

    while (currentTypeId) {
      const typeRows = await safeQuery<any>('SELECT id, name, parent_id, sections, own_sections FROM business_types WHERE id = ?', [currentTypeId]);
      if (typeRows && typeRows.length > 0) {
        const t = typeRows[0];
        const s1 = typeof t.sections === 'string' ? JSON.parse(t.sections || '[]') : t.sections || [];
        const s2 = typeof t.own_sections === 'string' ? JSON.parse(t.own_sections || '[]') : t.own_sections || [];
        (Array.isArray(s1) ? s1 : []).forEach((sid: string) => sid && collectedSectionIds.add(sid));
        (Array.isArray(s2) ? s2 : []).forEach((sid: string) => sid && collectedSectionIds.add(sid));
        currentTypeId = t.parent_id;
      } else {
        currentTypeId = null;
      }
    }

    let sectionIds: string[] = Array.from(collectedSectionIds);
    sectionIds = filterCoreSectionsForBusinessType(biz.type_id, sectionIds);

    if (sectionIds.length === 0) {
      const universalRows = await safeQuery<any>('SELECT id FROM sections WHERE is_universal = 1 AND (show_on_public = 1 OR show_on_public = TRUE) ORDER BY sort_order ASC');
      sectionIds = (universalRows || []).map((r: any) => r.id);
    }

    let sections: any[] = [];
    if (sectionIds.length > 0) {
      const placeholders = sectionIds.map(() => '?').join(',');
      const rows = await safeQuery<any>(
        `SELECT * FROM sections WHERE (id IN (${placeholders}) OR is_universal = 1) AND (show_on_public = 1 OR show_on_public = TRUE) ORDER BY sort_order ASC`,
        sectionIds
      );
        
        const fieldDefs = await safeQuery<any>(
          `SELECT name, label, section_id, field_type, options, acl, required_feature FROM form_fields WHERE business_type_id IN (?, 'SECTION_TEMPLATE')`,
          [biz.type_id]
        );

        const galleryItems = await safeQuery<any>(
          `SELECT id, url, caption, is_hero, section_id, placement, show_on_main, show_on_minisite, approval_status 
           FROM vendor_gallery 
           WHERE business_id = ? AND approval_status = 'approved' AND show_on_minisite = 1`,
          [biz.id]
        );

        const blogPosts = await safeQuery<any>(
          `SELECT id, title, content, excerpt, section_id, show_on_main, show_on_minisite, status 
           FROM section_blogs 
           WHERE business_id = ? AND status = 'published' AND show_on_minisite = 1 
           ORDER BY published_at DESC`,
          [biz.id]
        );

        let tourProducts: any[] = [];
        try {
          tourProducts = await safeQuery<any>(
            `SELECT * FROM tour_products WHERE (vendor_business_id = ? OR vendor_business_id IS NULL) AND is_active = 1 ORDER BY is_featured DESC, created_at DESC`,
            [biz.id]
          );
        } catch {}

        sections = rows.map((s: any) => {
          const sFields = fieldDefs.filter((f: any) => f.section_id === s.id).map((f: any) => ({
            ...f,
            acl: (() => { try { return typeof f.acl === 'string' ? JSON.parse(f.acl) : f.acl || {}; } catch { return {}; } })()
          }));
          const sGallery = galleryItems.filter((g: any) => g.section_id === s.id);
          const sBlogs = blogPosts.filter((b: any) => b.section_id === s.id);
          const sTours = (s.id === 'sec_9_marketplace_catalog' || s.id === 'offers-packages' || s.id === 'package' || s.id === 'catalog') ? tourProducts : [];

          const rules = (() => {
            try {
              return typeof s.inheritance_rules === 'string' ? JSON.parse(s.inheritance_rules) : s.inheritance_rules || {};
            } catch { return {}; }
          })();
          const typologyRules = rules.typologies?.[biz.type_id] || {};
          
          const isRequiredOverride = typologyRules.required_override;
          const resolvedRequired = isRequiredOverride === 'required' ? true : (isRequiredOverride === 'optional' ? false : s.required !== 0);
          const orderLocked = !!typologyRules.order_locked;
          const resolvedCtaPhone = typologyRules.cta_phone || null;

          return {
            ...s,
            required: resolvedRequired,
            order_locked: orderLocked,
            cta_phone_override: resolvedCtaPhone,
            fields: sFields,
            gallery: sGallery,
            blogs: sBlogs,
            tourProducts: sTours
          };
        });
      }
    }

    const templateHidden = biz.template_features?.hidden_sections;
    const customHidden = biz.custom_data?.basic?.hidden_sections || biz.custom_data?.hidden_sections;

    const controlsResult = await safeQuery<any>(
      'SELECT section_id, custom_label, admin_hidden, cta_phone FROM business_section_controls WHERE business_id = ?',
      [biz.id]
    );
    const sectionControls: Record<string, any> = {};
    controlsResult.forEach(c => {
      sectionControls[c.section_id] = c;
    });

    sections = sections.map((s: any) => ({
      ...s,
      cta_phone: sectionControls[s.id]?.cta_phone || null,
    }));

    let sectionComponents: Record<string, any[]> = {};
    if (sectionIds.length > 0) {
      let componentRows: any[] = [];
      try {
        componentRows = await safeQuery<any>(
          `SELECT sc.id as component_id, sc.section_id, sc.component_type, sc.label as component_label, sc.config,
                  scd.id as data_id, scd.data as data_json, scd.status as data_status, scd.title as data_title, scd.display_order as data_display_order,
                  vs.id as service_id, vs.category as service_category, vs.service_type, vs.title as service_title,
                  vs.description as service_description, vs.price as service_price, vs.currency as service_currency,
                  vs.price_unit as service_price_unit, vs.capacity as service_capacity, vs.availability as service_availability
           FROM section_components sc
           LEFT JOIN section_component_data scd ON sc.id = scd.section_component_id AND scd.business_id = ? AND scd.status = 'published'
           LEFT JOIN vendor_services vs ON vs.source_component_data_id = scd.id
             AND vs.approval_status = 'published'
             AND JSON_CONTAINS(vs.audience_scopes, JSON_QUOTE('public'), '$')
             AND JSON_CONTAINS(vs.placements, JSON_QUOTE('minisite'), '$')
           WHERE sc.section_id IN (${sectionIds.map(() => '?').join(',')})
             AND (sc.component_type <> 'service_catalog' OR vs.id IS NOT NULL)
           ORDER BY sc.section_id, sc.display_order, scd.display_order`,
          [biz.id, ...sectionIds]
        );
      } catch (componentError: any) {
        console.warn('[MINISITE COMPONENTS SKIPPED]', componentError?.message);
      }

      const componentMap: Record<string, any> = {};
      componentRows.forEach((row: any) => {
        if (!componentMap[row.component_id]) {
          let config = {};
          try {
            config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config || {};
          } catch { config = {}; }

          componentMap[row.component_id] = {
            id: row.component_id,
            sectionId: row.section_id,
            type: row.component_type,
            label: row.component_label,
            config,
            instances: [] as any[]
          };
        }

        if (row.data_id) {
          componentMap[row.component_id].instances.push({
            id: row.data_id,
            title: row.data_title,
            status: row.data_status,
            data: row.component_type === 'service_catalog' && row.service_id
              ? {
                  category: row.service_category,
                  service_type: row.service_type,
                  title: row.service_title,
                  description: row.service_description,
                  price: row.service_price,
                  currency: row.service_currency,
                  price_unit: row.service_price_unit,
                  capacity: row.service_capacity,
                  availability: row.service_availability,
                }
              : JSON.parse(row.data_json || '{}')
          });
        }
      });

      Object.values(componentMap).forEach((component: any) => {
        if (!sectionComponents[component.sectionId]) {
          sectionComponents[component.sectionId] = [];
        }
        sectionComponents[component.sectionId].push(...component.instances.map((instance: any, index: number) => ({
          id: `${component.id}-${instance.id || index}`,
          type: component.type,
          props: instance.data || {},
          label: component.label,
          title: instance.title || undefined
        })));
      });
    }

    const seenSectionIds = new Set<string>();
    sections = sections.filter((s: any) => {
      if (!s || !s.id || seenSectionIds.has(s.id)) return false;
      const sectionOptions = (() => {
        try { return typeof s.options === 'string' ? JSON.parse(s.options) : s.options || {}; } catch { return {}; }
      })();
      if (Array.isArray(sectionOptions.placements) && !sectionOptions.placements.includes('body')) return false;
      if (isSectionHidden(s.id, biz.custom_data, sectionControls[s.id], Array.isArray(templateHidden) ? templateHidden : [])) return false;
      if (Array.isArray(customHidden) && customHidden.includes(s.id)) return false;
      if (!isSectionApprovedForMinisite(s.id, biz.custom_data, sectionControls[s.id])) return false;

      seenSectionIds.add(s.id);
      return true;
    });

    const publishedManifest = await getPublishedManifest(biz.id);
    if (publishedManifest) {
      const manifestSections = new Map(publishedManifest.sections.map(sec => [sec.id, sec]));
      sections = sections
        .filter((sec: any) => manifestSections.get(sec.id)?.enabled !== false)
        .map((sec: any) => {
          const manifestSection = manifestSections.get(sec.id);
          return manifestSection
            ? { ...sec, manifestContent: manifestSection.content, manifestComponents: manifestSection.components }
            : sec;
        })
        .sort((left: any, right: any) => (manifestSections.get(left.id)?.order ?? 9999) - (manifestSections.get(right.id)?.order ?? 9999));

      publishedManifest.sections.forEach(sec => {
        if (sec.content && typeof sec.content === 'object') {
          biz.custom_data[sec.id] = sec.content;
        }
        if (sec.components?.length) {
          sectionComponents[sec.id] = sec.components;
        }
      });
    }

    const templatePlan = normalizeMinisiteTemplate(
      biz.template_id,
      biz.template_components,
      sections.map((sec: any) => sec.id)
    );

    const legacyLabels = biz.custom_data?.section_labels || biz.custom_data?.basic?.section_labels || {};
    const arabicLabels = biz.custom_data?.section_labels_ar || biz.custom_data?.basic?.section_labels_ar || {};
    const finalLabels: Record<string, string> = {};
    const finalLabelsAr: Record<string, string> = {};
    sections.forEach((s: any) => {
      const label = getEffectiveSectionLabel(s.id, s.name, { ...biz.custom_data, section_labels: legacyLabels, section_labels_ar: arabicLabels }, sectionControls[s.id]);
      finalLabels[s.id] = label;
      const arLabel = getEffectiveSectionLabel(s.id, s.name, { ...biz.custom_data, section_labels: arabicLabels }, sectionControls[s.id]);
      if (arLabel) {
        finalLabelsAr[s.id] = arLabel;
      }
    });

    // Tier-level section access control
    const tierRanks: Record<string, number> = { free: 0, basic: 1, pro: 2, premium: 3, enterprise: 4 };
    const currentBizTier = String(biz.subscription_tier || 'free').toLowerCase();
    const currentBizRank = tierRanks[currentBizTier] ?? 0;
    const isMasterOrTrusted = biz.is_master === 1 || biz.is_trusted === 1;

    const lockedSections: string[] = [];
    sections.forEach((s: any) => {
      if (s.required_tier && !isMasterOrTrusted) {
        const reqTier = String(s.required_tier).toLowerCase();
        const reqRank = tierRanks[reqTier] ?? 1;
        if (currentBizRank < reqRank) {
          lockedSections.push(s.id);
        }
      }
    });

    return (
      <VanityBusinessClient 
        slug={slug} 
        initialData={biz} 
        sections={sections} 
        sectionLabels={finalLabels} 
        sectionLabelsAr={finalLabelsAr} 
        sectionComponents={sectionComponents} 
        templatePlan={templatePlan} 
        isMasterTemplate={biz.is_master === 1} 
        isTrusted={biz.is_trusted === 1} 
        siteSettings={siteSettings}
        initialActiveTab={section}
        lockedSections={lockedSections}
      />
    );
  } catch (e: any) {
    console.error('[MINISITE SECTION ERROR]', slug, section, e?.message);
    redirect(`/${slug}`);
  }
}
