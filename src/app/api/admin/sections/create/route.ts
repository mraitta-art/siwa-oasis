import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const {
      name,
      icon,
      description,
      has_miniblog,
      has_gallery,
      curation_policy,
      vendor_permissions,
      content_instructions,
      max_gallery_items,
      auto_publish_blogs,
      auto_publish_images,
    } = await request.json();

    if (!name || !name.trim()) {
      return Response.json({ error: 'Section name required' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date();

    const query = `
      INSERT INTO sections (
        id, name, icon, description,
        has_miniblog, miniblog_enabled,
        has_gallery, gallery_enabled,
        curation_policy, vendor_permissions,
        content_instructions, max_gallery_items,
        auto_publish_blogs, auto_publish_images,
        show_on_public, show_on_minisite,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id,
      name.trim(),
      icon || 'fa-layer-group',
      description || '',
      has_miniblog ? 1 : 0,
      has_miniblog ? 1 : 0,
      has_gallery ? 1 : 0,
      has_gallery ? 1 : 0,
      curation_policy || 'manual_review',
      JSON.stringify(vendor_permissions || {
        can_upload_images: true,
        can_write_blogs: true,
        can_edit_own: true
      }),
      content_instructions || '',
      max_gallery_items || 50,
      auto_publish_blogs ? 1 : 0,
      auto_publish_images ? 1 : 0,
      1, // show_on_public
      1, // show_on_minisite
      now
    ];

    await db.query(query, values);

    return Response.json({ id, success: true });
  } catch (error) {
    console.error('Create section error:', error);
    return Response.json({ error: 'Failed to create section' }, { status: 500 });
  }
}
