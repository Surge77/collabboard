import { z } from 'zod';

const MAX_LABEL_LENGTH = 80;

export const saveVersionSchema = z.object({
  label: z.string().trim().max(MAX_LABEL_LENGTH).optional(),
});

export type SaveVersionInput = z.infer<typeof saveVersionSchema>;
