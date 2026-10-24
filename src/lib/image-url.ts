/**
 * Cloudinary delivery optimisation.
 *
 * Uploaded assets are stored at full resolution and the database keeps the
 * original URL, so browsers were fetching the master file: the largest stored
 * image is 2.86 MB PNG. Inserting `f_auto,q_auto,w_<width>` before the version
 * segment lets Cloudinary negotiate WebP/AVIF and resize at the edge, which
 * removes roughly 90% of the bytes without touching the stored asset.
 *
 * This is deliberately *not* next/image: Vercel's optimiser would spend the
 * Hobby plan's 5,000 transformations and pull the bytes through Vercel first.
 * Cloudinary transforms are free of those limits and never touch Vercel.
 */

const CLOUDINARY_HOST = 'res.cloudinary.com';
const IMAGE_UPLOAD = '/image/upload/';

/**
 * Cloudinary transformation prefixes. If the first path segment already starts
 * with one of these it is an existing transformation, and rewriting it could
 * break a deliberate crop, so the URL is passed through untouched.
 */
const TRANSFORM_PREFIXES = new Set([
  'f', 'q', 'w', 'h', 'c', 'e', 'dpr', 'g', 'ar', 'b', 'bo', 'co', 'r', 't', 'x',
  'y', 'o', 'z', 'a', 'ac', 'au', 'br', 'dn', 'dl', 'du', 'fl', 'fn', 'fps', 'if',
  'l', 'p', 'pg', 'so', 'sp', 'sr', 'vc', 'vs', 'ki', 'cd', 'cs', 's',
]);

function isExistingTransformation(segment: string): boolean {
  return segment.split(',').some((part) => TRANSFORM_PREFIXES.has(part.split('_')[0]));
}

/**
 * Add adaptive format, quality and width to a Cloudinary image URL.
 * Non-Cloudinary URLs, videos and already-transformed URLs are returned as-is.
 */
export function optimizeImageUrl(url: string, width = 1600): string {
  if (typeof url !== 'string' || !url.includes(CLOUDINARY_HOST)) return url;

  const at = url.indexOf(IMAGE_UPLOAD);
  if (at === -1) return url; // /video/upload/ or /raw/upload/ — leave alone

  const rest = url.slice(at + IMAGE_UPLOAD.length);
  const slash = rest.indexOf('/');
  const firstSegment = slash === -1 ? rest : rest.slice(0, slash);

  // A version segment (v1234567890) is not a transformation, so keep walking.
  const isVersion = /^v\d+$/.test(firstSegment);
  if (!isVersion && isExistingTransformation(firstSegment)) return url;

  return `${url.slice(0, at + IMAGE_UPLOAD.length)}f_auto,q_auto,w_${width},c_limit/${rest}`;
}

/**
 * Apply optimizeImageUrl to every string nested inside content JSON.
 * Depth-limited so an unexpected structure cannot recurse away.
 */
export function optimizeImageUrlsDeep<T>(value: T, width = 1600): T {
  const walk = (node: unknown, depth: number): unknown => {
    if (depth > 12 || node === null || node === undefined) return node;
    if (typeof node === 'string') return optimizeImageUrl(node, width);
    if (Array.isArray(node)) return node.map((item) => walk(item, depth + 1));
    if (typeof node === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
        out[key] = walk(child, depth + 1);
      }
      return out;
    }
    return node;
  };
  return walk(value, 0) as T;
}
