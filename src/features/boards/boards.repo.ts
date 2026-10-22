import { db } from '@/server/db/client';

export async function findBoardById(boardId: string) {
  return await db.board.findUnique({
    where: { id: boardId },
    include: {
      lists: {
        orderBy: { position: 'asc' },
        include: {
          cards: {
            orderBy: { position: 'asc' },
            include: {
              labels: {
                include: {
                  label: true,
                },
              },
              checklists: {
                orderBy: { position: 'asc' },
              },
            },
          },
        },
      },
    },
  });
}

export async function findUserBoards(userId: string) {
  return await db.board.findMany({
    where: {
      OR: [
        { userId },
        {
          team: {
            members: {
              some: { userId },
            },
          },
        },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createBoard(data: {
  title: string;
  color: string;
  userId?: string;
  teamId?: string;
}) {
  return await db.board.create({
    data,
  });
}

export async function updateBoard(
  boardId: string,
  data: {
    title?: string;
    color?: string;
  },
) {
  return await db.board.update({
    where: { id: boardId },
    data,
  });
}

export async function isUserTeamMember(teamId: string, userId: string): Promise<boolean> {
  const member = await db.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
  });
  return !!member;
}
