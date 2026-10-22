import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { BoardCanvas } from './board-canvas';

describe('BoardCanvas', () => {
  it('renders board canvas with list columns and add list button', () => {
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
      ],
    };

    render(<BoardCanvas board={mockBoard} />);

    expect(screen.getByText('Dev Board')).toBeDefined();
    expect(screen.getByText('To Do')).toBeDefined();
    expect(screen.getByText('First Card')).toBeDefined();
    expect(screen.getByText('Add another list')).toBeDefined();
  });
});
