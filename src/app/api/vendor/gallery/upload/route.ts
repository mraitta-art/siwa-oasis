import { db, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { safeMediaSegment, uploadToCloudinary } from '@/lib/media-storage';
import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

/**
 * "Try one" gate for video: the free period includes a single uploaded video,
 * so a second one is refused before anything is uploaded or billed. YouTube
 * embeds and photos stay open, which is what most vendors actually need.
 * Fails open — a lookup problem must never block an upload.
 */
async function videoAllowance(user: any): Promise<{ allowed: boolean; message?: string }> {
  try {
    const tierRow = await queryOne<any>(
      `SELECT t.features
         FROM businesses b
         LEFT JOIN subscription_tiers t ON t.id = b.subscription_tier
        WHERE b.id = ? LIMIT 1`,
      [user.businessId]
    );
    const features = typeof tierRow?.features === 'string' ? JSON.parse(tierRow.features) : tierRow?.features || {};
    const limit = Number(features?.max_videos);
    if (!Number.isFinite(limit) || limit <= 0) return { allowed: true };

    const countRow = await queryOne<any>(
      `SELECT COUNT(*) AS total FROM vendor_gallery
        WHERE vendor_id IN (SELECT id FROM profiles WHERE business_id = ?)
          AND mime_type LIKE 'video/%'`,
      [user.businessId]
    );
    if ((Number(countRow?.total) || 0) < limit) return { allowed: true };

    return {
      allowed: false,
      message: limit === 1
        ? 'Your free period includes one uploaded video. Delete it to try another, or use a YouTube embed instead — those are available too.'
        : `Your plan includes ${limit} uploaded videos. Delete one to add another.`,
    };
  } catch {
    return { allowed: true };
  }
}

// Auto-run column migration once
let columnsMigrated = false;
async function ensureColumns() {
  if (columnsMigrated) return;
  columnsMigrated = true;
  try {
    await db.query(`
      ALTER TABLE vendor_gallery
        ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(512) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS resource_type VARCHAR(20) DEFAULT 'image',
        ADD COLUMN IF NOT EXISTS cloudinary_data JSON DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64) DEFAULT NULL
    `);
  } catch (_) { /* columns may already exist — that's fine */ }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureColumns();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sectionId = formData.get('sectionId') as string;
    const caption = formData.get('caption') as string;
    // New vendor media belongs to the business minisite by default.
    // Public-main placement requires an explicit admin/vendor opt-in.
    const showOnMain = formData.get('show_on_main') === 'true';
    const showOnMinisite = formData.get('show_on_minisite') !== 'false';

    if (!file || !sectionId) {
      return Response.json({ error: 'Missing file or section' }, { status: 400 });
    }

    // Detect resource type from MIME
    const mime = file.type || '';
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
    ];
    if (!allowedTypes.includes(mime)) {
      return Response.json({ error: 'Invalid file type. Only images and videos are allowed.' }, { status: 400 });
    }
    const resourceType: 'image' | 'video' | 'raw' = mime.startsWith('video/')
      ? 'video'
      : mime.startsWith('image/')
        ? 'image'
        : 'raw';

    // ── Size limits (minimum tier) ──────────────────────────────────────────
    // Images: 10 MB  |  Videos: 50 MB  (upgrade plan to increase)
    const MAX_IMAGE_BYTES = 10 * 1024 * 1024;  // 10 MB
    const MAX_VIDEO_BYTES = 50 * 1024 * 1024;  // 50 MB
    const sizeLimit = resourceType === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > sizeLimit) {
      const limitMB = Math.round(sizeLimit / 1024 / 1024);
      return Response.json(
        { error: `File too large. ${resourceType === 'video' ? 'Video' : 'Image'} limit is ${limitMB}MB on your current plan. Upgrade to upload larger files.` },
        { status: 413 }
      );
    }

    if (resourceType === 'video') {
      const gate = await videoAllowance(user);
      if (!gate.allowed) {
        return Response.json({ error: gate.message, code: 'VIDEO_ALLOWANCE_EXCEEDED' }, { status: 409 });
      }
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Hash for duplicate detection
    const fileHash = crypto.createHash('md5').update(bytes).digest('hex');

    // Check duplicate
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
          message: 'This file already exists in your gallery.',
        });
      }
    } catch (_) {}

    // Upload to Cloudinary (or local fallback)
    const cloudFolder = `siwa-oasis/vendor/${safeMediaSegment(user.id, 'unknown')}/${safeMediaSegment(sectionId, 'general')}`;
    const result = await uploadToCloudinary(bytes, file.name, cloudFolder, resourceType);

    // Persist to vendor_gallery
    try {
      await db.query(
        `INSERT INTO vendor_gallery
          (id, vendor_id, section_id, url, caption, file_size, mime_type,
           file_hash, cloudinary_public_id, resource_type, cloudinary_data,
           is_hero, show_on_main, show_on_minisite, approval_status, created_at)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, ?, 'pending', NOW())`,
        [
          user.id, sectionId,
          result.secure_url,
          caption || file.name,
          file.size, mime,
          fileHash,
          result.public_id,
          result.resource_type,
          JSON.stringify(result.cloudinary_data),
          showOnMain, showOnMinisite,
        ]
      );
    } catch (insertErr: any) {
      // Fallback without new columns
      console.warn('[upload] Full insert failed, trying minimal insert:', insertErr.message);
      await db.query(
        `INSERT INTO vendor_gallery
          (id, vendor_id, section_id, url, caption, file_size, mime_type,
           is_hero, show_on_main, show_on_minisite, approval_status, created_at)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, FALSE, ?, ?, 'pending', NOW())`,
        [user.id, sectionId, result.secure_url, caption || file.name, file.size, mime, showOnMain, showOnMinisite]
      );
    }

    return Response.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      isDuplicate: false,
    }, { status: 201 });

  } catch (error) {
    console.error('[vendor/gallery/upload] error:', error);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
