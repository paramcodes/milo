import { Result } from '@/shared/kernel/result';
import * as boardsRepo from './boards.repo';
import type {
  BoardDetailDto,
  BoardSummaryDto,
  CreateBoardInput,
  UpdateBoardInput,
} from './boards.schema';

export async function createBoardCommand(
  input: CreateBoardInput,
  userId: string,
): Promise<Result<BoardSummaryDto>> {
  if (input.teamId) {
    const isMember = await boardsRepo.isUserTeamMember(input.teamId, userId);
    if (!isMember) {
      return Result.failure('UNAUTHORIZED', 'You are not a member of this team');
    }
  }

  const board = await boardsRepo.createBoard({
    title: input.title,
    color: input.color || '#0052CC',
    userId: input.teamId ? undefined : userId,
    teamId: input.teamId,
  });

  return Result.success({
    id: board.id,
    title: board.title,
    color: board.color,
    userId: board.userId,
    teamId: board.teamId,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  });
}

export async function updateBoardCommand(
  input: UpdateBoardInput,
  userId: string,
): Promise<Result<BoardSummaryDto>> {
  const board = await boardsRepo.findBoardById(input.boardId);
  if (!board) {
    return Result.failure('BOARD_NOT_FOUND', 'Board not found');
  }

  const hasAccess = await checkBoardAccess(board, userId);
  if (!hasAccess) {
    return Result.failure('UNAUTHORIZED', 'You do not have permission to edit this board');
  }

  const updated = await boardsRepo.updateBoard(input.boardId, {
    title: input.title,
    color: input.color,
  });

  return Result.success({
    id: updated.id,
    title: updated.title,
    color: updated.color,
    userId: updated.userId,
    teamId: updated.teamId,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
}

export async function getBoardQuery(
  boardId: string,
  userId: string,
): Promise<Result<BoardDetailDto>> {
  const board = await boardsRepo.findBoardById(boardId);
  if (!board) {
    return Result.failure('BOARD_NOT_FOUND', 'Board not found');
  }

  const hasAccess = await checkBoardAccess(board, userId);
  if (!hasAccess) {
    return Result.failure('UNAUTHORIZED', 'You do not have permission to view this board');
  }

  return Result.success(board as unknown as BoardDetailDto);
}

export async function getUserBoardsQuery(userId: string): Promise<Result<BoardSummaryDto[]>> {
  const boards = await boardsRepo.findUserBoards(userId);
  return Result.success(
    boards.map((b) => ({
      id: b.id,
      title: b.title,
      color: b.color,
      userId: b.userId,
      teamId: b.teamId,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    })),
  );
}

async function checkBoardAccess(
  board: { userId: string | null; teamId: string | null },
  userId: string,
): Promise<boolean> {
  if (board.userId === userId) return true;
  if (board.teamId) {
    return await boardsRepo.isUserTeamMember(board.teamId, userId);
  }
  return false;
}
