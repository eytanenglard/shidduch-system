// =============================================================================
// src/app/api/matchmaker/potential-matches/scan-sessions/route.ts
// API לשליפת רשימת סריקות אחרונות (לפילטר לפי סריקה)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));

    const sessions = await prisma.scanSession.findMany({
      where: {
        status: { in: ['COMPLETED', 'IN_PROGRESS'] },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        scanType: true,
        status: true,
        startedAt: true,
        completedAt: true,
        matchesFound: true,
        newMatches: true,
        totalUsersScanned: true,
        durationMs: true,
      },
    });

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error('[ScanSessions] GET Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
