// src/lib/messageRateLimit.ts
//
// In-memory rate limiter for message-sending endpoints.
// Prevents spam by limiting to 5 messages per 10 seconds per user.
// Matchmaker/Admin roles get a 3x multiplier (15 messages per 10s).

import { UserRole } from '@prisma/client';

const messageCounts = new Map<string, { count: number; resetAt: number }>();

const BASE_MAX_MESSAGES = 5;
const WINDOW_MS = 10_000; // 10 seconds

const ROLE_MULTIPLIERS: Partial<Record<UserRole, number>> = {
  [UserRole.ADMIN]: 3,
  [UserRole.MATCHMAKER]: 3,
};

export function checkMessageRateLimit(
  userId: string,
  role?: UserRole
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const multiplier = (role && ROLE_MULTIPLIERS[role]) || 1;
  const maxMessages = BASE_MAX_MESSAGES * multiplier;

  const entry = messageCounts.get(userId);
  if (!entry || now > entry.resetAt) {
    messageCounts.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= maxMessages) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}
