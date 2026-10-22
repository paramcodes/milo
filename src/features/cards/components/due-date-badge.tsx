'use client';

import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import type React from 'react';
import { useTransition } from 'react';
import { updateCardAction } from '../cards.api';
import { getDueDateStatus } from '../cards.presenter';

interface DueDateBadgeProps {
  cardId: string;
  boardId: string;
  dueDate: Date | string | null;
  isCompleted: boolean;
}

export function DueDateBadge({ cardId, boardId, dueDate, isCompleted }: DueDateBadgeProps) {
  const [, startTransition] = useTransition();
  const statusInfo = getDueDateStatus(dueDate, isCompleted);

  const handleToggleComplete = () => {
    startTransition(async () => {
      await updateCardAction({ cardId, isCompleted: !isCompleted }, boardId);
    });
  };

  const handleSetDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const date = new Date(val);
    startTransition(async () => {
      await updateCardAction({ cardId, dueDate: date }, boardId);
    });
  };

  const handleClearDate = () => {
    startTransition(async () => {
      await updateCardAction({ cardId, dueDate: null }, boardId);
    });
  };

  const statusStyles = {
    COMPLETE: 'bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]',
    OVERDUE: 'bg-[#FFEBE6] text-[#BF2600] border-[#FFBDAD]',
    DUE_SOON: 'bg-[#FFFAE6] text-[#172B4D] border-[#FFE380]',
    UPCOMING: 'bg-[#EBECF0] text-[#172B4D] border-[#DFE1E6]',
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-[#172B4D] flex items-center gap-2">
        <span>📅</span> Due Date
      </h3>

      <div className="flex items-center gap-2">
        {dueDate && statusInfo ? (
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-medium ${
              statusStyles[statusInfo.status]
            }`}
          >
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={handleToggleComplete}
              className="w-3.5 h-3.5 rounded text-[#0052CC] cursor-pointer"
            />
            <span>{statusInfo.formattedDate}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider">
              ({statusInfo.label})
            </span>
          </div>
        ) : null}

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="h-7 px-2 rounded bg-[#091E420A] hover:bg-[#091E4214] text-[#172B4D] font-medium text-xs flex items-center gap-1 transition-colors"
            >
              <span>📅</span> {dueDate ? 'Change date' : 'Set due date'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 flex flex-col gap-3">
            <span className="text-xs font-bold text-[#6B778C] uppercase">Due Date</span>
            <input
              type="date"
              defaultValue={
                dueDate
                  ? new Date(dueDate).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0]
              }
              onChange={handleSetDate}
              className="w-full text-xs p-1.5 border border-[#DFE1E6] rounded"
            />
            {dueDate && (
              <Button
                variant="subtle"
                size="sm"
                onClick={handleClearDate}
                className="text-[#BF2600]"
              >
                Remove due date
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
