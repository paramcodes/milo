'use client';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState, useTransition } from 'react';
import { createBoardAction } from '../boards.api';
import type { BoardSummaryDto } from '../boards.schema';

interface BoardsDashboardProps {
  initialBoards: BoardSummaryDto[];
}

export function BoardsDashboard({ initialBoards }: BoardsDashboardProps) {
  const router = useRouter();
  const [boards, setBoards] = useState(initialBoards);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setError(null);
    startTransition(async () => {
      const result = await createBoardAction({ title: newTitle.trim() });
      if (!result.success) {
        setError(result.error.message);
      } else {
        setBoards((prev) => [result.data, ...prev]);
        setNewTitle('');
        setIsCreating(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-[#172B4D] mb-6 flex items-center gap-2">
        <span className="w-2.5 h-6 bg-[#0052CC] rounded-sm inline-block" />
        Your Workspaces & Boards
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {boards.map((board) => (
          <Link
            key={board.id}
            href={`/b/${board.id}`}
            className="group relative h-28 rounded-md p-3 text-white font-semibold shadow transition-transform hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between overflow-hidden"
            style={{ backgroundColor: board.color || '#0052CC' }}
          >
            <span className="truncate group-hover:underline">{board.title}</span>
            <span className="text-xs text-white/70 font-normal">
              Updated {new Date(board.updatedAt).toLocaleDateString()}
            </span>
          </Link>
        ))}

        {isCreating ? (
          <form
            onSubmit={handleCreate}
            className="h-28 rounded-md p-3 bg-white border-2 border-[#0052CC] shadow flex flex-col justify-between"
          >
            {error && <span className="text-xs text-[#BF2600] truncate">{error}</span>}
            <Input
              value={newTitle}
              ref={(el) => el?.focus()}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Board title..."
              className="h-8 text-sm"
              required
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="subtle" size="sm" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="h-28 rounded-md bg-[#091E420A] hover:bg-[#091E4214] text-[#172B4D] font-medium border border-dashed border-[#DFE1E6] flex items-center justify-center transition-colors text-sm"
          >
            + Create new board
          </button>
        )}
      </div>
    </div>
  );
}
