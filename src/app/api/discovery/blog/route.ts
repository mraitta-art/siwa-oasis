import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Fetch all business DNA mini-blogs
    const businesses = await query(`
      SELECT id, name, type_id, custom_data, updated_at
      FROM businesses 
      WHERE status = 'active'
      ORDER BY updated_at DESC
    `);

    const posts: any[] = [];

    businesses.forEach((biz: any) => {
      const data = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data;
      
      Object.keys(data || {}).forEach(sid => {
        const section = data[sid] || {};
        
        // If a section has a mini-blog story, treat it as a blog post
        if (section.mini_blog && section.mini_blog.length > 50) {
          const photos = section.section_gallery || [];
          
          posts.push({
            id: `post_${biz.id}_${sid}`,
            businessId: biz.id,
            businessName: biz.name,
            sectionName: sid.toUpperCase().replace('_DNA', '').replace('_', ' '),
            title: section.blog_title || `${biz.name}: ${sid.replace('_dna', '')}`,
            excerpt: section.mini_blog.substring(0, 150) + '...',
            content: section.mini_blog,
            image: photos[0]?.url || photos[0] || 'https://images.unsplash.com/photo-1505881502353-a1986add373c?q=80&w=800',
            date: biz.updated_at,
            slug: `/business/${biz.id}#${sid}`
          });
        }
      });
    });

    // Sort by date and limit
    const sortedPosts = posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);

    return NextResponse.json({ posts: sortedPosts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
