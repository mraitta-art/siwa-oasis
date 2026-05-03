/**
 * HYBRID MEDIA MANAGER UTILITIES
 */

export interface ParsedMedia {
  type: 'youtube' | 'image' | 'unknown';
  embedUrl?: string; // THe clean iframe friendly URL
  originalUrl: string;
  error?: string;
}

/**
 * Robustly parses user-submitted YouTube URLs (mobile, desktop, shorts, or clean)
 * and returns the exact embed URL required for the minisite gallery component.
 */
export function parseExternalVideo(url: string): ParsedMedia {
  if (!url) return { type: 'unknown', originalUrl: '', error: 'Empty URL' };

  try {
    // 1. Check if it's already an embed URL
    if (url.includes('youtube.com/embed/')) {
      return { type: 'youtube', originalUrl: url, embedUrl: url };
    }

    // 2. Parse youtube.com/watch?v=ID
    const watchRegex = /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/;
    const watchMatch = url.match(watchRegex);
    if (watchMatch && watchMatch[1]) {
      return { type: 'youtube', originalUrl: url, embedUrl: `https://www.youtube.com/embed/${watchMatch[1]}` };
    }

    // 3. Parse mobile youtu.be/ID
    const mobileRegex = /(?:youtu\.be\/)([^&\n?#]+)/;
    const mobileMatch = url.match(mobileRegex);
    if (mobileMatch && mobileMatch[1]) {
      return { type: 'youtube', originalUrl: url, embedUrl: `https://www.youtube.com/embed/${mobileMatch[1]}` };
    }

    // 4. Parse Shorts youtube.com/shorts/ID
    const shortsRegex = /(?:youtube\.com\/shorts\/)([^&\n?#]+)/;
    const shortsMatch = url.match(shortsRegex);
    if (shortsMatch && shortsMatch[1]) {
      return { type: 'youtube', originalUrl: url, embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}` };
    }

    return { type: 'unknown', originalUrl: url, error: 'Not a recognized YouTube format.' };
  } catch (error) {
    return { type: 'unknown', originalUrl: url, error: 'Failed to parse URL.' };
  }
}

/**
 * Checks a file against strict upload constraints before allowing server upload.
 */
export function validateDirectUpload(file: File): { valid: boolean; error?: string } {
  // 1MB Limit
  const MAX_BYTES = 1 * 1024 * 1024;
  
  if (file.size > MAX_BYTES) {
    return { valid: false, error: 'File exceeds 1MB max limit. Please compress to WebP or use external URL.' };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, and WebP formats are allowed.' };
  }

  return { valid: true };
}
