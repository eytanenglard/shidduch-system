// src/lib/services/weeklyLimitService.ts
// =============================================================================
// Tracks weekly suggestion usage for the Smart Assistant
// Default limit: 10 suggestions per week (Sunday–Saturday, Israel week)
// =============================================================================

import prisma from '@/lib/prisma';

const DEFAULT_WEEKLY_LIMIT = 10;

export interface WeeklyUsage {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string; // ISO date string
  allowed: boolean;
}

export class WeeklyLimitService {
  /**
   * Get the start of the current week (Sunday 00:00 UTC)
   */
  static getWeekStart(): Date {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sunday
    const diff = now.getUTCDate() - day;
    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0));
    return weekStart;
  }

  /**
   * Get the start of next week (for reset countdown)
   */
  static getNextWeekStart(): Date {
    const weekStart = this.getWeekStart();
    weekStart.setUTCDate(weekStart.getUTCDate() + 7);
    return weekStart;
  }

  /**
   * Get current weekly usage for a user
   */
  static async getUsage(userId: string): Promise<WeeklyUsage> {
    const weekStart = this.getWeekStart();

    const usage = await prisma.weeklySuggestionUsage.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
    });

    const used = usage?.count ?? 0;
    const limit = usage?.limit ?? DEFAULT_WEEKLY_LIMIT;

    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      resetsAt: this.getNextWeekStart().toISOString(),
      allowed: used < limit,
    };
  }

  /**
   * Check if user can get a suggestion and increment counter if allowed
   * Returns the updated usage info
   */
  static async checkAndIncrement(userId: string): Promise<WeeklyUsage> {
    const weekStart = this.getWeekStart();

    // Upsert: create if not exists, increment if exists
    const usage = await prisma.weeklySuggestionUsage.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      create: {
        userId,
        weekStart,
        count: 1,
        limit: DEFAULT_WEEKLY_LIMIT,
      },
      update: {
        count: { increment: 1 },
      },
    });

    // Check if we went over limit (the increment already happened)
    const allowed = usage.count <= usage.limit;

    // If we went over, decrement back
    if (!allowed) {
      await prisma.weeklySuggestionUsage.update({
        where: { id: usage.id },
        data: { count: { decrement: 1 } },
      });

      return {
        used: usage.count - 1,
        limit: usage.limit,
        remaining: 0,
        resetsAt: this.getNextWeekStart().toISOString(),
        allowed: false,
      };
    }

    return {
      used: usage.count,
      limit: usage.limit,
      remaining: Math.max(0, usage.limit - usage.count),
      resetsAt: this.getNextWeekStart().toISOString(),
      allowed: true,
    };
  }

  /**
   * Set a custom limit for a user (for premium tiers)
   */
  static async setLimit(userId: string, limit: number): Promise<void> {
    const weekStart = this.getWeekStart();

    await prisma.weeklySuggestionUsage.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      create: {
        userId,
        weekStart,
        count: 0,
        limit,
      },
      update: { limit },
    });
  }
}
