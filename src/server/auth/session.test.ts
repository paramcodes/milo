import { describe, expect, it } from 'vitest';
import { createSessionToken, hashPassword, verifyPassword, verifySessionToken } from './session';

describe('server/auth/session', () => {
  it('hashes password and verifies successfully', async () => {
    const password = 'SecretPassword123!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('creates and verifies session tokens', async () => {
    const userId = 'usr_12345';
    const token = await createSessionToken(userId);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const verified = await verifySessionToken(token);
    expect(verified).toBeDefined();
    expect(verified?.userId).toBe(userId);
  });

  it('rejects tampered session tokens', async () => {
    const userId = 'usr_12345';
    const token = await createSessionToken(userId);
    const tampered = `${token}tampered`;

    const verified = await verifySessionToken(tampered);
    expect(verified).toBeNull();
  });
});
