/**
 * OTP service for visitor verification
 * Stores OTPs in memory (in-production use Redis or DB)
 */

const otpStorage: Map<string, { code: string; expiresAt: number }> = new Map();

export function generateOTP(contact: string): string {
  const code = Math.random().toString().slice(2, 8); // 6 digits
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min
  otpStorage.set(contact, { code, expiresAt });
  return code;
}

export function verifyOTP(contact: string, code: string): boolean {
  const stored = otpStorage.get(contact);
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    otpStorage.delete(contact);
    return false;
  }
  if (stored.code !== code) return false;
  otpStorage.delete(contact); // consume OTP
  return true;
}

export function revokeOTP(contact: string) {
  otpStorage.delete(contact);
}
