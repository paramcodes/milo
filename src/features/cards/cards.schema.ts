import { z } from 'zod';

export const createCardSchema = z.object({
  title: z.string().min(1, 'Card title is required').max(200),
  listId: z.string().min(1),
  description: z.string().optional(),
});

export const updateCardSchema = z.object({
  cardId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  dueDate: z.date().nullable().optional(),
  isCompleted: z.boolean().optional(),
});

export const moveCardSchema = z.object({
  cardId: z.string().min(1),
  targetListId: z.string().min(1),
  newPosition: z.number().int(),
});

export const deleteCardSchema = z.object({
  cardId: z.string().min(1),
});

export const addChecklistItemSchema = z.object({
  cardId: z.string().min(1),
  title: z.string().min(1).max(200),
});

export const toggleChecklistItemSchema = z.object({
  itemId: z.string().min(1),
  isCompleted: z.boolean(),
});

export const deleteChecklistItemSchema = z.object({
  itemId: z.string().min(1),
});

export const toggleLabelSchema = z.object({
  cardId: z.string().min(1),
  labelId: z.string().min(1),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;
export type DeleteCardInput = z.infer<typeof deleteCardSchema>;
export type AddChecklistItemInput = z.infer<typeof addChecklistItemSchema>;
export type ToggleChecklistItemInput = z.infer<typeof toggleChecklistItemSchema>;
export type DeleteChecklistItemInput = z.infer<typeof deleteChecklistItemSchema>;
export type ToggleLabelInput = z.infer<typeof toggleLabelSchema>;

export interface CardDto {
  id: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: Date | null;
  isCompleted: boolean;
  listId: string;
  createdAt: Date;
  updatedAt: Date;
  checklists?: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
    position: number;
  }>;
  labels?: Array<{
    label: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  activities?: Array<{
    id: string;
    action: string;
    actorId: string;
    details: string;
    createdAt: Date;
    actor?: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}
