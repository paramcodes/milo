import { describe, expect, it } from 'vitest';
import { calculateReorderedPosition } from './reorder.calc';

describe('reorder.calc', () => {
  it('reorders items within the same list and spaces positions by 1000', () => {
    const items = [
      { id: '1', position: 1000 },
      { id: '2', position: 2000 },
      { id: '3', position: 3000 },
    ];

    // Move first item to index 2 (end)
    const result = calculateReorderedPosition(items, 0, 2);

    expect(result).toHaveLength(3);
    expect(result.map((i) => i.id)).toEqual(['2', '3', '1']);
    expect(result.map((i) => i.position)).toEqual([1000, 2000, 3000]);
  });

  it('moves item backwards', () => {
    const items = [
      { id: '1', position: 1000 },
      { id: '2', position: 2000 },
      { id: '3', position: 3000 },
    ];

    // Move last item to index 0 (front)
    const result = calculateReorderedPosition(items, 2, 0);

    expect(result.map((i) => i.id)).toEqual(['3', '1', '2']);
    expect(result.map((i) => i.position)).toEqual([1000, 2000, 3000]);
  });

  it('handles invalid indices gracefully', () => {
    const items = [
      { id: '1', position: 1000 },
      { id: '2', position: 2000 },
    ];

    const result = calculateReorderedPosition(items, 5, 0);
    expect(result).toEqual(items);
  });

  it('handles empty lists', () => {
    const result = calculateReorderedPosition([], 0, 0);
    expect(result).toEqual([]);
  });
});
