import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { CardModal } from './card-modal';

describe('CardModal', () => {
  const mockCard = {
    id: 'c1',
    title: 'Design Wireframes',
    description: 'Create initial Figma mockups for board canvas',
    position: 1000,
    dueDate: null,
    isCompleted: false,
    listId: 'l1',
    createdAt: new Date(),
    updatedAt: new Date(),
    checklists: [],
    labels: [],
    activities: [],
  };

  it('renders card title and description when open', () => {
    render(<CardModal card={mockCard} boardId="b1" isOpen={true} onClose={() => {}} />);

    expect(screen.getByDisplayValue('Design Wireframes')).toBeDefined();
    expect(screen.getByText('Create initial Figma mockups for board canvas')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Delete card' })).toBeDefined();
  });
});
