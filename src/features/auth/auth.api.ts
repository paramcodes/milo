'use server';

import { SESSION_COOKIE_NAME } from '@/server/auth/session';
import { Result } from '@/shared/kernel/result';
import { cookies } from 'next/headers';
import {
  type LoginInput,
  type RegisterInput,
  type UserDto,
  loginSchema,
  registerSchema,
} from './auth.schema';
import * as authService from './auth.service';

export async function registerAction(rawInput: RegisterInput): Promise<Result<UserDto>> {
  const parsed = registerSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await authService.registerUser(parsed.data);
  if (!result.success) {
    return result;
  }

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, result.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return Result.success(result.data.user);
}

export async function loginAction(rawInput: LoginInput): Promise<Result<UserDto>> {
  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await authService.loginUser(parsed.data);
  if (!result.success) {
    return result;
  }

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, result.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return Result.success(result.data.user);
}

export async function logoutAction(): Promise<Result<void>> {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return Result.success(undefined);
}
