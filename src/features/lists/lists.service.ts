import { Result } from '@/shared/kernel/result';
import * as listsRepo from './lists.repo';
import type {
  CreateListInput,
  DeleteListInput,
  ListDto,
  ReorderListsInput,
  UpdateListTitleInput,
} from './lists.schema';

export async function createListCommand(
  input: CreateListInput,
  _userId: string,
): Promise<Result<ListDto>> {
  const maxPosition = await listsRepo.getMaxListPosition(input.boardId);
  const position = maxPosition + 1000;

  const list = await listsRepo.createList({
    title: input.title,
    position,
    boardId: input.boardId,
  });

  return Result.success({
    id: list.id,
    title: list.title,
    position: list.position,
    boardId: list.boardId,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  });
}

export async function updateListTitleCommand(
  input: UpdateListTitleInput,
  _userId: string,
): Promise<Result<ListDto>> {
  const list = await listsRepo.findListById(input.listId);
  if (!list) {
    return Result.failure('LIST_NOT_FOUND', 'List not found');
  }

  const updated = await listsRepo.updateListTitle(input.listId, input.title);
  return Result.success({
    id: updated.id,
    title: updated.title,
    position: updated.position,
    boardId: updated.boardId,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
}

export async function reorderListsCommand(
  input: ReorderListsInput,
  _userId: string,
): Promise<Result<void>> {
  const updates = input.listIds.map((id, index) => ({
    id,
    position: (index + 1) * 1000,
  }));

  await listsRepo.updateListPositions(updates);
  return Result.success(undefined);
}

export async function deleteListCommand(
  input: DeleteListInput,
  _userId: string,
): Promise<Result<void>> {
  const list = await listsRepo.findListById(input.listId);
  if (!list) {
    return Result.failure('LIST_NOT_FOUND', 'List not found');
  }

  await listsRepo.deleteList(input.listId);
  return Result.success(undefined);
}
