import { hashPassword } from '@/server/auth/session';
import { db } from '@/server/db/client';

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create or update Demo User
  const passwordHash = await hashPassword('password123');
  const user = await db.user.upsert({
    where: { email: 'demo@milo.app' },
    update: { passwordHash },
    create: {
      email: 'demo@milo.app',
      name: 'Demo User',
      passwordHash,
    },
  });
  console.log(`👤 Demo user: ${user.email} (password: password123)`);

  // 2. Create Demo Team
  const team = await db.team.create({
    data: {
      name: 'Acme Product Team',
      members: {
        create: {
          userId: user.id,
          role: 'ADMIN',
        },
      },
    },
  });

  // 3. Create "Sprint Planning" Board
  const board = await db.board.create({
    data: {
      title: 'Sprint Planning',
      color: '#0052CC',
      userId: user.id,
      teamId: team.id,
    },
  });
  console.log(`📋 Created Board: "${board.title}" (${board.id})`);

  // 4. Create Board Labels
  const labelFeature = await db.label.create({
    data: { name: 'Feature', color: 'purple', boardId: board.id },
  });
  const labelBug = await db.label.create({
    data: { name: 'High Priority', color: 'red', boardId: board.id },
  });
  const labelDesign = await db.label.create({
    data: { name: 'Design', color: 'blue', boardId: board.id },
  });
  const labelReady = await db.label.create({
    data: { name: 'Ready', color: 'green', boardId: board.id },
  });

  // 5. Create Standard Lists
  const todoList = await db.list.create({
    data: { title: 'To Do', position: 1000, boardId: board.id },
  });
  const inProgressList = await db.list.create({
    data: { title: 'In Progress', position: 2000, boardId: board.id },
  });
  const inReviewList = await db.list.create({
    data: { title: 'In Review', position: 3000, boardId: board.id },
  });
  const doneList = await db.list.create({
    data: { title: 'Done', position: 4000, boardId: board.id },
  });

  // 6. Populate Cards, Checklists and Activities
  // Card 1 in To Do
  const card1 = await db.card.create({
    data: {
      title: 'Design Dark Mode tokens',
      description:
        'Implement complementary dark mode color variables using Atlassian token definitions.',
      position: 1000,
      dueDate: new Date(Date.now() + 86400000 * 3),
      listId: todoList.id,
      labels: {
        create: [{ labelId: labelDesign.id }, { labelId: labelFeature.id }],
      },
      checklists: {
        create: [
          { title: 'Audit contrast ratios (WCAG AA)', isCompleted: true, position: 1000 },
          { title: 'Define background and surface tokens', isCompleted: false, position: 2000 },
          { title: 'Test card hover elevations', isCompleted: false, position: 3000 },
        ],
      },
    },
  });
  await db.activityLog.create({
    data: {
      cardId: card1.id,
      actorId: user.id,
      action: 'CREATED_CARD',
      details: JSON.stringify({ title: card1.title }),
    },
  });

  // Card 2 in In Progress
  const card2 = await db.card.create({
    data: {
      title: 'Optimistic Drag-and-Drop syncing',
      description:
        'Ensure cards update on client immediately and sync with Server Actions in the background.',
      position: 1000,
      dueDate: new Date(Date.now() + 86400000),
      listId: inProgressList.id,
      labels: {
        create: [{ labelId: labelFeature.id }, { labelId: labelBug.id }],
      },
      checklists: {
        create: [
          { title: 'Intra-list card reordering', isCompleted: true, position: 1000 },
          { title: 'Cross-list transfer', isCompleted: true, position: 2000 },
          { title: 'Server Action sync failure rollback', isCompleted: false, position: 3000 },
        ],
      },
    },
  });
  await db.activityLog.create({
    data: {
      cardId: card2.id,
      actorId: user.id,
      action: 'MOVED_CARD',
      details: JSON.stringify({ fromListId: todoList.id, toListId: inProgressList.id }),
    },
  });

  // Card in In Review
  const reviewCard = await db.card.create({
    data: {
      title: 'Code review: repo-service layer boundary',
      description: 'Review adherence to ADR 004 across vertical slices.',
      position: 1000,
      listId: inReviewList.id,
      labels: {
        create: [{ labelId: labelDesign.id }],
      },
    },
  });
  await db.activityLog.create({
    data: {
      cardId: reviewCard.id,
      actorId: user.id,
      action: 'CREATED_CARD',
      details: JSON.stringify({ title: reviewCard.title }),
    },
  });

  // Card 3 in Done
  const card3 = await db.card.create({
    data: {
      title: 'Setup AST architecture linter',
      description: 'Custom script enforcing layer import boundaries across vertical slices.',
      position: 1000,
      isCompleted: true,
      dueDate: new Date(Date.now() - 86400000),
      listId: doneList.id,
      labels: {
        create: [{ labelId: labelReady.id }],
      },
    },
  });
  await db.activityLog.create({
    data: {
      cardId: card3.id,
      actorId: user.id,
      action: 'CREATED_CARD',
      details: JSON.stringify({ title: card3.title }),
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
