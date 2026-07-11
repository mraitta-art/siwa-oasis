import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.businessId) {
      return Response.json({ error: 'No business linked to this account' }, { status: 404 });
    }

    const { sectionId } = await params;

    const query = `
      SELECT id, title, excerpt, status, show_on_main, show_on_minisite, created_at, published_at
      FROM section_blogs
      WHERE section_id = ? AND business_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const [blogs] = await db.query(query, [sectionId, user.businessId]);
    return Response.json(blogs || []);
  } catch (error) {
    console.error('Get blogs error:', error);
    return Response.json({ error: 'Failed to load blogs' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.businessId) {
      return Response.json({ error: 'No business linked to this account' }, { status: 404 });
    }

    const { sectionId } = await params;
    const { title, content, excerpt, show_on_main, show_on_minisite } = await request.json();

    if (!title || !content) {
      return Response.json({ error: 'Title and content required' }, { status: 400 });
    }

    const id = uuidv4();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4); // Add unique suffix to prevent duplicate slug errors

    // Check section curation policy
    const sectionQuery = `SELECT curation_policy, auto_publish_blogs FROM sections WHERE id = ?`;
    const [rows] = await db.query(sectionQuery, [sectionId]);
    const section = (rows as any[])?.[0];
    
    if (!section) {
      return Response.json({ error: 'Section not found' }, { status: 404 });
    }

    const status = section.auto_publish_blogs ? 'published' : 'pending_approval';
    const publishedAt = section.auto_publish_blogs ? new Date() : null;

    const insertQuery = `
      INSERT INTO section_blogs (
        id, section_id, business_id, vendor_id, title, slug, content, excerpt,
        status, published_at, show_on_main, show_on_minisite, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      id,
      sectionId,
      user.businessId,
      user.id,
      title,
      slug,
      content,
      excerpt || content.substring(0, 160),
      status,
      publishedAt,
      show_on_main !== false,
      show_on_minisite !== false
    ];

    await db.query(insertQuery, values);

    return Response.json({
      id,
      status,
      message: status === 'published' ? '✅ Published!' : '⏳ Submitted for approval'
    });
  } catch (error) {
    console.error('Create blog error:', error);
    return Response.json({ error: 'Failed to create blog' }, { status: 500 });
  }
}
