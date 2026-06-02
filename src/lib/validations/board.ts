import { z } from 'zod';

export const BOARD_TITLE_MAX = 80;
const DEFAULT_TITLE = 'Untitled Board';

const titleField = z
  .string()
  .trim()
  .min(1, 'Title cannot be empty')
  .max(BOARD_TITLE_MAX, `Title must be ${BOARD_TITLE_MAX} characters or fewer`);

export const createBoardSchema = z.object({
  // Optional on create: an untitled board is valid and gets a default title.
  title: titleField.optional().default(DEFAULT_TITLE),
});

export const updateBoardSchema = z
  .object({
    title: titleField.optional(),
    isPublic: z.boolean().optional(),
  })
  // Reject empty PATCH bodies — a no-op update is a client mistake, not a 200.
  .refine((data) => data.title !== undefined || data.isPublic !== undefined, {
    error: 'Provide at least one field to update',
  });

export type CreateBoardData = z.infer<typeof createBoardSchema>;
export type UpdateBoardData = z.infer<typeof updateBoardSchema>;
