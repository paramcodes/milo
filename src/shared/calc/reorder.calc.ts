export function calculateReorderedPosition<T extends { id: string; position: number }>(
  items: T[],
  startIndex: number,
  endIndex: number,
): T[] {
  if (
    startIndex < 0 ||
    startIndex >= items.length ||
    endIndex < 0 ||
    endIndex >= items.length ||
    startIndex === endIndex
  ) {
    return items;
  }

  const result = Array.from(items);
  const [removed] = result.splice(startIndex, 1);
  if (!removed) return items;
  result.splice(endIndex, 0, removed);

  return result.map((item, index) => ({
    ...item,
    position: (index + 1) * 1000,
  }));
}
