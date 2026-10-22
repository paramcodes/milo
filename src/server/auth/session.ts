import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const SESSION_SECRET = process.env.SESSION_SECRET || 'milo-development-insecure-secret-key-32chars';
export const SESSION_COOKIE_NAME = 'milo_session';

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;

  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

  if (keyBuffer.length !== derivedKey.length) return false;
  return timingSafeEqual(keyBuffer, derivedKey);
}

export interface SessionPayload {
  userId: string;
  expiresAt: number;
}

export async function createSessionToken(
  userId: string,
  ttlMs = 7 * 24 * 60 * 60 * 1000,
): Promise<string> {
  const payload: SessionPayload = {
    userId,
    expiresAt: Date.now() + ttlMs,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmacSignature(encodedPayload, SESSION_SECRET);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = createHmacSignature(encodedPayload, SESSION_SECRET);
  if (!constantTimeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson) as SessionPayload;

    if (!payload.userId || !payload.expiresAt) return null;
    if (Date.now() > payload.expiresAt) return null;

    return payload;
  } catch {
    return null;
  }
}

function createHmacSignature(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return timingSafeEqual(bufA, bufB);
}
