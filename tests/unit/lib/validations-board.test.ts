import { describe, expect, it } from 'vitest';

import { createBoardSchema, updateBoardSchema } from '@/lib/validations/board';

describe('createBoardSchema', () => {
  it('defaults the title when none is provided', () => {
    const result = createBoardSchema.parse({});
    expect(result.title).toBe('Untitled Board');
  });

  it('trims a provided title', () => {
    const result = createBoardSchema.parse({ title: '  My board  ' });
    expect(result.title).toBe('My board');
  });

  it('rejects a title longer than 80 characters', () => {
    const result = createBoardSchema.safeParse({ title: 'x'.repeat(81) });
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only title', () => {
    const result = createBoardSchema.safeParse({ title: '   ' });
    expect(result.success).toBe(false);
  });
});

describe('updateBoardSchema', () => {
  it('accepts a title-only update', () => {
    expect(updateBoardSchema.safeParse({ title: 'Renamed' }).success).toBe(true);
  });

  it('accepts an isPublic-only update', () => {
    expect(updateBoardSchema.safeParse({ isPublic: true }).success).toBe(true);
  });

  it('rejects an empty update body', () => {
    expect(updateBoardSchema.safeParse({}).success).toBe(false);
  });
});
