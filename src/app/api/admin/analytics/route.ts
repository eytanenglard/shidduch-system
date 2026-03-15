// src/app/api/admin/analytics/route.ts
// ==========================================
// NeshamaTech Admin - Analytics Dashboard API
// GET /api/admin/analytics?range=7d|30d|90d
// Returns aggregated analytics for the dashboard
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MATCHMAKER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const range = req.nextUrl.searchParams.get("range") || "7d";
    const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
    const days = daysMap[range] || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // ── Parallel queries for speed ──
    const [
      totalUsers,
      activeUsers,
      newUsersInRange,
      totalSuggestions,
      activeSuggestions,
      eventCounts,
      dailyActiveUsers,
      topEvents,
      registrationFunnel,
      suggestionResponses,
      platformBreakdown,
    ] = await Promise.all([
      // Total registered users
      prisma.user.count(),

      // Users who logged in within range
      prisma.user.count({
        where: { lastLogin: { gte: since } },
      }),

      // New users registered within range
      prisma.user.count({
        where: { createdAt: { gte: since } },
      }),

      // Total suggestions ever
      prisma.matchSuggestion.count(),

      // Active suggestions right now
      prisma.matchSuggestion.count({
        where: { category: "ACTIVE" },
      }),

      // Total analytics events in range
      prisma.analyticsEvent.count({
        where: { timestamp: { gte: since } },
      }),

      // Daily active users (unique userIds per day)
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE("timestamp") as date, COUNT(DISTINCT "userId") as count
        FROM "AnalyticsEvent"
        WHERE "timestamp" >= ${since}
        AND "userId" IS NOT NULL
        GROUP BY DATE("timestamp")
        ORDER BY date ASC
      `,

      // Top events by count
      prisma.$queryRaw<Array<{ event: string; count: bigint }>>`
        SELECT "event", COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE "timestamp" >= ${since}
        GROUP BY "event"
        ORDER BY count DESC
        LIMIT 15
      `,

      // Registration funnel
      Promise.all([
        prisma.user.count({ where: { createdAt: { gte: since } } }),
        prisma.user.count({ where: { createdAt: { gte: since }, isVerified: true } }),
        prisma.user.count({ where: { createdAt: { gte: since }, isProfileComplete: true } }),
        prisma.user.count({ where: { createdAt: { gte: since }, isPhoneVerified: true } }),
        prisma.user.count({ where: { createdAt: { gte: since }, status: "ACTIVE" } }),
      ]),

      // Suggestion response breakdown
      prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
        SELECT "status", COUNT(*) as count
        FROM "MatchSuggestion"
        WHERE "createdAt" >= ${since}
        GROUP BY "status"
        ORDER BY count DESC
      `,

      // Platform breakdown from analytics events
      prisma.$queryRaw<Array<{ platform: string; count: bigint }>>`
        SELECT COALESCE("platform", 'unknown') as platform, COUNT(DISTINCT "userId") as count
        FROM "AnalyticsEvent"
        WHERE "timestamp" >= ${since}
        AND "userId" IS NOT NULL
        GROUP BY "platform"
      `,
    ]);

    // Format funnel
    const funnel = {
      registered: registrationFunnel[0],
      emailVerified: registrationFunnel[1],
      profileComplete: registrationFunnel[2],
      phoneVerified: registrationFunnel[3],
      active: registrationFunnel[4],
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          newUsersInRange,
          totalSuggestions,
          activeSuggestions,
          totalEvents: eventCounts,
        },
        dailyActiveUsers: dailyActiveUsers.map((d) => ({
          date: d.date,
          count: Number(d.count),
        })),
        topEvents: topEvents.map((e) => ({
          event: e.event,
          count: Number(e.count),
        })),
        funnel,
        suggestionResponses: suggestionResponses.map((s) => ({
          status: s.status,
          count: Number(s.count),
        })),
        platformBreakdown: platformBreakdown.map((p) => ({
          platform: p.platform,
          count: Number(p.count),
        })),
        range,
        since: since.toISOString(),
      },
    });
  } catch (error) {
    console.error("[admin/analytics] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}