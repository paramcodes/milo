'use server';

import { SESSION_COOKIE_NAME, verifySessionToken } from '@/server/auth/session';
import { Result } from '@/shared/kernel/result';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import {
  type CreateListInput,
  type DeleteListInput,
  type ListDto,
  type ReorderListsInput,
  type UpdateListTitleInput,
  createListSchema,
  deleteListSchema,
  reorderListsSchema,
  updateListTitleSchema,
} from './lists.schema';
import * as listsService from './lists.service';

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  return session ? session.userId : null;
}

export async function createListAction(rawInput: CreateListInput): Promise<Result<ListDto>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Result.failure('UNAUTHORIZED', 'Not authenticated');
  }

  const parsed = createListSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await listsService.createListCommand(parsed.data, userId);
  if (result.success) {
    revalidatePath(`/b/${parsed.data.boardId}`);
  }
  return result;
}

export async function updateListTitleAction(
  rawInput: UpdateListTitleInput,
): Promise<Result<ListDto>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Result.failure('UNAUTHORIZED', 'Not authenticated');
  }

  const parsed = updateListTitleSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await listsService.updateListTitleCommand(parsed.data, userId);
  if (result.success) {
    revalidatePath(`/b/${result.data.boardId}`);
  }
  return result;
}

export async function reorderListsAction(rawInput: ReorderListsInput): Promise<Result<void>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Result.failure('UNAUTHORIZED', 'Not authenticated');
  }

  const parsed = reorderListsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await listsService.reorderListsCommand(parsed.data, userId);
  if (result.success) {
    revalidatePath(`/b/${parsed.data.boardId}`);
  }
  return result;
}

export async function deleteListAction(
  rawInput: DeleteListInput,
  boardId?: string,
): Promise<Result<void>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Result.failure('UNAUTHORIZED', 'Not authenticated');
  }

  const parsed = deleteListSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await listsService.deleteListCommand(parsed.data, userId);
  if (result.success && boardId) {
    revalidatePath(`/b/${boardId}`);
  }
  return result;
}
