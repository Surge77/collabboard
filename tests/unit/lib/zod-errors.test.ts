import { describe, expect, it } from 'vitest';

import { updateBoardSchema } from '@/lib/validations/board';
import { flattenFieldErrors } from '@/lib/zod-errors';

describe('flattenFieldErrors', () => {
  it('keys field-level errors by path', () => {
    const result = updateBoardSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(flattenFieldErrors(result.error)).toHaveProperty('title');
    }
  });

  it('keys form-level refinement errors under "_"', () => {
    const result = updateBoardSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(flattenFieldErrors(result.error)).toHaveProperty('_');
    }
  });
});
