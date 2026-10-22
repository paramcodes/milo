'use client';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import type React from 'react';
import { useState, useTransition } from 'react';
import { createListAction } from '../lists.api';

interface AddListInputProps {
  boardId: string;
}

export function AddListInput({ boardId }: AddListInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      const result = await createListAction({ boardId, title: title.trim() });
      if (result.success) {
        setTitle('');
        setIsOpen(false);
      }
    });
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-72 shrink-0 h-11 px-4 rounded-xl bg-white/30 hover:bg-white/40 text-white font-medium text-sm flex items-center gap-2 backdrop-blur-md transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        Add another list
      </button>
    );
  }

  return (
    <form
      onSubmit={handleCreate}
      className="w-72 shrink-0 bg-[#F1F2F4] p-3 rounded-xl shadow-md border border-[#091E4224] flex flex-col gap-2"
    >
      <Input
        value={title}
        ref={(el) => el?.focus()}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter list title..."
        className="h-8 text-sm bg-white"
        required
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Adding...' : 'Add list'}
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
