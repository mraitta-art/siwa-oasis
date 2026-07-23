import fs from 'fs';
import path from 'path';

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
