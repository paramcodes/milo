import { z } from 'zod';

export const createListSchema = z.object({
  title: z.string().min(1, 'List title is required').max(100),
  boardId: z.string().min(1),
});

export const updateListTitleSchema = z.object({
  listId: z.string().min(1),
  title: z.string().min(1, 'Title cannot be empty').max(100),
});

export const reorderListsSchema = z.object({
  boardId: z.string().min(1),
  listIds: z.array(z.string()),
});

export const deleteListSchema = z.object({
  listId: z.string().min(1),
});

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListTitleInput = z.infer<typeof updateListTitleSchema>;
export type ReorderListsInput = z.infer<typeof reorderListsSchema>;
export type DeleteListInput = z.infer<typeof deleteListSchema>;

export interface ListDto {
  id: string;
  title: string;
  position: number;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
}
