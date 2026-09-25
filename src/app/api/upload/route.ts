import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { safeMediaSegment, saveUploadedBuffer } from '@/lib/media-storage';
import { queryOne, execute } from '@/lib/db';

/**
 * PRODUCTION FILE UPLOAD API
 * Hybrid: Cloudinary (Production) or Local FS (Development)
 * With duplicate prevention using file hash detection
 */
let _uploadedFilesTableAvailable: boolean | null = null;

async function checkUploadedFilesTableAvailable(): Promise<boolean> {
  if (_uploadedFilesTableAvailable !== null) return _uploadedFilesTableAvailable;

  try {
    await queryOne('SELECT 1 FROM uploaded_files LIMIT 1');
    _uploadedFilesTableAvailable = true;
  } catch (err: any) {
    // If table/column missing, we will skip future checks to avoid repeated noisy logs
    _uploadedFilesTableAvailable = false;
    if (process.env.NODE_ENV !== 'production') {
      console.log('[INFO] uploaded_files table/fields unavailable — skipping hash checks going forward:', err?.message || err);
    }
  }

  return _uploadedFilesTableAvailable;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images and videos are allowed.' }, { status: 400 });
    }
    const maxBytes = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: `File too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)}MB.` }, { status: 413 });
    }

    // Extract folder context
    const bizName = formData.get('businessName') as string;
    const sectionName = formData.get('sectionName') as string;
    let cloudFolder = 'siwa-uploads';

    if (bizName) {
      const safeBiz = safeMediaSegment(bizName, 'general');
      const safeSec = safeMediaSegment(sectionName, 'general');
      cloudFolder = `siwa-oasis/businesses/${safeBiz}/${safeSec}`;
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Calculate file hash to detect duplicates
    const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

    let finalUrl = '';

    // Only attempt duplicate-detection if the table is available
    const canCheckHashes = await checkUploadedFilesTableAvailable();
    if (canCheckHashes) {
      try {
        const existing = await queryOne(
          'SELECT url, localUrl FROM uploaded_files WHERE file_hash = ? LIMIT 1',
          [fileHash]
        );
        if (existing) {
          return NextResponse.json({
            url: existing.url || existing.localUrl,
            localUrl: existing.localUrl,
            folder: cloudFolder,
            isDuplicate: true,
            message: 'This file already exists. Returning existing URL.'
          });
        }
      } catch (dbErr: any) {
        // If the check unexpectedly fails, mark the table unavailable to avoid repeated errors
        _uploadedFilesTableAvailable = false;
        if (process.env.NODE_ENV !== 'production') {
          console.log('[INFO] File hash check failed — disabling further hash checks:', dbErr.message);
        }
      }
    }

    // 1. Try Cloudinary if configured
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const result: any = await uploadToCloudinary(buffer, file.name, cloudFolder);
        finalUrl = result.secure_url;
      } catch (cloudErr: any) {
        console.error('[CLOUDINARY ERROR]', cloudErr);
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 500 });
        }
      }
    }

    // 2. Save local copy only when filesystem is available (not on Vercel serverless)
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || !process.env.SIWA_MEDIA_ROOT);
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const localSubfolder = `businesses/${safeMediaSegment(bizName, 'general')}/${safeMediaSegment(sectionName, 'general')}`;
    let localUrl = '';

    if (!isServerless) {
      try {
        const localResult = saveUploadedBuffer(buffer, filename, localSubfolder);
        localUrl = localResult.url;
        console.log(`✅ File uploaded locally: ${localUrl}`);
        if (!finalUrl) finalUrl = localUrl;
      } catch (fsErr: any) {
        console.warn('[FS SAVE SKIPPED]', fsErr.message);
      }
    }

    // 3. Last resort — base64 data URL (always works, even on serverless)
    if (!finalUrl) {
      finalUrl = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      console.warn('[UPLOAD] Using base64 fallback — Cloudinary not configured or failed');
    }

    // Store file hash for future duplicate detection if available
    if (await checkUploadedFilesTableAvailable()) {
      try {
        await execute(
          `INSERT INTO uploaded_files (file_hash, url, localUrl, file_name, file_size, mime_type, folder, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE created_at = NOW()`,
          [fileHash, finalUrl, localUrl || finalUrl, file.name, file.size, file.type, cloudFolder]
        );
      } catch (dbErr: any) {
        _uploadedFilesTableAvailable = false;
        if (process.env.NODE_ENV !== 'production') {
          console.log('[INFO] File hash storage failed — disabling further hash stores:', dbErr.message);
        }
      }
    }

    return NextResponse.json({ url: finalUrl, localUrl: localUrl || finalUrl, folder: cloudFolder, isDuplicate: false });

  } catch (err: any) {
    console.error('❌ [UPLOAD API ERROR]:', err);
    return NextResponse.json({ 
      error: 'Upload operation failed', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    }, { status: 500 });
  }
}
