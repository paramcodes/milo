import { createSessionToken, hashPassword, verifyPassword } from '@/server/auth/session';
import { Result } from '@/shared/kernel/result';
import * as authRepo from './auth.repo';
import type { LoginInput, RegisterInput, UserDto, UserSessionDto } from './auth.schema';

export async function registerUser(input: RegisterInput): Promise<Result<UserSessionDto>> {
  const existingUser = await authRepo.findUserByEmail(input.email);
  if (existingUser) {
    return Result.failure('EMAIL_EXISTS', 'A user with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await authRepo.createUser({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  const token = await createSessionToken(user.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await authRepo.createSession({
    userId: user.id,
    token,
    expiresAt,
  });

  const userDto: UserDto = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };

  return Result.success({
    user: userDto,
    token,
  });
}

export async function loginUser(input: LoginInput): Promise<Result<UserSessionDto>> {
  const user = await authRepo.findUserByEmail(input.email);
  if (!user) {
    return Result.failure('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const isValidPassword = await verifyPassword(input.password, user.passwordHash);
  if (!isValidPassword) {
    return Result.failure('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const token = await createSessionToken(user.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await authRepo.createSession({
    userId: user.id,
    token,
    expiresAt,
  });

  const userDto: UserDto = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };

  return Result.success({
    user: userDto,
    token,
  });
}

export async function getUserFromSession(token: string): Promise<Result<UserDto>> {
  const session = await authRepo.findSessionWithUser(token);
  if (!session || session.expiresAt < new Date()) {
    return Result.failure('SESSION_INVALID', 'Session expired or not found');
  }

  const userDto: UserDto = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    createdAt: session.user.createdAt,
  };

  return Result.success(userDto);
}
