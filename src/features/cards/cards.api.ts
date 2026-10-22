'use server';

import { SESSION_COOKIE_NAME, verifySessionToken } from '@/server/auth/session';
import { Result } from '@/shared/kernel/result';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import {
  type AddChecklistItemInput,
  type CardDto,
  type CreateCardInput,
  type DeleteCardInput,
  type DeleteChecklistItemInput,
  type MoveCardInput,
  type ToggleChecklistItemInput,
  type ToggleLabelInput,
  type UpdateCardInput,
  addChecklistItemSchema,
  createCardSchema,
  deleteCardSchema,
  deleteChecklistItemSchema,
  moveCardSchema,
  toggleChecklistItemSchema,
  toggleLabelSchema,
  updateCardSchema,
} from './cards.schema';
import * as cardsService from './cards.service';

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  return session ? session.userId : null;
}

export async function createCardAction(
  rawInput: CreateCardInput,
  boardId?: string,
): Promise<Result<CardDto>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Result.failure('UNAUTHORIZED', 'Not authenticated');

  const parsed = createCardSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await cardsService.createCardCommand(parsed.data, userId);
  if (result.success && boardId) {
    revalidatePath(`/b/${boardId}`);
  }
  return result;
}

export async function updateCardAction(
  rawInput: UpdateCardInput,
  boardId?: string,
): Promise<Result<CardDto>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Result.failure('UNAUTHORIZED', 'Not authenticated');

  const parsed = updateCardSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await cardsService.updateCardCommand(parsed.data, userId);
  if (result.success && boardId) {
    revalidatePath(`/b/${boardId}`);
  }
  return result;
}

export async function moveCardAction(
  rawInput: MoveCardInput,
  boardId?: string,
): Promise<Result<void>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Result.failure('UNAUTHORIZED', 'Not authenticated');

  const parsed = moveCardSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await cardsService.moveCardCommand(parsed.data, userId);
  if (result.success && boardId) {
    revalidatePath(`/b/${boardId}`);
  }
  return result;
}

export async function deleteCardAction(
  rawInput: DeleteCardInput,
  boardId?: string,
): Promise<Result<void>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Result.failure('UNAUTHORIZED', 'Not authenticated');

  const parsed = deleteCardSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await cardsService.deleteCardCommand(parsed.data, userId);
  if (result.success && boardId) {
    revalidatePath(`/b/${boardId}`);
  }
  return result;
}

export async function addChecklistItemAction(
  rawInput: AddChecklistItemInput,
  boardId?: string,
): Promise<Result<{ id: string; title: string; isCompleted: boolean; position: number }>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Result.failure('UNAUTHORIZED', 'Not authenticated');

  const parsed = addChecklistItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await cardsService.addChecklistItemCommand(parsed.data, userId);
  if (result.success && boardId) {
    revalidatePath(`/b/${boardId}`);
  }
  return result;
}

export async function toggleChecklistItemAction(
  rawInput: ToggleChecklistItemInput,
  boardId?: string,
): Promise<Result<{ id: string; isCompleted: boolean }>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Result.failure('UNAUTHORIZED', 'Not authenticated');

  const parsed = toggleChecklistItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await cardsService.toggleChecklistItemCommand(parsed.data, userId);
  if (result.success && boardId) {
    revalidatePath(`/b/${boardId}`);
  }
  return result;
}

export async function deleteChecklistItemAction(
  rawInput: DeleteChecklistItemInput,
  boardId?: string,
): Promise<Result<void>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Result.failure('UNAUTHORIZED', 'Not authenticated');

  const parsed = deleteChecklistItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await cardsService.deleteChecklistItemCommand(parsed.data);
  if (result.success && boardId) {
    revalidatePath(`/b/${boardId}`);
  }
  return result;
}

export async function toggleLabelAction(
  rawInput: ToggleLabelInput,
  boardId?: string,
): Promise<Result<{ added: boolean }>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Result.failure('UNAUTHORIZED', 'Not authenticated');

  const parsed = toggleLabelSchema.safeParse(rawInput);
  if (!parsed.success) {
    return Result.failure('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input');
  }

  const result = await cardsService.toggleLabelCommand(parsed.data);
  if (result.success && boardId) {
    revalidatePath(`/b/${boardId}`);
  }
  return result;
}
