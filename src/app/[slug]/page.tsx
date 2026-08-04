import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import VanityBusinessClient from '@/components/VanityBusinessClient';
import { query as safeQuery } from '@/lib/db';

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
        `SELECT b.*, t.features as tier_features, mt.settings as template_features
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
        `SELECT b.*, t.features as tier_features, mt.settings as template_features
         FROM businesses b
         LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id
         LEFT JOIN minisite_templates mt ON b.template_id = mt.id
         WHERE b.slug = ?`,
        [slug]
      );
      biz = row ?? null;
    }

    if (!biz) return { title: 'Business Not Found - Siwa Today' };

    // Robust JSON Parsing
    try { if (typeof biz.custom_data === 'string') biz.custom_data = JSON.parse(biz.custom_data); } catch {}
    try { if (typeof biz.tier_features === 'string') biz.tier_features = JSON.parse(biz.tier_features); } catch {}
    try { if (typeof biz.template_features === 'string') biz.template_features = JSON.parse(biz.template_features); } catch {}

    const data = biz.custom_data || {};
    const identity = data.sec_1_identity || {};
    const vibe = data.sec_3_services || {};
    
    const description = identity.section_blog 
      ? identity.section_blog.substring(0, 160).replace(/<[^>]*>/g, '') 
      : `Discover the unique ${biz.name} experience in Siwa Oasis. ${vibe.view_types?.join(', ') || ''}`;

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

    // Parse JSON fields
    if (biz) {
      try { if (typeof biz.custom_data === 'string') biz.custom_data = JSON.parse(biz.custom_data); } catch {}
      try { if (typeof biz.tier_features === 'string') biz.tier_features = JSON.parse(biz.tier_features); } catch {}
      try { if (typeof biz.template_features === 'string') biz.template_features = JSON.parse(biz.template_features); } catch {}
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

    if (typeData) {
      const sectionIds = [
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
          `SELECT name, label, section_id FROM form_fields WHERE business_type_id IN (?, 'SECTION_TEMPLATE')`,
          [biz.type_id]
        );

        sections = rows.map((s: any) => {
          const sFields = fieldDefs.filter((f: any) => f.section_id === s.id);
          return {
            ...s,
            fields: sFields
          };
        });
      }
    }

    // --- MULTI-LAYERED SECTION GOVERNANCE ---
    const tierAllowed = biz.tier_features?.allowed_public_sections;
    const templateHidden = biz.template_features?.hidden_sections;
    const customHidden = biz.custom_data?.basic?.hidden_sections || biz.custom_data?.hidden_sections;

    // Fetch Admin Overrides & Custom Labels for this business
    const controlsResult = await safeQuery<any>(
      'SELECT section_id, custom_label, admin_hidden FROM business_section_controls WHERE business_id = ?',
      [biz.id]
    );
    const sectionControls: Record<string, any> = {};
    controlsResult.forEach(c => {
      sectionControls[c.section_id] = c;
    });

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

    return <VanityBusinessClient slug={slug} initialData={biz} sections={sections} sectionLabels={finalLabels} isMasterTemplate={biz.is_master === 1} />;
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
