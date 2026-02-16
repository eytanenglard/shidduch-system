// app/api/mobile/suggestions/[id]/chat/read/route.ts
// ==========================================
// NeshamaTech - Mark Chat Messages as Read
// POST: Mark all messages as read for the current user
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyMobileToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: suggestionId } = await context.params;

    // Verify user is part of this suggestion
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: { firstPartyId: true, secondPartyId: true },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    const isParty =
      suggestion.firstPartyId === user.userId ||
      suggestion.secondPartyId === user.userId;

    if (!isParty) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Mark all messages NOT sent by this user as read
    // (i.e., messages from matchmaker/system that this user hasn't read)
    const result = await prisma.suggestionMessage.updateMany({
      where: {
        suggestionId,
        senderId: { not: user.userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      markedCount: result.count,
    });
  } catch (error) {
    console.error("[Mobile Chat Read] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}