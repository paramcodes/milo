'use client';

import React from 'react';

interface ActivityItem {
  id: string;
  action: string;
  details: string;
  createdAt: Date | string;
  actor?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ActivityStreamProps {
  activities?: ActivityItem[];
}

export function ActivityStream({ activities = [] }: ActivityStreamProps) {
  const formatAction = (action: string, detailsJson: string) => {
    try {
      const details = JSON.parse(detailsJson);
      switch (action) {
        case 'CREATED_CARD':
          return 'created this card';
        case 'UPDATED_CARD':
          return 'updated this card';
        case 'MOVED_CARD':
          return 'moved this card';
        case 'ADDED_CHECKLIST_ITEM':
          return `added "${details.itemTitle}" to checklist`;
        case 'TOGGLED_CHECKLIST_ITEM':
          return `${details.isCompleted ? 'completed' : 'unchecked'} "${details.itemTitle}"`;
        default:
          return action.toLowerCase().replace(/_/g, ' ');
      }
    } catch {
      return action.toLowerCase().replace(/_/g, ' ');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[#172B4D] flex items-center gap-2">
        <span>🕒</span> Activity & Audit Trail
      </h3>

      {activities.length === 0 ? (
        <p className="text-xs text-[#6B778C] italic">No activity recorded yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {activities.map((act) => {
            const actorName = act.actor?.name || 'Member';
            const initials = actorName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            const timeStr = new Date(act.createdAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={act.id} className="flex items-start gap-2.5 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center font-bold text-[10px] shrink-0 select-none">
                  {initials}
                </div>
                <div className="flex flex-col">
                  <div>
                    <span className="font-semibold text-[#172B4D]">{actorName}</span>{' '}
                    <span className="text-[#172B4D]">{formatAction(act.action, act.details)}</span>
                  </div>
                  <span className="text-[10px] text-[#6B778C]">{timeStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
