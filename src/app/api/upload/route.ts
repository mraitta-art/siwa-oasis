import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { saveUploadedBuffer } from '@/lib/media-storage';
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

    // Extract folder context
    const bizName = formData.get('businessName') as string;
    const sectionName = formData.get('sectionName') as string;
    let cloudFolder = 'siwa-uploads';

    if (bizName) {
      const safeBiz = bizName.toLowerCase().replace(/\s+/g, '-');
      const safeSec = (sectionName || 'general').toLowerCase().replace(/\s+/g, '-');
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
            folder: 'siwa-uploads',
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
        const result: any = await uploadToCloudinary(buffer, cloudFolder);
        finalUrl = result.secure_url;
      } catch (cloudErr: any) {
        console.error('[CLOUDINARY ERROR]', cloudErr);
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 500 });
        }
      }
    }

    // 2. Always also save a local E: copy for the local app
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const localSubfolder = bizName ? `businesses/${bizName.toLowerCase().replace(/\s+/g, '-')}` : 'general';
    const localResult = saveUploadedBuffer(buffer, filename, localSubfolder);
    console.log(`✅ File uploaded locally: ${localResult.url}`);

    if (!finalUrl) {
      finalUrl = localResult.url;
    }

    // Store file hash for future duplicate detection if available
    if (await checkUploadedFilesTableAvailable()) {
      try {
        await execute(
          `INSERT INTO uploaded_files (file_hash, url, localUrl, file_name, file_size, mime_type, folder, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE created_at = NOW()`,
          [fileHash, finalUrl, localResult.url, file.name, file.size, file.type, cloudFolder]
        );
      } catch (dbErr: any) {
        // Silently disable future attempts if this fails
        _uploadedFilesTableAvailable = false;
        if (process.env.NODE_ENV !== 'production') {
          console.log('[INFO] File hash storage failed — disabling further hash stores:', dbErr.message);
        }
      }
    }

    return NextResponse.json({ url: finalUrl, localUrl: localResult.url, folder: cloudFolder, isDuplicate: false });
  } catch (err: any) {
    console.error('❌ [UPLOAD API ERROR]:', err);
    return NextResponse.json({ 
      error: 'Upload operation failed', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    }, { status: 500 });
  }
}
