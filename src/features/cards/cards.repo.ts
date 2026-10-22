import { db } from '@/server/db/client';

export async function findCardById(cardId: string) {
  return await db.card.findUnique({
    where: { id: cardId },
    include: {
      checklists: {
        orderBy: { position: 'asc' },
      },
      labels: {
        include: {
          label: true,
        },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      list: {
        include: { board: true },
      },
    },
  });
}

export async function getMaxCardPosition(listId: string): Promise<number> {
  const lastCard = await db.card.findFirst({
    where: { listId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return lastCard ? lastCard.position : 0;
}

export async function createCard(data: {
  title: string;
  listId: string;
  position: number;
  description?: string;
}) {
  return await db.card.create({
    data,
  });
}

export async function updateCard(
  cardId: string,
  data: {
    title?: string;
    description?: string;
    dueDate?: Date | null;
    isCompleted?: boolean;
    listId?: string;
    position?: number;
  },
) {
  return await db.card.update({
    where: { id: cardId },
    data,
  });
}

export async function updateCardPositionTx(
  tx: typeof db,
  data: {
    cardId: string;
    targetListId: string;
    newPosition: number;
  },
) {
  return await tx.card.update({
    where: { id: data.cardId },
    data: {
      listId: data.targetListId,
      position: data.newPosition,
    },
  });
}

export async function deleteCard(cardId: string) {
  return await db.card.delete({
    where: { id: cardId },
  });
}

export async function createActivityLogTx(
  tx: typeof db,
  cardId: string,
  actorId: string,
  action: string,
  details: string,
) {
  return await tx.activityLog.create({
    data: {
      cardId,
      actorId,
      action,
      details,
    },
  });
}

export async function addChecklistItem(data: {
  cardId: string;
  title: string;
  position: number;
}) {
  return await db.checklistItem.create({
    data,
  });
}

export async function updateChecklistItem(
  itemId: string,
  data: { isCompleted?: boolean; title?: string },
) {
  return await db.checklistItem.update({
    where: { id: itemId },
    data,
  });
}

export async function deleteChecklistItem(itemId: string) {
  return await db.checklistItem.delete({
    where: { id: itemId },
  });
}

export async function toggleCardLabel(cardId: string, labelId: string) {
  const existing = await db.cardLabel.findUnique({
    where: {
      cardId_labelId: { cardId, labelId },
    },
  });

  if (existing) {
    await db.cardLabel.delete({
      where: {
        cardId_labelId: { cardId, labelId },
      },
    });
    return false;
  }

  await db.cardLabel.create({
    data: { cardId, labelId },
  });
  return true;
}

export async function getBoardLabels(boardId: string) {
  return await db.label.findMany({
    where: {
      OR: [{ boardId }, { boardId: null }],
    },
  });
}
