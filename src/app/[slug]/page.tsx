import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import VanityBusinessClient from '@/components/VanityBusinessClient';
import { query as safeQuery, normalizeCustomData } from '@/lib/db';

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
         WHERE b.slug = ?`,
        [slug]
      );
      biz = row ?? null;
    }

    if (!biz) return { title: 'Business Not Found - Siwa Today' };

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
        url: `https://siwa.today/${slug}`,
        images: [{ url: ogImage, width: 1200, height: 630 }]
      }
    };
  } catch (e) {
    return { title: 'Siwa Today Minisite' };
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
    let biz: any = null;

    if (isId) {
      // It's a UUID — fetch by ID and redirect to slug
      const [bizById] = await safeQuery<any>(
        `SELECT b.*, t.features as tier_features, mt.settings as template_features
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
        `SELECT b.*, t.features as tier_features, mt.settings as template_features
         FROM businesses b
         LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id
         LEFT JOIN minisite_templates mt ON b.template_id = mt.id
         WHERE b.slug = ?`,
        [slug]
      );
      biz = row ?? null;
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
                  Back to Siwa Today Registry
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
          <Link href="/" style={{ color: '#D4AF37', marginTop: '2rem', display: 'inline-block' }}>Return to Siwa Today</Link>
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

        sections = rows.map((s: any) => {
          const sFields = fieldDefs.filter((f: any) => f.section_id === s.id).map((f: any) => ({
            ...f,
            acl: (() => { try { return typeof f.acl === 'string' ? JSON.parse(f.acl) : f.acl || {}; } catch { return {}; } })()
          }));
          const sGallery = galleryItems.filter((g: any) => g.section_id === s.id);
          const sBlogs = blogPosts.filter((b: any) => b.section_id === s.id);

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
            blogs: sBlogs
          };
        });
      }
    }

    // --- MULTI-LAYERED SECTION GOVERNANCE ---
    const tierAllowed = biz.tier_features?.allowedSections || biz.tier_features?.allowed_public_sections;
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

    sections = sections.filter((s: any) => {
      if (tierAllowed && Array.isArray(tierAllowed) && !tierAllowed.includes(s.id)) return false;
      if (templateHidden && Array.isArray(templateHidden) && templateHidden.includes(s.id)) return false;
      if (customHidden && Array.isArray(customHidden) && customHidden.includes(s.id)) return false;
      // Admin override forced hide
      if (sectionControls[s.id]?.admin_hidden === 1) return false;
      return true;
    });

    // Build the final labels mapping: custom_label > basic.section_labels > default
    const legacyLabels = biz.custom_data?.section_labels || biz.custom_data?.basic?.section_labels || {};
    const finalLabels: Record<string, string> = {};
    sections.forEach((s: any) => {
      const label = sectionControls[s.id]?.custom_label || legacyLabels[s.id] || s.name;
      finalLabels[s.id] = label;
    });

    let sectionComponents: Record<string, any[]> = {};
    if (sectionIds.length > 0) {
      // Component data is an optional enhancement. Older production databases
      // may not have migration 020 yet, so the base minisite must still render.
      let componentRows: any[] = [];
      try {
        componentRows = await safeQuery<any>(
          `SELECT sc.id as component_id, sc.section_id, sc.component_type, sc.label as component_label, sc.config,
                  scd.id as data_id, scd.data as data_json, scd.status as data_status, scd.title as data_title, scd.display_order as data_display_order
           FROM section_components sc
           LEFT JOIN section_component_data scd ON sc.id = scd.section_component_id AND scd.business_id = ?
           WHERE sc.section_id IN (${sectionIds.map(() => '?').join(',')})
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
            data: JSON.parse(row.data_json || '{}')
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

    return <VanityBusinessClient slug={slug} initialData={biz} sections={sections} sectionLabels={finalLabels} sectionComponents={sectionComponents} isMasterTemplate={biz.is_master === 1} isTrusted={biz.is_trusted === 1} />;
  } catch (e: any) {
    console.error('[MINISITE ERROR]', slug, e?.message, e?.stack);
    return (
      <div style={{ textAlign: 'center', padding: '10rem 2rem', background: '#0f172a', height: '100vh', color: '#fff' }}>
        <h1 style={{ fontWeight: 900, color: '#D4AF37', fontSize: '2rem' }}>Something went wrong</h1>
        <p style={{ opacity: 0.5 }}>{e?.message || 'Unknown error loading minisite'}</p>
        <Link href="/" style={{ color: '#D4AF37', marginTop: '2rem', display: 'inline-block' }}>Return to Siwa Today</Link>
      </div>
    );
  }
}
