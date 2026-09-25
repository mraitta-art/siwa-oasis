import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { safeMediaSegment, saveUploadedBuffer } from '@/lib/media-storage';
import { db, queryOne, execute } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    let user: any = null;
    try {
      user = await requireAdmin();
    } catch (authErr) {
      user = await getCurrentUser().catch(() => null);
      if (!user && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (Images & Videos)
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/heic', 'image/heif',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and videos are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB for video support)
    const maxBytes = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${file.type.startsWith('video/') ? '50MB' : '10MB'}.` },
        { status: 400 }
      );
    }

    // Extract folder hints (business/section)
    const bizName = formData.get('businessName') as string || 'general';
    const sectionName = formData.get('sectionName') as string || 'misc';
    
    // Construct Hierarchical Folder Path: siwa-oasis/businesses/business-name/section-name
    const safeBizName = safeMediaSegment(bizName, 'general');
    const safeSectionName = safeMediaSegment(sectionName, 'misc');
    const cloudFolder = `siwa-oasis/businesses/${safeBizName}/${safeSectionName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Calculate file hash to detect duplicates
    const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

    // Check if file with this hash already exists
    try {
      const existing = await queryOne(
        'SELECT url, localUrl FROM admin_media_uploads WHERE file_hash = ? LIMIT 1',
        [fileHash]
      );
      if (existing) {
        return NextResponse.json({
          success: true,
          url: existing.url || existing.localUrl,
          localUrl: existing.localUrl,
          isDuplicate: true,
          message: 'This file already exists in media library. Returning existing URL.',
          folder: cloudFolder,
          source: existing.url?.startsWith('http') ? 'cloudinary' : 'local'
        });
      }
    } catch (hashErr: any) {
      console.log('[INFO] File hash check skipped:', hashErr.message);
    }

    let finalUrl = '';

    // 1. Try Cloudinary (Shared/public storage)
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const result: any = await uploadToCloudinary(buffer, file.name, cloudFolder);
        finalUrl = result?.secure_url || '';
      } catch (cloudErr: any) {
        console.error('[CLOUDINARY ERROR - FALLBACK TO DATA/LOCAL]', cloudErr);
      }
    }

    // 2. Save local copy when running on Node with filesystem support
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `${timestamp}-${originalName}`;
    let localResultUrl = '';
    try {
      const localResult = saveUploadedBuffer(buffer, filename, `jana-media/${safeBizName}/${safeSectionName}`);
      localResultUrl = localResult.url;
    } catch (fsErr) {
      console.warn('[FS SAVE SKIPPED IN SERVERLESS]', fsErr);
    }

    // 3. If no Cloudinary URL and running in Serverless / Vercel, use Base64 data URL to guarantee instant display
    if (!finalUrl) {
      const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || !process.env.SIWA_MEDIA_ROOT);
      if (isServerless && buffer.length <= 15 * 1024 * 1024) {
        finalUrl = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      } else {
        finalUrl = localResultUrl || `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      }
    }

    // Store file hash for future duplicate detection
    try {
      await execute(
        `INSERT INTO admin_media_uploads (file_hash, url, localUrl, file_name, file_size, mime_type, folder, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE created_at = NOW()`,
        [fileHash, finalUrl, localResultUrl || finalUrl, file.name, file.size, file.type, cloudFolder]
      );
    } catch (dbErr: any) {
      console.log('[INFO] File hash storage skipped:', dbErr.message);
    }

    return NextResponse.json({
      success: true,
      url: finalUrl,
      localUrl: localResultUrl || finalUrl,
      filename: filename,
      size: file.size,
      type: file.type,
      source: finalUrl.startsWith('http') ? 'cloudinary' : 'local',
      folder: cloudFolder,
      isDuplicate: false
    });
  } catch (e: any) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { error: 'Failed to upload file: ' + e.message, isDuplicate: false },
      { status: 500 }
    );
  }
}
