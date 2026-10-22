'use client';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import type React from 'react';
import { useState, useTransition } from 'react';
import {
  addChecklistItemAction,
  deleteChecklistItemAction,
  toggleChecklistItemAction,
} from '../cards.api';
import { calculateChecklistProgress } from '../cards.presenter';

interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  position: number;
}

interface ChecklistProps {
  cardId: string;
  boardId: string;
  items: ChecklistItem[];
}

export function Checklist({ cardId, boardId, items }: ChecklistProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  const progress = calculateChecklistProgress(items);

  const handleToggle = (itemId: string, currentCompleted: boolean) => {
    startTransition(async () => {
      await toggleChecklistItemAction({ itemId, isCompleted: !currentCompleted }, boardId);
    });
  };

  const handleDelete = (itemId: string) => {
    startTransition(async () => {
      await deleteChecklistItemAction({ itemId }, boardId);
    });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    startTransition(async () => {
      const result = await addChecklistItemAction({ cardId, title: newItemTitle.trim() }, boardId);
      if (result.success) {
        setNewItemTitle('');
        setIsAdding(false);
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#172B4D] flex items-center gap-2">
          <span>☑</span> Checklist
        </h3>
        <span className="text-xs font-semibold text-[#6B778C]">
          {progress.fractionText} ({progress.percentage}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-[#091E4214] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#00875A] transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-1.5 mt-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center justify-between gap-3 p-1.5 rounded hover:bg-[#091E420A] transition-colors"
          >
            <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={() => handleToggle(item.id, item.isCompleted)}
                disabled={isPending}
                className="w-4 h-4 rounded text-[#0052CC] border-[#DFE1E6] focus:ring-[#0052CC]"
              />
              <span
                className={`text-sm ${
                  item.isCompleted ? 'line-through text-[#6B778C]' : 'text-[#172B4D]'
                }`}
              >
                {item.title}
              </span>
            </label>

            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              disabled={isPending}
              className="opacity-0 group-hover:opacity-100 text-[#6B778C] hover:text-[#DE350B] p-1 text-xs rounded transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add Item Form */}
      {isAdding ? (
        <form onSubmit={handleAddItem} className="flex flex-col gap-2 mt-2">
          <Input
            value={newItemTitle}
            ref={(el) => el?.focus()}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Add an item..."
            className="h-8 text-sm"
            required
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              Add
            </Button>
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewItemTitle('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="self-start mt-1"
        >
          Add an item
        </Button>
      )}
    </div>
  );
}
