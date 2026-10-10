import { execute, query, queryStrict } from '@/lib/db';
import { MINISITE_LAYOUT_KEY } from '@/lib/minisite-layout';
import { listSiteBlogLocations } from '@/lib/site-blog-locations';

interface BusinessBlogData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
}

export interface BusinessSectionBlogConflict {
  id?: string;
  postId?: string;
  title: string;
  status: string;
  source: 'blog_post' | 'section_blog';
  content: string;
  excerpt: string;
  language: string;
}

export async function validateSiteBlogTarget(pagePath: string | null, status: string): Promise<string | null> {
  if (!pagePath) return 'Choose the main-site page where this blog should appear';
  const location = (await listSiteBlogLocations()).find(page => page.path === pagePath);
  if (!location) return 'The selected site page no longer exists. Choose an active page location';
  if (status === 'published' && !location.hasBlogBlock) {
    return `Add a Blog component to ${location.title} (${location.path}) before publishing posts there`;
  }
  return null;
}

export async function validateBusinessBlogTarget(
  businessId: string,
  targetType: 'business_minisite' | 'business_section',
  status: string,
): Promise<string | null> {
  const businesses = await queryStrict<{ slug: string | null }>(
    'SELECT slug FROM businesses WHERE id = ? LIMIT 1',
    [businessId],
  );
  const business = businesses[0];
  if (!business) return 'Target business not found';

  const layouts = await queryStrict<{ config: unknown }>(
    'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
    [MINISITE_LAYOUT_KEY(business.slug || '')],
  );
  let layoutConfig: Record<string, unknown> = {};
  const rawLayout = layouts[0]?.config;
  if (typeof rawLayout === 'string') {
    try {
      layoutConfig = JSON.parse(rawLayout) as Record<string, unknown>;
    } catch {
      throw new Error('Business minisite layout contains invalid JSON');
    }
  } else if (rawLayout && typeof rawLayout === 'object' && !Array.isArray(rawLayout)) {
    layoutConfig = rawLayout as Record<string, unknown>;
  }
  const components = Array.isArray(layoutConfig.components) ? layoutConfig.components : [];
  const isBuilder = components.length > 0;
  if (targetType === 'business_section' && isBuilder) {
    return 'Business Section Blog can only be used with a section-based minisite';
  }
  if (targetType === 'business_minisite') {
    if (!isBuilder) return 'Business Minisite blog feed can only be used with a custom-builder minisite';
    if (status === 'published' && !components.some(component =>
      component && typeof component === 'object' && (component as Record<string, unknown>).type === 'vendor_blog'
    )) {
      return 'Add a Vendor Blog block to the custom-builder minisite before publishing its business-wide blog feed';
    }
  }
  return null;
}

export async function findBusinessSectionBlogConflict(
  businessId: string,
  sectionId: string,
  language: string,
  excludePostId?: string,
  excludeSectionBlogId?: string,
): Promise<BusinessSectionBlogConflict | null> {
  const currentPost = excludePostId
    ? await queryStrict<{ title: string }>(
      `SELECT title FROM blog_posts
       WHERE id = ? AND target_type IN ('business_minisite', 'business_section')
         AND target_business_id = ? AND target_section_id = ? AND language = ?
       LIMIT 1`,
      [excludePostId, businessId, sectionId, language],
    )
    : [];
  const posts = await queryStrict<{ id: string | number; title: string; status: string; content: string; excerpt: string; language: string }>(
    `SELECT id, title, status, content, excerpt, language FROM blog_posts
     WHERE target_type IN ('business_minisite', 'business_section')
       AND target_business_id = ? AND target_section_id = ? AND language = ?
       AND (? IS NULL OR id <> ?)
     LIMIT 1`,
    [businessId, sectionId, language, excludePostId || null, excludePostId || null],
  );
  if (posts[0]) {
    return {
      postId: String(posts[0].id),
      title: posts[0].title,
      status: posts[0].status,
      source: 'blog_post',
      content: posts[0].content || '',
      excerpt: posts[0].excerpt || '',
      language: posts[0].language,
    };
  }

  const sectionBlogs = await queryStrict<{ id: string; title: string; status: string; content: string; excerpt: string; language: string }>(
    `SELECT id, title, status, content, excerpt, language FROM section_blogs
     WHERE business_id = ? AND section_id = ? AND language = ?
     LIMIT 20`,
    [businessId, sectionId, language],
  );
  const existingSectionBlog = sectionBlogs.find(
    blog => blog.id !== excludeSectionBlogId && (!currentPost[0] || blog.title !== currentPost[0].title),
  );
  return existingSectionBlog
    ? {
      id: existingSectionBlog.id,
      title: existingSectionBlog.title,
      status: existingSectionBlog.status,
      source: 'section_blog',
      content: existingSectionBlog.content || '',
      excerpt: existingSectionBlog.excerpt || '',
      language: existingSectionBlog.language,
    }
    : null;
}

export async function syncBusinessSectionBlogContent(
  businessId: string,
  sectionId: string,
  language: string,
  blog: Pick<BusinessBlogData, 'title' | 'content' | 'excerpt'>,
) {
  const businesses = await query<{ id: string; custom_data: unknown }>(
    'SELECT id, custom_data FROM businesses WHERE id = ? LIMIT 1',
    [businessId],
  );
  if (!businesses[0]) throw new Error('Target business not found');

  let customData: Record<string, any> = {};
  const currentData = businesses[0].custom_data;
  if (typeof currentData === 'string') {
    try {
      customData = JSON.parse(currentData);
    } catch {
      throw new Error('Target business has invalid custom section data');
    }
  } else if (currentData && typeof currentData === 'object' && !Array.isArray(currentData)) {
    customData = currentData as Record<string, any>;
  }

  const sectionData = customData[sectionId] && typeof customData[sectionId] === 'object'
    ? customData[sectionId]
    : {};
  const blogField = language === 'ar' ? 'section_blog_ar' : 'section_blog';
  const blogTitleField = language === 'ar' ? 'section_blog_title_ar' : 'section_blog_title';
  const excerptField = language === 'ar' ? 'description_ar' : 'description';
  customData[sectionId] = {
    ...sectionData,
    [blogField]: blog.content,
    [blogTitleField]: blog.title,
    ...(blog.excerpt ? { [excerptField]: blog.excerpt } : {}),
  };
  await execute('UPDATE businesses SET custom_data = ?, updated_at = NOW() WHERE id = ?', [
    JSON.stringify(customData),
    businessId,
  ]);
}

export async function publishBlogToBusiness(
  businessId: string,
  sectionId: string,
  postId: string | number,
  adminId: string,
  blog: BusinessBlogData,
  addToSectionContent: boolean,
  language: string,
) {
  if (addToSectionContent) {
    await syncBusinessSectionBlogContent(businessId, sectionId, language, blog);
  }

  const businessSuffix = String(businessId).replace(/[^a-z0-9]/gi, '').slice(0, 12);
  const sectionBlogSlug = `admin-blog-${postId}-${businessSuffix}`;
  const existing = await query<{ id: string }>(
    'SELECT id FROM section_blogs WHERE business_id = ? AND section_id = ? AND slug = ? LIMIT 1',
    [businessId, sectionId, sectionBlogSlug],
  );
  const values = [
    blog.title,
    blog.content,
    blog.excerpt || '',
    blog.featured_image || null,
    adminId,
  ];

  if (existing[0]) {
    await execute(
      `UPDATE section_blogs
       SET title = ?, content = ?, excerpt = ?, featured_image_url = ?,
           status = 'published', show_on_minisite = 1, published_at = NOW(),
           approved_by_admin = ?, language = ?, updated_at = NOW()
       WHERE id = ?`,
      [...values, language, existing[0].id],
    );
  } else {
    await execute(
      `INSERT INTO section_blogs
       (section_id, business_id, vendor_id, title, slug, content, excerpt, featured_image_url,
        status, show_on_minisite, approved_by_admin, language, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, ?, ?, NOW())`,
      [sectionId, businessId, adminId, blog.title, sectionBlogSlug, blog.content, blog.excerpt || '', blog.featured_image || null, adminId, language],
    );
  }
}
