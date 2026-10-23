import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { safeMediaSegment, saveUploadedBuffer } from '@/lib/media-storage';
import { queryOne, execute } from '@/lib/db';

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
    const fileEntry = formData.get('file');
    const file = fileEntry instanceof File ? fileEntry : null;

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
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const hasCloudinaryConfig = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    if (isServerless && !hasCloudinaryConfig) {
      return NextResponse.json(
        { error: 'Persistent image storage is not configured. Ask the administrator to configure Cloudinary before uploading carousel media.' },
        { status: 503 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Calculate file hash to detect duplicates
    const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

    // Check if file with this hash already exists
    try {
      const existing = await queryOne(
        'SELECT url, localUrl FROM admin_media_uploads WHERE file_hash = ? LIMIT 1',
        [fileHash]
      );
      const reusableUrl = typeof existing?.url === 'string' &&
        !/^data:/i.test(existing.url) &&
        (!isServerless || existing.url.startsWith('https://'))
        ? existing.url
        : !isServerless && typeof existing?.localUrl === 'string' && !/^data:/i.test(existing.localUrl)
          ? existing.localUrl
          : '';
      if (reusableUrl) {
        return NextResponse.json({
          success: true,
          url: reusableUrl,
          localUrl: reusableUrl,
          isDuplicate: true,
          message: 'This file already exists in media library. Returning existing URL.',
          folder: cloudFolder,
          source: reusableUrl.startsWith('http') ? 'cloudinary' : 'local'
        });
      }
    } catch (hashErr) {
      console.warn('[MEDIA UPLOAD] File hash check failed:', hashErr);
    }

    let finalUrl = '';

    if (hasCloudinaryConfig) {
      try {
        const result: any = await uploadToCloudinary(buffer, file.name, cloudFolder);
        finalUrl = result?.secure_url || '';
        if (!finalUrl) throw new Error('Cloudinary did not return a persistent media URL.');
      } catch (cloudErr) {
        console.error('[CLOUDINARY UPLOAD FAILED]', cloudErr);
        if (isServerless) {
          return NextResponse.json(
            { error: 'The image could not be saved to persistent storage. Please retry; if the problem continues, contact support.' },
            { status: 502 }
          );
        }
      }
    }

    let localResultUrl = '';
    if (!finalUrl) {
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
      try {
        const localResult = saveUploadedBuffer(buffer, filename, `jana-media/${safeBizName}/${safeSectionName}`);
        localResultUrl = localResult.url;
        finalUrl = localResult.url;
      } catch (fsErr) {
        console.error('[LOCAL MEDIA STORAGE FAILED]', fsErr);
        return NextResponse.json(
          { error: 'The uploaded file could not be saved. Configure persistent media storage and try again.' },
          { status: 503 }
        );
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
    } catch (dbErr) {
      console.warn('[MEDIA UPLOAD] File hash storage failed:', dbErr);
    }

    return NextResponse.json({
      success: true,
      url: finalUrl,
      localUrl: localResultUrl || finalUrl,
      filename: file.name,
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
