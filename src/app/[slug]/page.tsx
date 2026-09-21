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
 * SERVER-SIDE SEO ENGINE & REDIRECT HANDLER
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    // Check if it's a UUID (36 chars with dashes)
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    let biz: any = null;
    if (isId) {
      // Fetch by ID to get the slug for redirection
      const [bizById] = await safeQuery<any>(
        `SELECT b.*, (SELECT p.phone FROM profiles p WHERE p.business_id = b.id AND p.role = 'vendor' AND p.phone IS NOT NULL AND p.phone <> '' LIMIT 1) as vendor_phone,
          t.features as tier_features, mt.settings as template_features
         FROM businesses b
         LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id
         LEFT JOIN minisite_templates mt ON b.template_id = mt.id
         WHERE b.id = ?`,
        [slug]
      );
      if (bizById && bizById.slug) {
        return { title: `Redirecting to ${bizById.name || 'Business'}...` };
      }
    } else {
      // Fetch by slug directly from DB (avoids SSR self-fetch issues)
      const [row] = await safeQuery<any>(
        `SELECT b.*, (SELECT p.phone FROM profiles p WHERE p.business_id = b.id AND p.role = 'vendor' AND p.phone IS NOT NULL AND p.phone <> '' LIMIT 1) as vendor_phone,
          t.features as tier_features, mt.settings as template_features
         FROM businesses b
         LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id
         LEFT JOIN minisite_templates mt ON b.template_id = mt.id
         WHERE b.slug = ? OR (b.custom_domain = ? AND b.custom_domain_verified = 1) OR LOWER(REPLACE(TRIM(b.name), ' ', '-')) = ?`,
        [slug, slug, slug]
      );
      biz = row ?? null;
    }

    if (!biz) return { title: 'Business Not Found - SiWiFy.com' };

    // Robust JSON Parsing & Normalization
    if (biz) {
      biz.custom_data = normalizeCustomData(biz.custom_data);
    }
    try { if (typeof biz.tier_features === 'string') biz.tier_features = JSON.parse(biz.tier_features); } catch {}
    try { if (typeof biz.template_features === 'string') biz.template_features = JSON.parse(biz.template_features); } catch {}

    const data = biz.custom_data || {};
    const identity = data.basic || data.sec_1_identity || data.business_info || {};
    const vibe = data.vibe || data.sec_3_services || {};
    
    const description = identity.description || identity.section_blog 
      ? (identity.description || identity.section_blog).substring(0, 160).replace(/<[^>]*>/g, '') 
      : `Discover the unique ${biz.name} experience in Siwa Oasis.`;

    const logoUrl = identity.business_logo || identity.logo || data.business_info?.business_logo || data.business_info?.logo;
    const ogImage = logoUrl || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62';

    return {
      title: `${biz.name} | Siwa Oasis Official Registry`,
      description: description,
      openGraph: {
        title: biz.name,
        description: description,
        type: 'website',
        url: `https://siwify.com/${slug}`,
        images: [{ url: ogImage, width: 1200, height: 630 }]
      }
    };
  } catch (e) {
    return { title: 'SiWiFy.com Minisite' };
  }
}

/**
 * VANITY URL MINISITE PAGE (Server Component)
 */
export default async function VanityBusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Check if it's a UUID (36 chars with dashes)
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
      // It's a UUID — fetch by ID and redirect to slug
      const [bizById] = await safeQuery<any>(
        `SELECT b.*, t.features as tier_features, mt.settings as template_features, mt.components as template_components
         FROM businesses b
         LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id
         LEFT JOIN minisite_templates mt ON b.template_id = mt.id
         WHERE b.id = ?`,
        [slug]
      );
      if (bizById?.slug) redirect(`/${bizById.slug}`);
    } else {
      // Fetch by slug directly from DB (avoids SSR self-fetch issues)
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

    // Service controls are optional until the local service migration is applied.
    if (biz) {
      try {
        const [serviceControl] = await safeQuery<any>(
          'SELECT minisite_status as service_minisite_status, services_expires_at as service_expires_at FROM vendor_service_controls WHERE business_id = ?',
          [biz.id]
        );
        Object.assign(biz, serviceControl || {});
      } catch {
        // Keep existing minisites available while older databases are migrated.
      }
    }

    // Parse & Normalize JSON fields
    if (biz) {
      biz.custom_data = normalizeCustomData(biz.custom_data);
      try { if (typeof biz.tier_features === 'string') biz.tier_features = JSON.parse(biz.tier_features); } catch {}
      try { if (typeof biz.template_features === 'string') biz.template_features = JSON.parse(biz.template_features); } catch {}
    }

    // Expiration check: 30 days trial/temporary visibility window for unverified vendors
    if (biz) {
      const isExpired = biz.is_master !== 1 && !biz.is_trusted && biz.minisite_visible_until && new Date(biz.minisite_visible_until) < new Date();
      if (isExpired) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)', color: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ maxWidth: '540px', width: '100%', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '24px', padding: '3rem 2rem', textAlign: 'center', backdropFilter: 'blur(12px)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                <i className="fas fa-lock" style={{ color: '#D4AF37', fontSize: '2rem' }} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc', marginBottom: '1rem', letterSpacing: '-0.5px' }}>
                Listing Under Verification
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                To ensure registry authenticity, <strong style={{ color: '#D4AF37' }}>{biz.name}</strong> is temporarily offline.
                If you are the business owner, please log into your dashboard and complete your identity & authority verification.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.8rem 1.5rem', background: 'linear-gradient(135deg, #D4AF37, #f59e0b)', color: '#1a1000', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem', textDecoration: 'none', boxShadow: '0 4px 14px rgba(212,175,55,0.25)', transition: 'transform 0.2s' }}>
                  Owner Login
                </Link>
                <Link href="/" style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
                  Back to {platformName} Registry
                </Link>
              </div>
            </div>
          </div>
        );
      }
    }

    if (!biz) {
      // Check if a custom landing page exists in website_configs (saved as website_[slug])
      const [customPage] = await safeQuery<any>(
        'SELECT type FROM website_configs WHERE type = ? LIMIT 1',
        [`website_${slug}`]
      );
      if (customPage) {
        redirect(`/p/${slug}`);
      }

      return (
        <div style={{ textAlign: 'center', padding: '10rem 2rem', background: '#0f172a', height: '100vh', color: '#fff' }}>
          <h1 style={{ fontWeight: 900, color: '#D4AF37', fontSize: '4rem' }}>404</h1>
          <p style={{ opacity: 0.5 }}>The business &quot;{slug}&quot; was not found in our registry.</p>
          <Link href="/" style={{ color: '#D4AF37', marginTop: '2rem', display: 'inline-block' }}>Return to {platformName}</Link>
        </div>
      );
    }

    const serviceExpired = biz.service_expires_at && new Date(biz.service_expires_at) < new Date();
    if (biz.service_minisite_status === 'suspended' || biz.service_minisite_status === 'expired' || serviceExpired) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#0f172a', color: '#fff', textAlign: 'center' }}>
          <div>
            <i className="fas fa-pause-circle" style={{ color: '#f0c842', fontSize: '3rem', marginBottom: '1rem' }} />
            <h1 style={{ margin: '0 0 0.75rem' }}>Minisite temporarily unavailable</h1>
            <p style={{ color: '#cbd5e1' }}>This listing is currently being reviewed or its service is inactive.</p>
          </div>
        </div>
      );
    }

    // Fetch sections directly from DB
    const [typeData] = await safeQuery<any>('SELECT sections, own_sections FROM business_types WHERE id = ?', [biz.type_id]);
    let sections: any[] = [];
    let sectionIds: string[] = [];

    if (typeData) {
      sectionIds = [
        ...(typeof typeData.sections === 'string' ? JSON.parse(typeData.sections || '[]') : typeData.sections || []),
        ...(typeof typeData.own_sections === 'string' ? JSON.parse(typeData.own_sections || '[]') : typeData.own_sections || [])
      ];
      sectionIds = filterCoreSectionsForBusinessType(biz.type_id, sectionIds);

      if (sectionIds.length > 0) {
        const placeholders = sectionIds.map(() => '?').join(',');
        const rows = await safeQuery<any>(
          `SELECT * FROM sections WHERE (id IN (${placeholders}) OR is_universal = 1) AND (show_on_public = 1 OR show_on_public = TRUE) ORDER BY sort_order ASC`,
          sectionIds
        );
        
        // Fetch field metadata definitions to display user-friendly labels on minisite
        const fieldDefs = await safeQuery<any>(
          `SELECT name, label, section_id, field_type, options, acl, required_feature FROM form_fields WHERE business_type_id IN (?, 'SECTION_TEMPLATE')`,
          [biz.type_id]
        );

        // Fetch approved vendor gallery items
        const galleryItems = await safeQuery<any>(
          `SELECT id, url, caption, is_hero, section_id, placement, show_on_main, show_on_minisite, approval_status 
           FROM vendor_gallery 
           WHERE business_id = ? AND approval_status = 'approved' AND show_on_minisite = 1`,
          [biz.id]
        );

        // Fetch published section blog posts
        const blogPosts = await safeQuery<any>(
          `SELECT id, title, content, excerpt, section_id, show_on_main, show_on_minisite, status 
           FROM section_blogs 
           WHERE business_id = ? AND status = 'published' AND show_on_minisite = 1 
           ORDER BY published_at DESC`,
          [biz.id]
        );

        // Fetch active tour products / packages for travel operators & marketplace catalog
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

          // Resolve Typology-Level Overrides for this specific business typology (biz.type_id)
          const rules = (() => {
            try {
              return typeof s.inheritance_rules === 'string'
                ? JSON.parse(s.inheritance_rules)
                : s.inheritance_rules || {};
            } catch {
              return {};
            }
          })();
          const typologyRules = rules.typologies?.[biz.type_id] || {};
          
          // Resolve required override
          const isRequiredOverride = typologyRules.required_override;
          const resolvedRequired = isRequiredOverride === 'required'
            ? true
            : (isRequiredOverride === 'optional' ? false : s.required !== 0);

          // Resolve order locked
          const orderLocked = !!typologyRules.order_locked;

          // Resolve CTA phone override
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

    // --- MULTI-LAYERED SECTION GOVERNANCE ---
    const templateHidden = biz.template_features?.hidden_sections;
    const customHidden = biz.custom_data?.basic?.hidden_sections || biz.custom_data?.hidden_sections;

    // Fetch Admin Overrides & Custom Labels for this business
    const controlsResult = await safeQuery<any>(
      'SELECT section_id, custom_label, admin_hidden, cta_phone FROM business_section_controls WHERE business_id = ?',
      [biz.id]
    );
    const sectionControls: Record<string, any> = {};
    controlsResult.forEach(c => {
      sectionControls[c.section_id] = c;
    });

    // Embed cta_phone into sections so VanityBusinessClient can use it
    sections = sections.map((s: any) => ({
      ...s,
      cta_phone: sectionControls[s.id]?.cta_phone || null,
    }));

    let sectionComponents: Record<string, any[]> = {};
    if (sectionIds.length > 0) {
      // Component data is optional, but we need it before visibility filtering so dynamic
      // section blocks are not skipped due to TDZ / initialization order issues.
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
          } catch {
            config = {};
          }

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

      // New canonical services are not tied to the legacy repeatable component
      // editor. Add approved public minisite services to the same section feed.
      if (sectionIds.includes('sec_9_marketplace_catalog')) {
        const canonicalServices = await safeQuery<any>(
          `SELECT id, category, title, description, price, currency, price_unit, capacity, availability, attributes
           FROM vendor_services
           WHERE business_id = ? AND approval_status = 'published'
             AND JSON_CONTAINS(audience_scopes, JSON_QUOTE('public'), '$')
             AND JSON_CONTAINS(placements, JSON_QUOTE('minisite'), '$')
             AND (valid_from IS NULL OR valid_from <= CURRENT_DATE())
             AND (valid_until IS NULL OR valid_until >= CURRENT_DATE())
           ORDER BY updated_at DESC`,
          [biz.id]
        );
        if (canonicalServices.length > 0) {
          sectionComponents.sec_9_marketplace_catalog = [
            ...(sectionComponents.sec_9_marketplace_catalog || []),
            ...canonicalServices.map((service: any) => ({
              id: `canonical-service-${service.id}`,
              type: 'service_catalog',
              label: 'Services & Facilities',
              props: {
                category: service.category,
                title: service.title,
                description: service.description,
                price: service.price,
                currency: service.currency,
                price_unit: service.price_unit,
                capacity: service.capacity,
                availability: service.availability,
                ...(typeof service.attributes === 'string' ? JSON.parse(service.attributes || '{}') : service.attributes || {}),
              },
            })),
          ];
        }
      }
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
      const manifestSections = new Map(publishedManifest.sections.map(section => [section.id, section]));
      sections = sections
        .filter((section: any) => manifestSections.get(section.id)?.enabled !== false)
        .map((section: any) => {
          const manifestSection = manifestSections.get(section.id);
          return manifestSection
            ? { ...section, manifestContent: manifestSection.content, manifestComponents: manifestSection.components }
            : section;
        })
        .sort((left: any, right: any) => (manifestSections.get(left.id)?.order ?? 9999) - (manifestSections.get(right.id)?.order ?? 9999));

      publishedManifest.sections.forEach(section => {
        if (section.content && typeof section.content === 'object') {
          biz.custom_data[section.id] = section.content;
        }
        if (section.components?.length) {
          sectionComponents[section.id] = section.components;
        }
      });
    }

    const templatePlan = normalizeMinisiteTemplate(
      biz.template_id,
      biz.template_components,
      sections.map((section: any) => section.id)
    );

    // Build the final labels mapping using a single precedence rule across all sources.
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

    return <VanityBusinessClient slug={slug} initialData={biz} sections={sections} sectionLabels={finalLabels} sectionLabelsAr={finalLabelsAr} sectionComponents={sectionComponents} templatePlan={templatePlan} isMasterTemplate={biz.is_master === 1} isTrusted={biz.is_trusted === 1} siteSettings={siteSettings} />;
  } catch (e: any) {
    console.error('[MINISITE ERROR]', slug, e?.message, e?.stack);
    return (
      <div style={{ textAlign: 'center', padding: '10rem 2rem', background: '#0f172a', height: '100vh', color: '#fff' }}>
        <h1 style={{ fontWeight: 900, color: '#D4AF37', fontSize: '2rem' }}>Something went wrong</h1>
        <p style={{ opacity: 0.5 }}>{e?.message || 'Unknown error loading minisite'}</p>
        <Link href="/" style={{ color: '#D4AF37', marginTop: '2rem', display: 'inline-block' }}>Return Home</Link>
      </div>
    );
  }
}
