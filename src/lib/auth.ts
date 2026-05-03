import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { query, queryOne, execute } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev_secret');
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'siwa_session';

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  displayName: string | null;
  businessId: string | null;
  subscriptionTier: string;
}

/** Hash a plain-text password */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Compare plain-text to hash */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Create a signed JWT */
export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/** Verify and decode a JWT */
export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

/** Set session cookie */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/** Clear session cookie */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Get session cookie value */
export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/** Get the current authenticated user from the session cookie */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return verifyToken(token);
}

/** Login: verify credentials vs DB, return user or null */
export async function login(email: string, password: string): Promise<SessionUser | null> {
  try {
    console.log(`[AUTH DEBUG] Login attempt for: ${email}`);
    const user = await queryOne<any>(
      'SELECT id, email, password_hash, role, display_name, business_id, subscription_tier, active FROM profiles WHERE email = ?',
      [email]
    );
    
    if (!user) {
      console.log(`[AUTH DEBUG] User not found: ${email}. Checking if DB is empty...`);
      const allUsers = await query('SELECT count(*) as count FROM profiles');
      
      if (allUsers[0].count === 0) {
        console.log(`[AUTH DEBUG] Database is EMPTY. Please seed accounts via: npm run init-db`);
        // Demo accounts are now seeded from SQL migrations, not hardcoded here
        const demoAccounts: any[] = [];
        
        if (demoAccounts.length === 0) {
          console.error(`[AUTH ERROR] No accounts in database. Migration may have failed.`);
          return null;
        }
        // If we get here, retry login
        return login(email, password);
      }
      
      console.log(`[AUTH DEBUG] User not found, but DB has users. Total: ${allUsers[0].count}`);
      return null;
    }
    
    if (!user.active) {
      console.log(`[AUTH DEBUG] User found but is inactive: ${email}`);
      return null;
    }
    
    const valid = await comparePassword(password, user.password_hash);
    console.log(`[AUTH DEBUG] Password check for ${email}: ${valid ? 'SUCCESS' : 'FAILED'}`);
    console.log(`[AUTH DEBUG] Hash compared: ${user.password_hash}`);
    
    if (!valid) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
      businessId: user.business_id,
      subscriptionTier: user.subscription_tier,
    };
  } catch (error: any) {
    console.error('[AUTH DEBUG] Login error:', error.message);
    return null;
  }
}

/** Check if user has a specific permission based on RBAC role */
export function hasPermission(role: string, permission: string): boolean {
  const ROLE_PERMISSIONS: Record<string, string[]> = {
    super_admin: ['*'],
    content_admin: ['manage_types', 'manage_sections', 'manage_forms', 'manage_cards', 'manage_website', 'manage_policies', 'manage_businesses'],
    sales_manager: ['view_all_businesses', 'approve_upgrades', 'assign_tiers', 'create_businesses', 'view_sales_stats', 'manage_businesses'],
    support_agent: ['view_businesses', 'edit_contact_info'],
    salesman: ['create_free_businesses', 'submit_upgrades', 'view_own_clients'],
    vendor: ['manage_own_business', 'request_upgrades', 'upload_images'],
    public: ['browse', 'search', 'claim_businesses'],
  };
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}

/** Require admin access — returns user or throws */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const adminRoles = ['super_admin', 'content_admin', 'sales_manager', 'support_agent'];
  if (!adminRoles.includes(user.role)) throw new Error('Admin access required');
  return user;
}

/** Require any authenticated user */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}
