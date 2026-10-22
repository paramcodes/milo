import { db } from '@/server/db/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBoardCommand, getBoardQuery, getUserBoardsQuery } from './boards.service';

describe('boards.service integration (zero-mock SQLite)', () => {
  let userId: string;

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
        name: 'Board Owner',
        email: 'owner@example.com',
        passwordHash: 'hash',
      },
    });
    userId = user.id;
  });

  it('creates a personal board and queries it back', async () => {
    const createResult = await createBoardCommand(
      {
        title: 'Sprint 1',
        color: '#0052CC',
      },
      userId,
    );

    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    expect(createResult.data.title).toBe('Sprint 1');
    expect(createResult.data.color).toBe('#0052CC');

    const getResult = await getBoardQuery(createResult.data.id, userId);
    expect(getResult.success).toBe(true);
    if (!getResult.success) return;

    expect(getResult.data.id).toBe(createResult.data.id);
  });

  it('lists all boards accessible to user', async () => {
    await createBoardCommand({ title: 'Board A', color: '#0052CC' }, userId);
    await createBoardCommand({ title: 'Board B', color: '#00875A' }, userId);

    const listResult = await getUserBoardsQuery(userId);
    expect(listResult.success).toBe(true);
    if (!listResult.success) return;

    expect(listResult.data).toHaveLength(2);
    expect(listResult.data.map((b) => b.title)).toContain('Board A');
    expect(listResult.data.map((b) => b.title)).toContain('Board B');
  });

  it('prevents unauthorized user from viewing private board', async () => {
    const otherUser = await db.user.create({
      data: {
        name: 'Other User',
        email: 'other@example.com',
        passwordHash: 'hash',
      },
    });

    const createResult = await createBoardCommand({ title: 'Private Board' }, userId);
    if (!createResult.success) return;

    const getResult = await getBoardQuery(createResult.data.id, otherUser.id);
    expect(getResult.success).toBe(false);
    if (getResult.success) return;

    expect(getResult.error.code).toBe('UNAUTHORIZED');
  });
});
