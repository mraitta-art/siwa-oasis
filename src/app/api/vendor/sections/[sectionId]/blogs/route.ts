import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: Request,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;

    const query = `
      SELECT id, title, excerpt, status, created_at, published_at
      FROM section_blogs
      WHERE section_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const blogs = await db.query(query, [sectionId]);
    return Response.json(blogs || []);
  } catch (error) {
    console.error('Get blogs error:', error);
    return Response.json({ error: 'Failed to load blogs' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;
    const { title, content, excerpt } = await request.json();

    if (!title || !content) {
      return Response.json({ error: 'Title and content required' }, { status: 400 });
    }

    const id = uuidv4();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check section curation policy
    const sectionQuery = `SELECT curation_policy, auto_publish_blogs FROM sections WHERE id = ?`;
    const sectionRes = await db.query(sectionQuery, [sectionId]);
    
    if (!sectionRes || sectionRes.length === 0) {
      return Response.json({ error: 'Section not found' }, { status: 404 });
    }

    const section = sectionRes[0];
    const status = section.auto_publish_blogs ? 'published' : 'pending_approval';
    const publishedAt = section.auto_publish_blogs ? new Date() : null;

    const insertQuery = `
      INSERT INTO section_blogs (
        id, section_id, title, slug, content, excerpt,
        status, published_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      id,
      sectionId,
      title,
      slug,
      content,
      excerpt || content.substring(0, 160),
      status,
      publishedAt
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
