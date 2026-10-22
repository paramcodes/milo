import { db } from '@/server/db/client';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createListCommand,
  deleteListCommand,
  reorderListsCommand,
  updateListTitleCommand,
} from './lists.service';

describe('lists.service integration (zero-mock SQLite)', () => {
  let userId: string;
  let boardId: string;

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
        name: 'List Owner',
        email: 'listowner@example.com',
        passwordHash: 'hash',
      },
    });
    userId = user.id;

    const board = await db.board.create({
      data: {
        title: 'Project Board',
        userId,
      },
    });
    boardId = board.id;
  });

  it('creates lists with sequential positions spaced by 1000', async () => {
    const list1 = await createListCommand({ title: 'To Do', boardId }, userId);
    const list2 = await createListCommand({ title: 'Doing', boardId }, userId);

    expect(list1.success).toBe(true);
    expect(list2.success).toBe(true);
    if (!list1.success || !list2.success) return;

    expect(list1.data.position).toBe(1000);
    expect(list2.data.position).toBe(2000);
  });

  it('updates list title', async () => {
    const list = await createListCommand({ title: 'Initial Title', boardId }, userId);
    if (!list.success) return;

    const updated = await updateListTitleCommand(
      { listId: list.data.id, title: 'Renamed Title' },
      userId,
    );

    expect(updated.success).toBe(true);
    if (!updated.success) return;
    expect(updated.data.title).toBe('Renamed Title');
  });

  it('reorders lists using reorder math', async () => {
    const l1 = await createListCommand({ title: 'L1', boardId }, userId);
    const l2 = await createListCommand({ title: 'L2', boardId }, userId);
    const l3 = await createListCommand({ title: 'L3', boardId }, userId);
    if (!l1.success || !l2.success || !l3.success) return;

    const reordered = await reorderListsCommand(
      {
        boardId,
        listIds: [l3.data.id, l1.data.id, l2.data.id],
      },
      userId,
    );

    expect(reordered.success).toBe(true);

    const listsInDb = await db.list.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });

    expect(listsInDb.map((l) => l.title)).toEqual(['L3', 'L1', 'L2']);
    expect(listsInDb.map((l) => l.position)).toEqual([1000, 2000, 3000]);
  });

  it('deletes list and cascades to contained cards', async () => {
    const list = await createListCommand({ title: 'Will Delete', boardId }, userId);
    if (!list.success) return;

    // Add a card directly to check cascade
    await db.card.create({
      data: {
        title: 'Child Card',
        position: 1000,
        listId: list.data.id,
      },
    });

    const deleteResult = await deleteListCommand({ listId: list.data.id }, userId);
    expect(deleteResult.success).toBe(true);

    const listInDb = await db.list.findUnique({ where: { id: list.data.id } });
    expect(listInDb).toBeNull();

    const cardsInDb = await db.card.findMany({ where: { listId: list.data.id } });
    expect(cardsInDb).toHaveLength(0);
  });
});
