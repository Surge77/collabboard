import { z } from 'zod';

const MAX_EXPIRY_DAYS = 365;

export const createShareLinkSchema = z.object({
  role: z.enum(['VIEWER', 'EDITOR']),
  expiresInDays: z.number().int().min(1).max(MAX_EXPIRY_DAYS).optional(),
});

export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;
