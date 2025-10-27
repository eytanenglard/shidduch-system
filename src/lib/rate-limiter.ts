// src/lib/rate-limiter.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';

// Initialize Redis client only once
let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.warn('Upstash Redis credentials are not configured. Rate limiting will be disabled.');
}

type RateLimitConfig = {
  requests: number;
  window: `${number} ${'s' | 'm' | 'h'}`;
};

/**
 * Applies rate limiting to an API endpoint.
 *
 * @param req The NextRequest object.
 * @param config The rate limit configuration.
 * @returns A NextResponse object if rate-limited, otherwise null.
 */
export async function applyRateLimit(req: NextRequest, config: RateLimitConfig): Promise<NextResponse | null> {
  if (!redis || process.env.NODE_ENV === 'development') {
    return null;
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // FIX: Use 'x-forwarded-for' header to get the IP address
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
  const identifier = token?.sub ?? ip;

  const ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: `ratelimit:${req.nextUrl.pathname}`,
  });

  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

  if (!success) {
    return new NextResponse('Too many requests. Please try again later.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    });
  }

  return null;
}

/**
 * Applies rate limiting with role-based exemptions.
 * MATCHMAKER and ADMIN roles are exempt from rate limiting.
 *
 * @param req The NextRequest object.
 * @param config The rate limit configuration (applied only to regular users).
 * @returns A NextResponse object if rate-limited, otherwise null.
 */
export async function applyRateLimitWithRoleCheck(
  req: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // שדכנים ואדמינים פטורים לחלוטין מהגבלות
  if (token?.role === UserRole.MATCHMAKER || token?.role === UserRole.ADMIN) {
    console.log(`[Rate Limiter] Skipping rate limit for ${token.role}: ${token.sub}`);
    return null;
  }
  
  // משתמשים רגילים כפופים להגבלה
  return applyRateLimit(req, config);
}

// THIS IS THE FIX: Explicitly mark the file as a module.
export {};