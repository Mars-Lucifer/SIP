import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${passwordHash}`;
}

export function verifyPassword(password: string, savedHash: string) {
  const [salt, savedPasswordHash] = savedHash.split(':');

  if (!salt || !savedPasswordHash) {
    return false;
  }

  const incomingHash = scryptSync(password, salt, 64);
  const storedHash = Buffer.from(savedPasswordHash, 'hex');

  if (incomingHash.length !== storedHash.length) {
    return false;
  }

  return timingSafeEqual(incomingHash, storedHash);
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
