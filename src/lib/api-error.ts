/**
 * Standardized API error response utility.
 * Provides consistent error codes for both web and mobile clients.
 */

export interface ApiErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// Standard error codes
export const ErrorCodes = {
  // Auth
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_ACCOUNT_BLOCKED: 'AUTH_ACCOUNT_BLOCKED',
  AUTH_EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
  AUTH_PHONE_EXISTS: 'AUTH_PHONE_EXISTS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Business logic
  SUGGESTION_INVALID_STATUS: 'SUGGESTION_INVALID_STATUS',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  USER_UNAVAILABLE: 'USER_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Creates a standardized error JSON response.
 */
export function apiError(
  code: ErrorCode,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>
): Response {
  const body: ApiErrorResponse = {
    code,
    message,
    statusCode,
    ...(details && { details }),
  };

  return Response.json(body, { status: statusCode });
}

/**
 * Creates a standardized error response with CORS headers for mobile.
 */
export function mobileApiError(
  req: Request,
  code: ErrorCode,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>
): Response {
  const body: ApiErrorResponse = {
    code,
    message,
    statusCode,
    ...(details && { details }),
  };

  const origin = req.headers.get('origin') || '*';
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

/**
 * Wraps Zod validation errors into a standardized format.
 */
export function zodValidationError(zodError: { issues: Array<{ path: (string | number)[]; message: string }> }): Response {
  const fieldErrors: Record<string, string> = {};
  for (const issue of zodError.issues) {
    const field = issue.path.join('.');
    fieldErrors[field] = issue.message;
  }

  return apiError(
    ErrorCodes.VALIDATION_ERROR,
    'Validation failed',
    400,
    { fields: fieldErrors }
  );
}
