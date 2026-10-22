import { describe, expect, it } from 'vitest';
import { calculateChecklistProgress, getDueDateStatus } from './cards.presenter';

describe('cards.presenter', () => {
  describe('calculateChecklistProgress', () => {
    it('returns zero progress for empty checklists', () => {
      const progress = calculateChecklistProgress([]);
      expect(progress.total).toBe(0);
      expect(progress.completed).toBe(0);
      expect(progress.percentage).toBe(0);
      expect(progress.fractionText).toBe('0/0');
    });

    it('calculates completion fraction and percentage correctly', () => {
      const items = [
        { isCompleted: true },
        { isCompleted: true },
        { isCompleted: false },
        { isCompleted: false },
      ];
      const progress = calculateChecklistProgress(items);
      expect(progress.total).toBe(4);
      expect(progress.completed).toBe(2);
      expect(progress.percentage).toBe(50);
      expect(progress.fractionText).toBe('2/4');
    });
  });

  describe('getDueDateStatus', () => {
    it('returns null when no due date is provided', () => {
      expect(getDueDateStatus(null, false)).toBeNull();
    });

    it('returns COMPLETE when isCompleted is true', () => {
      const pastDate = new Date(Date.now() - 100000);
      const status = getDueDateStatus(pastDate, true);
      expect(status?.status).toBe('COMPLETE');
      expect(status?.label).toBe('Complete');
    });

    it('returns OVERDUE when due date is in the past and not completed', () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      const status = getDueDateStatus(pastDate, false);
      expect(status?.status).toBe('OVERDUE');
      expect(status?.label).toBe('Overdue');
    });

    it('returns DUE_SOON when due within 24 hours', () => {
      const soonDate = new Date(Date.now() + 3600000 * 12); // 12 hours from now
      const status = getDueDateStatus(soonDate, false);
      expect(status?.status).toBe('DUE_SOON');
      expect(status?.label).toBe('Due soon');
    });

    it('returns UPCOMING when due in more than 24 hours', () => {
      const futureDate = new Date(Date.now() + 86400000 * 5); // 5 days from now
      const status = getDueDateStatus(futureDate, false);
      expect(status?.status).toBe('UPCOMING');
    });
  });
});
