import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import { uploadToCloudinary } from '@/lib/cloudinary';

/**
 * PRODUCTION FILE UPLOAD API
 * Hybrid: Cloudinary (Production) or Local FS (Development)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Try Cloudinary if configured
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const result: any = await uploadToCloudinary(buffer, 'siwa-uploads');
        return NextResponse.json({ url: result.secure_url });
      } catch (cloudErr: any) {
        console.error('[CLOUDINARY ERROR]', cloudErr);
        // Continue to local fallback if in development
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 500 });
        }
      }
    }

    // 2. Fallback to Local FS (Development only)
    const ext = file.name.split('.').pop();
    const filename = `${crypto.randomUUID()}.${ext}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {}

    const path = join(uploadDir, filename);
    await writeFile(path, buffer);

    const url = `/uploads/${filename}`;
    console.log(`✅ File uploaded locally: ${url}`);

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error('[UPLOAD ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
