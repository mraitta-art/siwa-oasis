import { db, queryOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { saveUploadedBuffer } from '@/lib/media-storage';
import crypto from 'crypto';

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
    const showOnMain = formData.get('show_on_main') !== 'false';
    const showOnMinisite = formData.get('show_on_minisite') !== 'false';

    if (!file || !sectionId) {
      return Response.json({ error: 'Missing file or section' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    
    // Calculate file hash to detect duplicates
    const fileHash = crypto.createHash('md5').update(bytes).digest('hex');

    // Check if file with this hash already exists for this vendor
    try {
      const existing = await queryOne(
        `SELECT id, url FROM vendor_gallery WHERE vendor_id = ? AND file_hash = ? LIMIT 1`,
        [user.id, fileHash]
      );
      if (existing) {
        return Response.json({
          success: true,
          url: existing.url,
          isDuplicate: true,
          existingId: existing.id,
          message: 'This file already exists in your gallery. Returning existing URL.'
        }, { status: 200 });
      }
    } catch (hashErr: any) {
      console.log('[INFO] File hash check skipped:', hashErr.message);
    }

    const fileName = `${Date.now()}-${file.name}`;
    const { url: fileUrl } = saveUploadedBuffer(bytes, fileName, `vendor/${user.id}`);

    // Store in database with hash for duplicate detection.
    // If the `file_hash` column does not exist on the production schema,
    // fall back to inserting without it so uploads don't fail.
    const queryWithHash = `
      INSERT INTO vendor_gallery 
      (id, vendor_id, section_id, url, caption, file_size, mime_type, file_hash, is_hero, show_on_main, show_on_minisite, created_at)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, FALSE, ?, ?, NOW())
    `;

    try {
      await db.query(queryWithHash, [
        user.id,
        sectionId,
        fileUrl,
        caption || file.name,
        file.size,
        file.type,
        fileHash,
        showOnMain,
        showOnMinisite
      ]);
    } catch (insertErr: any) {
      console.log('[INFO] Insert with file_hash failed, retrying without file_hash:', insertErr.message);
      const queryWithoutHash = `
        INSERT INTO vendor_gallery 
        (id, vendor_id, section_id, url, caption, file_size, mime_type, is_hero, show_on_main, show_on_minisite, created_at)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, FALSE, ?, ?, NOW())
      `;
      await db.query(queryWithoutHash, [
        user.id,
        sectionId,
        fileUrl,
        caption || file.name,
        file.size,
        file.type,
        showOnMain,
        showOnMinisite
      ]);
    }

    return Response.json({ success: true, url: fileUrl, isDuplicate: false }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
