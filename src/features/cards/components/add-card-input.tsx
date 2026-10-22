'use client';

import { Button } from '@/shared/ui/button';
import type React from 'react';
import { useState, useTransition } from 'react';
import { createCardAction } from '../cards.api';

interface AddCardInputProps {
  listId: string;
  boardId: string;
}

export function AddCardInput({ listId, boardId }: AddCardInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      const result = await createCardAction({ listId, title: title.trim() }, boardId);
      if (result.success) {
        setTitle('');
      }
    });
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-8 px-3 rounded-lg hover:bg-[#091E4214] text-[#172B4D] font-medium text-sm flex items-center gap-1.5 transition-colors text-left"
      >
        <span className="text-base leading-none text-[#6B778C]">+</span>
        <span className="text-xs text-[#6B778C]">Add a card</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleCreate} className="flex flex-col gap-2">
      <textarea
        value={title}
        ref={(el) => el?.focus()}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCreate();
          }
          if (e.key === 'Escape') {
            setIsOpen(false);
            setTitle('');
          }
        }}
        placeholder="Enter a title for this card..."
        className="w-full min-h-[64px] p-2 text-sm bg-white rounded-lg shadow-sm border border-[#DFE1E6] text-[#172B4D] placeholder:text-[#6B778C] resize-none focus:outline-none focus:border-[#4C9AFF]"
        rows={2}
      />
      <div className="flex items-center gap-1.5">
        <Button type="submit" size="sm" disabled={isPending || !title.trim()}>
          {isPending ? 'Adding...' : 'Add card'}
        </Button>
        <Button
          type="button"
          variant="subtle"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setTitle('');
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
