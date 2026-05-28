/**
 * Admin authentication middleware
 * Check for ADMIN_SECRET env var (set in .env.local)
 */

export function isAdminToken(authHeader: string | null): boolean {
  const token = authHeader?.replace('Bearer ', '');
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    console.warn('ADMIN_SECRET not set in env');
    return false;
  }
  return token === secret;
}

export function requireAdmin(authHeader: string | null): { ok: boolean; error?: string } {
  if (!isAdminToken(authHeader)) {
    return { ok: false, error: 'Unauthorized: invalid or missing admin token' };
  }
  return { ok: true };
}
