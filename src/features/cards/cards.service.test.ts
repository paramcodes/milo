import { db } from '@/server/db/client';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createCardCommand,
  deleteCardCommand,
  moveCardCommand,
  updateCardCommand,
} from './cards.service';

describe('cards.service integration (zero-mock SQLite)', () => {
  let userId: string;
  let listId1: string;
  let listId2: string;

  beforeEach(async () => {
    await db.cardLabel.deleteMany();
    await db.activityLog.deleteMany();
    await db.checklistItem.deleteMany();
    await db.card.deleteMany();
    await db.list.deleteMany();
    await db.board.deleteMany();
    await db.session.deleteMany();
    await db.user.deleteMany();

    const user = await db.user.create({
      data: {
        name: 'Card Worker',
        email: 'cards@example.com',
        passwordHash: 'hash',
      },
    });
    userId = user.id;

    const board = await db.board.create({
      data: { title: 'Cards Board', userId },
    });

    const l1 = await db.list.create({
      data: { title: 'List 1', position: 1000, boardId: board.id },
    });
    const l2 = await db.list.create({
      data: { title: 'List 2', position: 2000, boardId: board.id },
    });
    listId1 = l1.id;
    listId2 = l2.id;
  });

  it('creates card with spaced position (1000, 2000)', async () => {
    const c1 = await createCardCommand({ listId: listId1, title: 'Card 1' }, userId);
    const c2 = await createCardCommand({ listId: listId1, title: 'Card 2' }, userId);

    expect(c1.success).toBe(true);
    expect(c2.success).toBe(true);
    if (!c1.success || !c2.success) return;

    expect(c1.data.position).toBe(1000);
    expect(c2.data.position).toBe(2000);
  });

  it('updates card title and description', async () => {
    const c = await createCardCommand({ listId: listId1, title: 'Card Title' }, userId);
    if (!c.success) return;

    const updated = await updateCardCommand(
      {
        cardId: c.data.id,
        title: 'New Title',
        description: 'New Description',
      },
      userId,
    );

    expect(updated.success).toBe(true);
    if (!updated.success) return;
    expect(updated.data.title).toBe('New Title');
    expect(updated.data.description).toBe('New Description');
  });

  it('moves card between lists and updates position', async () => {
    const c = await createCardCommand({ listId: listId1, title: 'Move Me' }, userId);
    if (!c.success) return;

    const moveResult = await moveCardCommand(
      {
        cardId: c.data.id,
        targetListId: listId2,
        newPosition: 1500,
      },
      userId,
    );

    expect(moveResult.success).toBe(true);

    const cardInDb = await db.card.findUnique({ where: { id: c.data.id } });
    expect(cardInDb?.listId).toBe(listId2);
    expect(cardInDb?.position).toBe(1500);
  });

  it('returns LIST_NOT_FOUND when moving card to a nonexistent or deleted list', async () => {
    const c = await createCardCommand({ listId: listId1, title: 'Move Me' }, userId);
    if (!c.success) return;

    const moveResult = await moveCardCommand(
      {
        cardId: c.data.id,
        targetListId: 'nonexistent-list-id',
        newPosition: 1000,
      },
      userId,
    );

    expect(moveResult.success).toBe(false);
    if (!moveResult.success) {
      expect(moveResult.error.code).toBe('LIST_NOT_FOUND');
    }
  });

  it('deletes card', async () => {
    const c = await createCardCommand({ listId: listId1, title: 'Delete Me' }, userId);
    if (!c.success) return;

    const deleteResult = await deleteCardCommand({ cardId: c.data.id }, userId);
    expect(deleteResult.success).toBe(true);

    const cardInDb = await db.card.findUnique({ where: { id: c.data.id } });
    expect(cardInDb).toBeNull();
  });

  it('records ActivityLog entries on card creation and moves', async () => {
    const c = await createCardCommand({ listId: listId1, title: 'Audited Card' }, userId);
    if (!c.success) return;

    await moveCardCommand({ cardId: c.data.id, targetListId: listId2, newPosition: 3000 }, userId);

    const logs = await db.activityLog.findMany({
      where: { cardId: c.data.id },
      orderBy: { createdAt: 'asc' },
    });

    expect(logs).toHaveLength(2);
    expect(logs[0]?.action).toBe('CREATED_CARD');
    expect(logs[1]?.action).toBe('MOVED_CARD');
  });
});
