'use server';

import { SESSION_COOKIE_NAME, verifySessionToken } from '@/server/auth/session';
import { Result } from '@/shared/kernel/result';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import {
  type BoardSummaryDto,
  type CreateBoardInput,
  type UpdateBoardInput,
  createBoardSchema,
  updateBoardSchema,
} from './boards.schema';
import * as boardsService from './boards.service';

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  return session ? session.userId : null;
}

export async function createBoardAction(
  rawInput: CreateBoardInput,
): Promise<Result<BoardSummaryDto>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Result.failure('UNAUTHORIZED', 'You must be logged in to create a board');
  }

  const parsed = createBoardSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await boardsService.createBoardCommand(parsed.data, userId);
  if (result.success) {
    revalidatePath('/');
  }
  return result;
}

export async function updateBoardAction(
  rawInput: UpdateBoardInput,
): Promise<Result<BoardSummaryDto>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Result.failure('UNAUTHORIZED', 'You must be logged in to update a board');
  }

  const parsed = updateBoardSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await boardsService.updateBoardCommand(parsed.data, userId);
  if (result.success) {
    revalidatePath(`/b/${parsed.data.boardId}`);
    revalidatePath('/');
  }
  return result;
}
