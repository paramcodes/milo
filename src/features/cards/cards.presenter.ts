export interface ChecklistProgress {
  total: number;
  completed: number;
  percentage: number;
  fractionText: string;
}

export function calculateChecklistProgress(
  items: Array<{ isCompleted: boolean }>,
): ChecklistProgress {
  const total = items.length;
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      percentage: 0,
      fractionText: '0/0',
    };
  }

  const completed = items.filter((item) => item.isCompleted).length;
  const percentage = Math.round((completed / total) * 100);

  return {
    total,
    completed,
    percentage,
    fractionText: `${completed}/${total}`,
  };
}

export type DueDateStatus = 'COMPLETE' | 'OVERDUE' | 'DUE_SOON' | 'UPCOMING';

export interface DueDateViewModel {
  status: DueDateStatus;
  label: string;
  formattedDate: string;
}

export function getDueDateStatus(
  dueDate: Date | string | null,
  isCompleted: boolean,
): DueDateViewModel | null {
  if (!dueDate) return null;

  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const formattedDate = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  if (isCompleted) {
    return {
      status: 'COMPLETE',
      label: 'Complete',
      formattedDate,
    };
  }

  const diffMs = date.getTime() - now.getTime();
  if (diffMs < 0) {
    return {
      status: 'OVERDUE',
      label: 'Overdue',
      formattedDate,
    };
  }

  // Less than 24 hours away
  if (diffMs <= 24 * 60 * 60 * 1000) {
    return {
      status: 'DUE_SOON',
      label: 'Due soon',
      formattedDate,
    };
  }

  return {
    status: 'UPCOMING',
    label: formattedDate,
    formattedDate,
  };
}
