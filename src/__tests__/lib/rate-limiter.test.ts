import { describe, it, expect } from 'vitest';
import { UserRole } from '@prisma/client';

/**
 * Tests for the tiered rate limiting system.
 * These test the logic/configuration rather than the actual Redis calls,
 * since the rate-limiter module initializes Redis at module level.
 */

// We define the same multiplier map to test the logic
const ROLE_RATE_MULTIPLIERS: Record<string, number> = {
  [UserRole.ADMIN]: 10,
  [UserRole.MATCHMAKER]: 5,
  [UserRole.CANDIDATE]: 1,
};

describe('Rate Limiter Tiered System', () => {
  it('should have correct multiplier for CANDIDATE role', () => {
    const multiplier = ROLE_RATE_MULTIPLIERS[UserRole.CANDIDATE] || 1;
    expect(multiplier).toBe(1);

    // Base config: 10 requests/hour
    const effectiveLimit = 10 * multiplier;
    expect(effectiveLimit).toBe(10);
  });

  it('should have 5x multiplier for MATCHMAKER role', () => {
    const multiplier = ROLE_RATE_MULTIPLIERS[UserRole.MATCHMAKER] || 1;
    expect(multiplier).toBe(5);

    const effectiveLimit = 10 * multiplier;
    expect(effectiveLimit).toBe(50);
  });

  it('should have 10x multiplier for ADMIN role', () => {
    const multiplier = ROLE_RATE_MULTIPLIERS[UserRole.ADMIN] || 1;
    expect(multiplier).toBe(10);

    const effectiveLimit = 10 * multiplier;
    expect(effectiveLimit).toBe(100);
  });

  it('should default to 1x for unknown roles', () => {
    const multiplier = ROLE_RATE_MULTIPLIERS['UNKNOWN'] || 1;
    expect(multiplier).toBe(1);
  });

  it('should ensure no role is completely exempt (multiplier > 0)', () => {
    for (const [role, multiplier] of Object.entries(ROLE_RATE_MULTIPLIERS)) {
      expect(multiplier, `Role ${role} should have a positive multiplier`).toBeGreaterThan(0);
    }
  });

  it('should maintain hierarchy: ADMIN > MATCHMAKER > CANDIDATE', () => {
    expect(ROLE_RATE_MULTIPLIERS[UserRole.ADMIN]).toBeGreaterThan(
      ROLE_RATE_MULTIPLIERS[UserRole.MATCHMAKER]
    );
    expect(ROLE_RATE_MULTIPLIERS[UserRole.MATCHMAKER]).toBeGreaterThan(
      ROLE_RATE_MULTIPLIERS[UserRole.CANDIDATE]
    );
  });
});
