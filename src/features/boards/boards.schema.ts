import { z } from 'zod';

export const createBoardSchema = z.object({
  title: z.string().min(1, 'Board title is required').max(100),
  color: z.string().optional(),
  teamId: z.string().optional(),
});

export const updateBoardSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;

export interface BoardSummaryDto {
  id: string;
  title: string;
  color: string;
  userId: string | null;
  teamId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardDetailDto extends BoardSummaryDto {
  lists: Array<{
    id: string;
    title: string;
    position: number;
    cards: Array<{
      id: string;
      title: string;
      position: number;
      dueDate: Date | null;
      isCompleted: boolean;
      labels: Array<{
        label: {
          id: string;
          name: string;
          color: string;
        };
      }>;
      checklists: Array<{
        id: string;
        title: string;
        isCompleted: boolean;
        position: number;
      }>;
    }>;
  }>;
}
