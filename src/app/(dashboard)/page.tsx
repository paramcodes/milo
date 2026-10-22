import { getUserBoardsQuery } from '@/features/boards/boards.service';
import { BoardsDashboard } from '@/features/boards/components/boards-dashboard';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/server/auth/session';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return null;
  }

  const boardsResult = await getUserBoardsQuery(session.userId);
  const boards = boardsResult.success ? boardsResult.data : [];

  return <BoardsDashboard initialBoards={boards} />;
}
