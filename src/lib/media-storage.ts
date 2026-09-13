import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// ─── Cloudinary ──────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: 'image' | 'video' | 'raw';
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  cloudinary_data: Record<string, unknown>;
}

/**
 * Upload a buffer to Cloudinary.
 * Falls back to local disk storage when CLOUDINARY_CLOUD_NAME is not set.
 * @param buffer  - File bytes
 * @param originalName - Original filename (used for public_id generation)
 * @param folder  - Cloudinary folder path e.g. "siwa-oasis/vendor/abc123/sec_1"
 * @param resourceType - "image" | "video" | "raw" (auto-detected if omitted)
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  originalName: string,
  folder: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    // Fallback: save locally and return a compatible result
    const { url, filePath } = saveUploadedBuffer(buffer, originalName, folder);
    return {
      secure_url: url,
      public_id: url,
      resource_type: 'image',
      format: path.extname(originalName).replace('.', ''),
      bytes: buffer.length,
      cloudinary_data: {},
    };
  }

  // Dynamically import cloudinary to avoid issues in edge runtimes
  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  // Build a safe public_id from filename
  const ext = path.extname(originalName || 'file').toLowerCase();
  const base = path.basename(originalName || 'file', ext)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  const publicId = `${folder}/${Date.now()}-${base}`;

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: resourceType,
        overwrite: false,
        use_filename: false,
        unique_filename: false,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Cloudinary upload failed'));
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type as 'image' | 'video' | 'raw',
          format: result.format || '',
          width: result.width,
          height: result.height,
          duration: (result as any).duration,
          bytes: result.bytes,
          cloudinary_data: result as unknown as Record<string, unknown>,
        });
      }
    );

    // Pipe buffer into the upload stream
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * Delete an asset from Cloudinary by its public_id.
 * Silently ignores errors (e.g. asset already deleted).
 */
export async function destroyFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret || !publicId) return;

  // Don't try to destroy local-disk fallback paths (they start with /uploads/)
  if (publicId.startsWith('/uploads/')) return;

  try {
    const { v2: cloudinary } = await import('cloudinary');
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (e) {
    console.warn('[Cloudinary] destroy failed for', publicId, e);
  }
}

export function resolveMediaRoot(): string {
  const candidates = [
    process.env.SIWA_MEDIA_ROOT,
    process.env.MEDIA_ROOT,
    'E:/siwa-media',
    'D:/siwa-media',
    'C:/siwa-media',
    path.join(process.cwd(), 'media-storage')
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const resolved = path.resolve(candidate);
      fs.mkdirSync(resolved, { recursive: true });
      return resolved;
    } catch (error) {
      // Try the next candidate.
    }
  }

  return path.resolve(path.join(process.cwd(), 'media-storage'));
}

export function getMediaUploadRoot(): string {
  const root = resolveMediaRoot();
  const uploadRoot = path.join(root, 'uploads');
  fs.mkdirSync(uploadRoot, { recursive: true });
  return uploadRoot;
}

export function buildMediaUrl(relativePath: string): string {
  const normalized = relativePath.replace(/^\/+/g, '').replace(/\\/g, '/');
  return `/uploads/${normalized}`;
}

export function safeMediaFilename(originalName: string): string {
  const ext = path.extname(originalName || 'file').toLowerCase();
  const base = path.basename(originalName || 'file', ext).replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-') || 'file';
  return `${Date.now()}-${base}${ext}`;
}

export function saveUploadedBuffer(buffer: Buffer, originalName: string, subfolder = ''): { filePath: string; url: string; filename: string } {
  const uploadRoot = getMediaUploadRoot();
  const relativeDir = subfolder.replace(/^\/+/g, '').replace(/\\/g, '/');
  const targetDir = relativeDir ? path.join(uploadRoot, relativeDir) : uploadRoot;
  fs.mkdirSync(targetDir, { recursive: true });

  const filename = safeMediaFilename(originalName);
  const filePath = path.join(targetDir, filename);
  fs.writeFileSync(filePath, buffer);

  const url = buildMediaUrl(relativeDir ? `${relativeDir}/${filename}` : filename);

  return { filePath, url, filename };
}

export function getMediaFilePath(relativeUrlOrPath: string): string | null {
  const normalized = relativeUrlOrPath.replace(/^\/+/g, '').replace(/\\/g, '/');
  const relative = normalized.startsWith('uploads/') ? normalized.replace(/^uploads\//, '') : normalized;

  const uploadRoot = getMediaUploadRoot();
  const candidate = path.resolve(uploadRoot, relative);
  if (candidate.startsWith(uploadRoot) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  const legacyPath = path.resolve(process.cwd(), 'public', 'uploads', relative);
  if (legacyPath.startsWith(path.resolve(process.cwd(), 'public', 'uploads')) && fs.existsSync(legacyPath) && fs.statSync(legacyPath).isFile()) {
    return legacyPath;
  }

  return null;
}

export function listStoredMediaFiles(): Array<{ name: string; url: string; size: number; modified: Date }> {
  const uploadRoot = getMediaUploadRoot();
  const files = new Map<string, { name: string; url: string; size: number; modified: Date }>();

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const relative = path.relative(uploadRoot, fullPath).replace(/\\/g, '/');
        const url = buildMediaUrl(relative);
        files.set(url, {
          name: relative,
          url,
          size: fs.statSync(fullPath).size,
          modified: fs.statSync(fullPath).mtime
        });
      }
    }
  }

  if (fs.existsSync(uploadRoot)) {
    walk(uploadRoot);
  }

  return Array.from(files.values()).sort((a, b) => a.name.localeCompare(b.name));
}
