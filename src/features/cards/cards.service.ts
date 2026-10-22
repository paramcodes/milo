import { db } from '@/server/db/client';
import { Result } from '@/shared/kernel/result';
import * as cardsRepo from './cards.repo';
import type {
  AddChecklistItemInput,
  CardDto,
  CreateCardInput,
  DeleteCardInput,
  DeleteChecklistItemInput,
  MoveCardInput,
  ToggleChecklistItemInput,
  ToggleLabelInput,
  UpdateCardInput,
} from './cards.schema';

export async function createCardCommand(
  input: CreateCardInput,
  actorId: string,
): Promise<Result<CardDto>> {
  const maxPosition = await cardsRepo.getMaxCardPosition(input.listId);
  const position = maxPosition + 1000;

  const card = await db.$transaction(async (tx) => {
    const newCard = await tx.card.create({
      data: {
        title: input.title,
        listId: input.listId,
        position,
        description: input.description,
      },
    });

    await cardsRepo.createActivityLogTx(
      tx as unknown as typeof db,
      newCard.id,
      actorId,
      'CREATED_CARD',
      JSON.stringify({ title: input.title }),
    );

    return newCard;
  });

  return Result.success(card as unknown as CardDto);
}

export async function updateCardCommand(
  input: UpdateCardInput,
  actorId: string,
): Promise<Result<CardDto>> {
  const existing = await cardsRepo.findCardById(input.cardId);
  if (!existing) {
    return Result.failure('CARD_NOT_FOUND', 'Card not found');
  }

  const updated = await db.$transaction(async (tx) => {
    const card = await tx.card.update({
      where: { id: input.cardId },
      data: {
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        isCompleted: input.isCompleted,
      },
    });

    await cardsRepo.createActivityLogTx(
      tx as unknown as typeof db,
      input.cardId,
      actorId,
      'UPDATED_CARD',
      JSON.stringify({
        title: input.title ?? existing.title,
        isCompleted: input.isCompleted ?? existing.isCompleted,
      }),
    );

    return card;
  });

  return Result.success(updated as unknown as CardDto);
}

export async function moveCardCommand(
  input: MoveCardInput,
  actorId: string,
): Promise<Result<void>> {
  const existing = await cardsRepo.findCardById(input.cardId);
  if (!existing) {
    return Result.failure('CARD_NOT_FOUND', 'Card not found');
  }

  const targetList = await cardsRepo.findListById(input.targetListId);
  if (!targetList) {
    return Result.failure('LIST_NOT_FOUND', 'Target list not found');
  }

  await db.$transaction(async (tx) => {
    if (input.cardIds && input.cardIds.length > 0) {
      const updates = input.cardIds.map((id, index) => ({
        id,
        position: (index + 1) * 1000,
        ...(id === input.cardId ? { listId: input.targetListId } : {}),
      }));
      await cardsRepo.updateCardPositionsTx(tx as unknown as typeof db, updates);
    } else {
      const targetCards = await cardsRepo.getCardsByListId(input.targetListId);
      const hasCollision = targetCards.some(
        (c) => c.id !== input.cardId && c.position === input.newPosition,
      );

      if (hasCollision) {
        const otherCards = targetCards.filter((c) => c.id !== input.cardId);
        const insertIndex = otherCards.findIndex((c) => c.position >= input.newPosition);
        if (insertIndex === -1) {
          otherCards.push({ id: input.cardId, position: input.newPosition });
        } else {
          otherCards.splice(insertIndex, 0, { id: input.cardId, position: input.newPosition });
        }
        const updates = otherCards.map((c, index) => ({
          id: c.id,
          position: (index + 1) * 1000,
          ...(c.id === input.cardId ? { listId: input.targetListId } : {}),
        }));
        await cardsRepo.updateCardPositionsTx(tx as unknown as typeof db, updates);
      } else {
        await cardsRepo.updateCardPositionTx(tx as unknown as typeof db, input);
      }
    }
    await cardsRepo.createActivityLogTx(
      tx as unknown as typeof db,
      input.cardId,
      actorId,
      'MOVED_CARD',
      JSON.stringify({
        fromListId: existing.listId,
        toListId: input.targetListId,
        newPosition: input.newPosition,
      }),
    );
  });

  return Result.success(undefined);
}

export async function deleteCardCommand(
  input: DeleteCardInput,
  _actorId: string,
): Promise<Result<void>> {
  const existing = await cardsRepo.findCardById(input.cardId);
  if (!existing) {
    return Result.failure('CARD_NOT_FOUND', 'Card not found');
  }

  await cardsRepo.deleteCard(input.cardId);
  return Result.success(undefined);
}

export async function getCardDetailsQuery(
  cardId: string,
  _userId: string,
): Promise<Result<CardDto>> {
  const card = await cardsRepo.findCardById(cardId);
  if (!card) {
    return Result.failure('CARD_NOT_FOUND', 'Card not found');
  }

  return Result.success(card as unknown as CardDto);
}

export async function addChecklistItemCommand(
  input: AddChecklistItemInput,
  actorId: string,
): Promise<Result<{ id: string; title: string; isCompleted: boolean; position: number }>> {
  const card = await cardsRepo.findCardById(input.cardId);
  if (!card) {
    return Result.failure('CARD_NOT_FOUND', 'Card not found');
  }

  const position = (card.checklists.length + 1) * 1000;
  const item = await cardsRepo.addChecklistItem({
    cardId: input.cardId,
    title: input.title,
    position,
  });

  await db.$transaction(async (tx) => {
    await cardsRepo.createActivityLogTx(
      tx as unknown as typeof db,
      input.cardId,
      actorId,
      'ADDED_CHECKLIST_ITEM',
      JSON.stringify({ itemTitle: input.title }),
    );
  });

  return Result.success(item);
}

export async function toggleChecklistItemCommand(
  input: ToggleChecklistItemInput,
  actorId: string,
): Promise<Result<{ id: string; isCompleted: boolean }>> {
  const updated = await cardsRepo.updateChecklistItem(input.itemId, {
    isCompleted: input.isCompleted,
  });

  await db.$transaction(async (tx) => {
    await cardsRepo.createActivityLogTx(
      tx as unknown as typeof db,
      updated.cardId,
      actorId,
      'TOGGLED_CHECKLIST_ITEM',
      JSON.stringify({
        itemTitle: updated.title,
        isCompleted: input.isCompleted,
      }),
    );
  });

  return Result.success({ id: updated.id, isCompleted: updated.isCompleted });
}

export async function deleteChecklistItemCommand(
  input: DeleteChecklistItemInput,
): Promise<Result<void>> {
  await cardsRepo.deleteChecklistItem(input.itemId);
  return Result.success(undefined);
}

export async function toggleLabelCommand(
  input: ToggleLabelInput,
): Promise<Result<{ added: boolean }>> {
  const added = await cardsRepo.toggleCardLabel(input.cardId, input.labelId);
  return Result.success({ added });
}
