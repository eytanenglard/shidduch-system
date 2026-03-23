import { describe, it, expect } from 'vitest';
import { apiError, mobileApiError, zodValidationError, ErrorCodes } from '@/lib/api-error';

describe('apiError', () => {
  it('should create a JSON response with correct status', async () => {
    const response = apiError(ErrorCodes.NOT_FOUND, 'User not found', 404);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
    expect(body.message).toBe('User not found');
    expect(body.statusCode).toBe(404);
  });

  it('should include details when provided', async () => {
    const response = apiError(
      ErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      400,
      { fields: { email: 'Required' } }
    );

    const body = await response.json();
    expect(body.details).toEqual({ fields: { email: 'Required' } });
  });

  it('should not include details when not provided', async () => {
    const response = apiError(ErrorCodes.INTERNAL_ERROR, 'Server error', 500);
    const body = await response.json();
    expect(body.details).toBeUndefined();
  });
});

describe('mobileApiError', () => {
  it('should create a CORS-enabled error response', async () => {
    const mockReq = new Request('https://example.com/api/mobile/test', {
      headers: { origin: 'https://mobile-app.com' },
    });

    const response = mobileApiError(
      mockReq,
      ErrorCodes.AUTH_REQUIRED,
      'Unauthorized',
      401
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://mobile-app.com');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');

    const body = await response.json();
    expect(body.code).toBe('AUTH_REQUIRED');
    expect(body.message).toBe('Unauthorized');
  });

  it('should default to * when no origin header', async () => {
    const mockReq = new Request('https://example.com/api/mobile/test');

    const response = mobileApiError(
      mockReq,
      ErrorCodes.INTERNAL_ERROR,
      'Server error',
      500
    );

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

describe('zodValidationError', () => {
  it('should format Zod errors into field-level details', async () => {
    const mockZodError = {
      issues: [
        { path: ['email'], message: 'Invalid email' },
        { path: ['password'], message: 'Too short' },
        { path: ['profile', 'age'], message: 'Must be positive' },
      ],
    };

    const response = zodValidationError(mockZodError);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details.fields).toEqual({
      email: 'Invalid email',
      password: 'Too short',
      'profile.age': 'Must be positive',
    });
  });
});
