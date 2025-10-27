// src/app/api/suggestions/[id]/delete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized - Invalid session" }, { status: 401 });
    }

    const params = await props.params;
    const suggestionId = params.id;

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    const userRole = session.user.role as UserRole;
    const isOwner = suggestion.matchmakerId === session.user.id;

    if (userRole !== UserRole.ADMIN && !(userRole === UserRole.MATCHMAKER && isOwner)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions to delete this suggestion" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.suggestionStatusHistory.deleteMany({
        where: { suggestionId },
      });
      await tx.suggestionInquiry.deleteMany({
        where: { suggestionId },
      });
      await tx.meeting.deleteMany({
        where: { suggestionId },
      });
      await tx.dateFeedback.deleteMany({
        where: { suggestionId },
      });
      await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          approvedBy: { set: [] },
          reviewedBy: { set: [] },
        }
      });
      await tx.matchSuggestion.delete({
        where: { id: suggestionId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Suggestion deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting suggestion:", error);
    return NextResponse.json(
      { error: "Internal server error during suggestion deletion" },
      { status: 500 }
    );
  }
}