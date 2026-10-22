import { db } from '@/server/db/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { loginUser, registerUser } from './auth.service';

describe('auth.service integration (zero-mock SQLite)', () => {
  beforeEach(async () => {
    await db.session.deleteMany();
    await db.user.deleteMany();
  });

  it('registers a new user and returns success result', async () => {
    const result = await registerUser({
      name: 'Alice Developer',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.user.email).toBe('alice@example.com');
    expect(result.data.user.name).toBe('Alice Developer');
    expect(result.data.token).toBeDefined();

    const dbUser = await db.user.findUnique({ where: { email: 'alice@example.com' } });
    expect(dbUser).toBeDefined();
    expect(dbUser?.passwordHash).not.toBe('password123');
  });

  it('fails registration when email is already taken', async () => {
    await registerUser({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    const duplicateResult = await registerUser({
      name: 'Alice Two',
      email: 'alice@example.com',
      password: 'differentPassword',
    });

    expect(duplicateResult.success).toBe(false);
    if (duplicateResult.success) return;

    expect(duplicateResult.error.code).toBe('EMAIL_EXISTS');
  });

  it('logs in an existing user with valid password', async () => {
    await registerUser({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password123',
    });

    const loginResult = await loginUser({
      email: 'bob@example.com',
      password: 'password123',
    });

    expect(loginResult.success).toBe(true);
    if (!loginResult.success) return;

    expect(loginResult.data.user.email).toBe('bob@example.com');
    expect(loginResult.data.token).toBeDefined();
  });

  it('rejects login with invalid password', async () => {
    await registerUser({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password123',
    });

    const loginResult = await loginUser({
      email: 'bob@example.com',
      password: 'wrongpassword',
    });

    expect(loginResult.success).toBe(false);
    if (loginResult.success) return;

    expect(loginResult.error.code).toBe('INVALID_CREDENTIALS');
  });
});
