'use client';

import React, { useState, useTransition } from 'react';
import { updateBoardAction } from '../boards.api';

interface BoardHeaderProps {
  boardId: string;
  initialTitle: string;
  initialColor: string;
}

export function BoardHeader({ boardId, initialTitle, initialColor }: BoardHeaderProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleBlurOrSubmit = () => {
    setIsEditing(false);
    if (title.trim() === '' || title === initialTitle) {
      setTitle(initialTitle);
      return;
    }

    startTransition(async () => {
      await updateBoardAction({ boardId, title: title.trim() });
    });
  };

  return (
    <div
      className="flex items-center justify-between px-6 py-3 border-b text-white backdrop-blur-sm"
      style={{ backgroundColor: `${initialColor}E6` }}
    >
      <div className="flex items-center gap-4">
        {isEditing ? (
          <input
            type="text"
            value={title}
            ref={(el) => el?.focus()}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlurOrSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleBlurOrSubmit();
              if (e.key === 'Escape') {
                setTitle(initialTitle);
                setIsEditing(false);
              }
            }}
            className="px-2 py-1 text-lg font-bold rounded bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-2 py-1 text-lg font-bold rounded hover:bg-white/20 transition-colors text-left"
          >
            {title}
          </button>
        )}
        {isPending && <span className="text-xs text-white/70">Saving...</span>}
      </div>
    </div>
  );
}
