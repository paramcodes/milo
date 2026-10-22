import { getBoardQuery } from '@/features/boards/boards.service';
import { BoardCanvas } from '@/features/boards/components/board-canvas';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/server/auth/session';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

interface BoardPageProps {
  params: {
    boardId: string;
  };
}

export default async function BoardPage({ params }: BoardPageProps) {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    redirect('/login');
  }

  const result = await getBoardQuery(params.boardId, session.userId);
  if (!result.success) {
    if (result.error.code === 'BOARD_NOT_FOUND') {
      notFound();
    }
    redirect('/');
  }

  return <BoardCanvas board={result.data} />;
}
