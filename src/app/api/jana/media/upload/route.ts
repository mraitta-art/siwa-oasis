import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Try Cloudinary (Production Storage)
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const result: any = await uploadToCloudinary(buffer, 'siwa-admin-media');
        return NextResponse.json({ 
          success: true,
          url: result.secure_url,
          filename: file.name,
          size: file.size,
          type: file.type,
          source: 'cloudinary'
        });
      } catch (cloudErr: any) {
        console.error('[CLOUDINARY ERROR]', cloudErr);
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 500 });
        }
      }
    }

    // 2. Fallback to Local FS (Development Storage)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `${timestamp}-${originalName}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
      filename: filename,
      size: file.size,
      type: file.type,
      source: 'local'
    });
  } catch (e: any) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { error: 'Failed to upload file: ' + e.message },
      { status: 500 }
    );
  }
}
