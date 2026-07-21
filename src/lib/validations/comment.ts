import { z } from 'zod';

const MAX_BODY = 2000;

// A root comment carries an x/y canvas anchor; a reply carries a parentId and
// inherits its root's anchor. The refine enforces exactly one of the two shapes.
export const createCommentSchema = z
  .object({
    body: z.string().trim().min(1).max(MAX_BODY),
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
    parentId: z.string().cuid().optional(),
  })
  .refine(
    (v) =>
      v.parentId ? v.x === undefined && v.y === undefined : v.x !== undefined && v.y !== undefined,
    { message: 'Provide x and y for a new comment, or parentId for a reply' }
  );

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  resolved: z.boolean(),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
