import { Badge } from '@/shared/ui/badge';
import type React from 'react';

interface CardTileProps {
  id: string;
  title: string;
  dueDate?: Date | string | null;
  isCompleted?: boolean;
  labels?: Array<{
    label: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  checklists?: Array<{
    id: string;
    isCompleted: boolean;
  }>;
  onClick?: () => void;
}

export function CardTile({
  title,
  dueDate,
  isCompleted,
  labels = [],
  checklists = [],
  onClick,
}: CardTileProps) {
  const completedChecklists = checklists.filter((c) => c.isCompleted).length;
  const totalChecklists = checklists.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left bg-white hover:bg-[#FAFBFC] p-2.5 rounded-lg shadow-sm border border-[#091E4214] hover:border-[#091E4224] transition-all select-none cursor-pointer flex flex-col gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
    >
      {/* Labels */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {labels.map(({ label }) => (
            <Badge key={label.id} color={label.color} className="h-4 text-[10px] px-1.5 py-0">
              {label.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Card Title */}
      <span className="text-sm font-normal text-[#172B4D] break-words leading-snug">{title}</span>

      {/* Badges / Indicators */}
      {(dueDate || totalChecklists > 0 || isCompleted) && (
        <div className="flex items-center gap-3 text-xs text-[#6B778C] mt-0.5">
          {dueDate && (
            <span
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${
                isCompleted
                  ? 'bg-[#E3FCEF] text-[#006644]'
                  : new Date(dueDate) < new Date()
                    ? 'bg-[#FFEBE6] text-[#BF2600]'
                    : 'bg-[#EBECF0] text-[#172B4D]'
              }`}
            >
              📅{' '}
              {new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}

          {totalChecklists > 0 && (
            <span
              className={`flex items-center gap-1 text-[11px] ${
                completedChecklists === totalChecklists ? 'text-[#00875A] font-semibold' : ''
              }`}
            >
              ☑ {completedChecklists}/{totalChecklists}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
