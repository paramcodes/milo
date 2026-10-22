import * as cardsApi from '@/features/cards/cards.api';
import { Result } from '@/shared/kernel/result';
import type { DropResult } from '@hello-pangea/dnd';
import { act, render, screen } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardCanvas } from './board-canvas';

let capturedOnDragEnd: ((result: DropResult) => void) | null = null;

vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({
    onDragEnd,
    children,
  }: {
    onDragEnd?: (result: DropResult) => void;
    children: React.ReactNode;
  }) => {
    capturedOnDragEnd = onDragEnd ?? null;
    return <div data-testid="dnd-context">{children}</div>;
  },
  Droppable: ({
    children,
  }: {
    children: (
      provided: {
        innerRef: () => void;
        droppableProps: Record<string, unknown>;
        placeholder: React.ReactNode;
      },
      snapshot: Record<string, unknown>,
    ) => React.ReactNode;
  }) => children({ innerRef: () => {}, droppableProps: {}, placeholder: null }, {}),
  Draggable: ({
    children,
  }: {
    children: (
      provided: {
        innerRef: () => void;
        draggableProps: Record<string, unknown>;
        dragHandleProps: Record<string, unknown>;
      },
      snapshot: Record<string, unknown>,
    ) => React.ReactNode;
  }) => children({ innerRef: () => {}, draggableProps: {}, dragHandleProps: {} }, {}),
}));

describe('BoardCanvas', () => {
  const mockBoard = {
    id: 'b1',
    title: 'Dev Board',
    color: '#0052CC',
    userId: 'u1',
    teamId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lists: [
      {
        id: 'l1',
        title: 'To Do',
        position: 1000,
        cards: [
          {
            id: 'c1',
            title: 'First Card',
            description: null,
            position: 1000,
            dueDate: null,
            isCompleted: false,
            listId: 'l1',
            createdAt: new Date(),
            updatedAt: new Date(),
            labels: [],
            checklists: [],
          },
        ],
      },
      {
        id: 'l2',
        title: 'In Progress',
        position: 2000,
        cards: [],
      },
    ],
  };

  beforeEach(() => {
    capturedOnDragEnd = null;
    vi.restoreAllMocks();
  });

  it('renders board canvas with list columns and add list button', () => {
    render(<BoardCanvas board={mockBoard} />);

    expect(screen.getByText('Dev Board')).toBeDefined();
    expect(screen.getByText('To Do')).toBeDefined();
    expect(screen.getByText('First Card')).toBeDefined();
    expect(screen.getByText('Add another list')).toBeDefined();
  });

  it('rolls back optimistic card move when moveCardAction returns failure', async () => {
    vi.spyOn(cardsApi, 'moveCardAction').mockResolvedValue(
      Result.failure('LIST_NOT_FOUND', 'Target list not found'),
    );

    render(<BoardCanvas board={mockBoard} />);
    expect(capturedOnDragEnd).not.toBeNull();

    // Drag c1 from l1 (index 0) to l2 (index 0)
    await act(async () => {
      capturedOnDragEnd?.({
        draggableId: 'c1',
        type: 'card',
        source: { droppableId: 'l1', index: 0 },
        destination: { droppableId: 'l2', index: 0 },
        reason: 'DROP',
        mode: 'FLUID',
        combine: null,
      });
    });

    // Expect card to have rolled back to l1
    const cardEl = screen.getByText('First Card');
    const l1Column = screen.getByText('To Do').closest('div');
    expect(l1Column?.parentElement?.contains(cardEl)).toBe(true);
  });

  it('discards stale out-of-order server responses during rapid successive drags', async () => {
    let resolveFirst: ((val: Result<void>) => void) | null = null;
    let resolveSecond: ((val: Result<void>) => void) | null = null;

    let callCount = 0;
    vi.spyOn(cardsApi, 'moveCardAction').mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      return new Promise((resolve) => {
        resolveSecond = resolve;
      });
    });

    render(<BoardCanvas board={mockBoard} />);

    // Rapid Drag 1: c1 from l1 -> l2
    await act(async () => {
      capturedOnDragEnd?.({
        draggableId: 'c1',
        type: 'card',
        source: { droppableId: 'l1', index: 0 },
        destination: { droppableId: 'l2', index: 0 },
        reason: 'DROP',
        mode: 'FLUID',
        combine: null,
      });
    });

    // Rapid Drag 2: c1 from l2 -> l1
    await act(async () => {
      capturedOnDragEnd?.({
        draggableId: 'c1',
        type: 'card',
        source: { droppableId: 'l2', index: 0 },
        destination: { droppableId: 'l1', index: 0 },
        reason: 'DROP',
        mode: 'FLUID',
        combine: null,
      });
    });

    // Drag 2 resolves FIRST (success)
    await act(async () => {
      resolveSecond?.(Result.success(undefined));
    });

    // Drag 1 resolves LATER with failure
    await act(async () => {
      resolveFirst?.(Result.failure('LIST_NOT_FOUND', 'Late response'));
    });

    // Card should still be in l1 (not overwritten or rolled back by stale drag 1 response)
    const cardEl = screen.getByText('First Card');
    const l1Column = screen.getByText('To Do').closest('div');
    expect(l1Column?.parentElement?.contains(cardEl)).toBe(true);
  });
});
