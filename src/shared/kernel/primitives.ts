export type UserId = string & { readonly __brand: 'UserId' };
export type BoardId = string & { readonly __brand: 'BoardId' };
export type ListId = string & { readonly __brand: 'ListId' };
export type CardId = string & { readonly __brand: 'CardId' };
export type ChecklistItemId = string & { readonly __brand: 'ChecklistItemId' };

export function toUserId(id: string): UserId {
  return id as UserId;
}

export function toBoardId(id: string): BoardId {
  return id as BoardId;
}

export function toListId(id: string): ListId {
  return id as ListId;
}

export function toCardId(id: string): CardId {
  return id as CardId;
}

export function toChecklistItemId(id: string): ChecklistItemId {
  return id as ChecklistItemId;
}
