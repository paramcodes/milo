import { db } from '@/server/db/client';

export async function findListById(listId: string) {
  return await db.list.findUnique({
    where: { id: listId },
    include: { board: true },
  });
}

export async function findListsByBoardId(boardId: string) {
  return await db.list.findMany({
    where: { boardId },
    orderBy: { position: 'asc' },
  });
}

export async function getMaxListPosition(boardId: string): Promise<number> {
  const lastList = await db.list.findFirst({
    where: { boardId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return lastList ? lastList.position : 0;
}

export async function createList(data: {
  title: string;
  position: number;
  boardId: string;
}) {
  return await db.list.create({
    data,
  });
}

export async function updateListTitle(listId: string, title: string) {
  return await db.list.update({
    where: { id: listId },
    data: { title },
  });
}

export async function updateListPositions(updates: Array<{ id: string; position: number }>) {
  return await db.$transaction(
    updates.map((update) =>
      db.list.update({
        where: { id: update.id },
        data: { position: update.position },
      }),
    ),
  );
}

export async function deleteList(listId: string) {
  return await db.list.delete({
    where: { id: listId },
  });
}
