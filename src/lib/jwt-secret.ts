const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Return the configured JWT key only when it meets the repository's minimum
 * strength policy. A null result makes callers fail closed.
 */
export function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (
    !secret ||
    secret.trim().length < MIN_JWT_SECRET_LENGTH ||
    /change_me|your_/i.test(secret)
  ) {
    return null;
  }

  return new TextEncoder().encode(secret);
}
