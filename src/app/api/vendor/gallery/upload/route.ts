import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sectionId = formData.get('sectionId') as string;
    const caption = formData.get('caption') as string;

    if (!file || !sectionId) {
      return Response.json({ error: 'Missing file or section' }, { status: 400 });
    }

    // In production, upload to: AWS S3, Cloudinary, or similar
    // For now, we'll create a placeholder URL and store metadata
    const fileName = `${Date.now()}-${file.name}`;
    const fileUrl = `/uploads/vendor/${user.id}/${fileName}`;

    // Store in database
    const query = `
      INSERT INTO vendor_gallery 
      (id, vendor_id, section_id, url, caption, file_size, mime_type, is_hero, created_at)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, FALSE, NOW())
    `;

    await db.query(query, [
      user.id,
      sectionId,
      fileUrl,
      caption || file.name,
      file.size,
      file.type
    ]);

    return Response.json({ success: true, url: fileUrl }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
