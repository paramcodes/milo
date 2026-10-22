'use client';

import { labelColors } from '@/shared/ui/atlassian-tokens';
import { Badge } from '@/shared/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import React, { useTransition } from 'react';
import { toggleLabelAction } from '../cards.api';

interface LabelPickerProps {
  cardId: string;
  boardId: string;
  selectedLabels: Array<{
    label: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

const DEFAULT_LABELS = [
  { id: 'lbl-green', name: 'Ready', color: 'green' },
  { id: 'lbl-yellow', name: 'In Review', color: 'yellow' },
  { id: 'lbl-orange', name: 'Blocked', color: 'orange' },
  { id: 'lbl-red', name: 'High Priority', color: 'red' },
  { id: 'lbl-purple', name: 'Feature', color: 'purple' },
  { id: 'lbl-blue', name: 'Bug', color: 'blue' },
];

export function LabelPicker({ cardId, boardId, selectedLabels }: LabelPickerProps) {
  const [, startTransition] = useTransition();

  const handleToggle = (labelId: string) => {
    startTransition(async () => {
      await toggleLabelAction({ cardId, labelId }, boardId);
    });
  };

  const selectedIds = new Set(selectedLabels.map((l) => l.label.id));

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-[#172B4D] flex items-center gap-2">
        <span>🏷️</span> Labels
      </h3>

      <div className="flex flex-wrap items-center gap-1.5">
        {selectedLabels.map(({ label }) => (
          <Badge key={label.id} color={label.color} className="h-6 px-2 text-xs">
            {label.name}
          </Badge>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="h-6 px-2 rounded bg-[#091E420A] hover:bg-[#091E4214] text-[#172B4D] font-medium text-xs flex items-center gap-1 transition-colors"
            >
              <span>+</span> Label
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 flex flex-col gap-2">
            <span className="text-xs font-bold text-[#6B778C] uppercase">Select Labels</span>
            <div className="flex flex-col gap-1.5">
              {DEFAULT_LABELS.map((lbl) => {
                const isSelected = selectedIds.has(lbl.id);
                return (
                  <button
                    key={lbl.id}
                    type="button"
                    onClick={() => handleToggle(lbl.id)}
                    className="flex items-center justify-between px-2 py-1.5 rounded hover:opacity-90 transition-opacity text-xs font-semibold text-white"
                    style={{ backgroundColor: labelColors[lbl.color]?.bg || '#0052CC' }}
                  >
                    <span>{lbl.name}</span>
                    {isSelected && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
