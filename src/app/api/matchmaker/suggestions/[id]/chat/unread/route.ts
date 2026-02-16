// app/api/matchmaker/chat/unread/route.ts
// ==========================================
// NeshamaTech - Matchmaker Unread Messages Count
// GET: Returns unread message count per suggestion
// Used for badges on dashboard cards
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== UserRole.MATCHMAKER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get unread counts grouped by suggestion
    const unreadCounts = await prisma.suggestionMessage.groupBy({
      by: ["suggestionId"],
      where: {
        senderType: "USER",
        isRead: false,
        suggestion: {
          matchmakerId: session.user.id,
        },
      },
      _count: { id: true },
    });

    // Convert to a lookup map: { [suggestionId]: count }
    const unreadMap: Record<string, number> = {};
    let totalUnread = 0;

    for (const item of unreadCounts) {
      unreadMap[item.suggestionId] = item._count.id;
      totalUnread += item._count.id;
    }

    return NextResponse.json({
      success: true,
      totalUnread,
      bySuggestion: unreadMap,
    });
  } catch (error) {
    console.error("[Matchmaker Unread Count] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread counts" },
      { status: 500 }
    );
  }
}
