import { NextResponse } from 'next/server';

export type ApiErrorCode = 'UNAUTHORIZED' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR';

interface SuccessBody<T> {
  success: true;
  data: T;
  timestamp: string;
}

interface ErrorBody {
  success: false;
  error: { code: ApiErrorCode; message: string; fields?: Record<string, string> };
  timestamp: string;
}

export function apiSuccess<T>(data: T, status = 200): NextResponse<SuccessBody<T>> {
  return NextResponse.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { status }
  );
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  fields?: Record<string, string>
): NextResponse<ErrorBody> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(fields ? { fields } : {}) },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
