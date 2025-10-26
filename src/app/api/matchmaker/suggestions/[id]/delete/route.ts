// src/app/api/matchmaker/suggestions/[id]/delete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const suggestionId = context.params.id;

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        matchmaker: {
          select: { id: true }
        }
      }
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    if (suggestion.matchmaker.id !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to delete this suggestion" },
        { status: 403 }
      );
    }

    await prisma.suggestionStatusHistory.deleteMany({
      where: { suggestionId }
    });

    await prisma.dateFeedback.deleteMany({
      where: { suggestionId }
    });

    await prisma.meeting.deleteMany({
      where: { suggestionId }
    });

    await prisma.suggestionInquiry.deleteMany({
      where: { suggestionId }
    });

    await prisma.matchSuggestion.update({
      where: { id: suggestionId },
      data: {
        approvedBy: {
          set: []
        },
        reviewedBy: {
          set: []
        }
      }
    });

    await prisma.matchSuggestion.delete({
      where: { id: suggestionId }
    });

    return NextResponse.json({
      success: true,
      message: "Suggestion deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting suggestion:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete suggestion", 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}