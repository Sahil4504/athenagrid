import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Password hashing using Node's built-in crypto (scrypt) — no external dependency,
 * no native build. Stored format: `<saltHex>:<hashHex>`.
 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const hash = Buffer.from(hashHex, 'hex');
  const test = scryptSync(plain, salt, 64);
  return hash.length === test.length && timingSafeEqual(hash, test);
}
