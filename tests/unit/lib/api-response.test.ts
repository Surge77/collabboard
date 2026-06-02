import { describe, expect, it } from 'vitest';

import { apiError, apiSuccess } from '@/lib/api-response';

describe('apiSuccess', () => {
  it('wraps data in a success envelope with a timestamp', async () => {
    const res = apiSuccess({ id: 'b1' }, 201);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, data: { id: 'b1' } });
    expect(typeof body.timestamp).toBe('string');
  });

  it('defaults to status 200', () => {
    expect(apiSuccess({}).status).toBe(200);
  });
});

describe('apiError', () => {
  it('wraps an error code and message', async () => {
    const res = apiError('NOT_FOUND', 'Board not found', 404);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Board not found' },
    });
  });

  it('includes field errors when provided', async () => {
    const res = apiError('VALIDATION_ERROR', 'Invalid', 422, { title: 'Required' });
    const body = await res.json();
    expect(body.error.fields).toEqual({ title: 'Required' });
  });
});
