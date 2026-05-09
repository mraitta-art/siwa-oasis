import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import VanityBusinessClient from '@/components/VanityBusinessClient';

/**
 * SERVER-SIDE SEO ENGINE & REDIRECT HANDLER
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    // Check if it's a UUID (36 chars with dashes)
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    let url = `${process.env.NEXT_PUBLIC_APP_URL}/api/businesses/by-slug/${slug}`;
    if (isId) {
       // Fetch by ID to get the slug for redirection (PUBLIC SAFE)
       const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/businesses/${slug}`);
       const biz = await res.json();
       if (biz && biz.slug) return { title: `Redirecting to ${biz.name}...` };
    }

    const bRes = await fetch(url);
    const biz = await bRes.json();
// ... (rest of the metadata logic remains similar)
    
    if (!biz || biz.error) return { title: 'Business Not Found - Siwa Today' };

    const data = biz.custom_data || {};
    const identity = data.sec_1_identity || {};
    const vibe = data.sec_3_services || {};
    
    const description = identity.section_blog 
      ? identity.section_blog.substring(0, 160).replace(/<[^>]*>/g, '') 
      : `Discover the unique ${biz.name} experience in Siwa Oasis. ${vibe.view_types?.join(', ') || ''}`;

    return {
      title: `${biz.name} | Siwa Oasis Official Registry`,
      description: description,
      openGraph: {
        title: biz.name,
        description: description,
        type: 'website',
        url: `https://siwa.today/${slug}`,
        images: [{ url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62', width: 1200, height: 630 }]
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
    let fetchUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/businesses/by-slug/${slug}`;
    
    if (isId) {
      // It's an ID — let's find the slug and redirect! (PUBLIC SAFE)
      const idRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/businesses/${slug}`, { cache: 'no-store' });
      const bizById = await idRes.json();
      if (bizById && bizById.slug) {
        redirect(`/${bizById.slug}`);
      }
    }

    const bRes = await fetch(fetchUrl, { cache: 'no-store' });
    const biz = await bRes.json();

    if (!biz || biz.error) {
       return (
        <div style={{ textAlign: 'center', padding: '10rem 2rem', background: '#0f172a', height: '100vh', color: '#fff' }}>
          <h1 style={{ fontWeight: 900, color: '#D4AF37', fontSize: '4rem' }}>404</h1>
          <p style={{ opacity: 0.5 }}>The business "{slug}" was not found in our registry.</p>
          <Link href="/" style={{ color: '#D4AF37', marginTop: '2rem', display: 'inline-block' }}>Return to Siwa Today</Link>
        </div>
      );
    }

    // Fetch sections server-side
    const sRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/jana/sections?type=${biz.type_id}`, { cache: 'no-store' });
    let sections = await sRes.json();

    // TIER-BASED FILTERING
    const allowed = biz.tier_features?.allowed_public_sections;
    if (allowed && Array.isArray(allowed)) {
       sections = sections.filter((s: any) => allowed.includes(s.id));
    }

    return <VanityBusinessClient slug={slug} initialData={biz} sections={sections} />;
  } catch (e) {
    return <div>Error loading minisite</div>;
  }
}
