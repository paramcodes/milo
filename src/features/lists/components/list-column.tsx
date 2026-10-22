'use client';

import type React from 'react';
import { useState, useTransition } from 'react';
import { deleteListAction, updateListTitleAction } from '../lists.api';

interface ListColumnProps {
  id: string;
  title: string;
  boardId: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function ListColumn({ id, title, boardId, children, footer }: ListColumnProps) {
  const [currentTitle, setCurrentTitle] = useState(title);
  const [isEditing, setIsEditing] = useState(false);
  const [, startTransition] = useTransition();

  const handleTitleSubmit = () => {
    setIsEditing(false);
    if (!currentTitle.trim() || currentTitle === title) {
      setCurrentTitle(title);
      return;
    }

    startTransition(async () => {
      await updateListTitleAction({ listId: id, title: currentTitle.trim() });
    });
  };

  const handleDelete = () => {
    if (confirm(`Delete list "${title}" and all its cards?`)) {
      startTransition(async () => {
        await deleteListAction({ listId: id }, boardId);
      });
    }
  };

  return (
    <div className="w-72 shrink-0 bg-[#F1F2F4] rounded-xl shadow-sm border border-[#091E4214] max-h-[calc(100vh-130px)] flex flex-col">
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2 select-none">
        {isEditing ? (
          <input
            type="text"
            value={currentTitle}
            ref={(el) => el?.focus()}
            onChange={(e) => setCurrentTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setCurrentTitle(title);
                setIsEditing(false);
              }
            }}
            className="w-full px-1.5 py-0.5 text-sm font-semibold rounded bg-white text-[#172B4D] border border-[#0052CC] focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-left font-semibold text-sm text-[#172B4D] px-1.5 py-0.5 rounded hover:bg-[#091E4214] truncate flex-1"
          >
            {title}
          </button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          title="Delete list"
          className="text-[#6B778C] hover:text-[#DE350B] hover:bg-[#091E4214] p-1 rounded text-xs transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Cards Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-2 py-1 flex flex-col gap-2 min-h-2">{children}</div>

      {/* Footer */}
      {footer && <div className="p-2 pt-1">{footer}</div>}
    </div>
  );
}
