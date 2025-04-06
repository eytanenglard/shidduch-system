// src/app/api/matchmaker/suggestions/[id]/resend/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, MatchSuggestionStatus } from "@prisma/client";
import { StatusTransitionService } from "@/app/components/matchmaker/suggestions/services/suggestions/StatusTransitionService";
import { initNotificationService } from "@/app/components/matchmaker/suggestions/services/notification/initNotifications";

// Initialize the notification service
const notificationService = initNotificationService();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verify user is logged in
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify matchmaker permissions
    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const suggestionId = params.id;
    const { partyType } = await req.json();

    // Verify suggestion exists
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: {
          include: { profile: true }
        },
        secondParty: {
          include: { profile: true }
        },
        matchmaker: true
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // Verify matchmaker permissions for resending
    if (
      suggestion.matchmakerId !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to resend this suggestion" },
        { status: 403 }
      );
    }

    const statusTransitionService = StatusTransitionService.getInstance();
    let updatedSuggestion = suggestion;
    const transitionNotes = `הצעה נשלחה מחדש ע"י ${session.user.firstName} ${session.user.lastName}`;
    
    // Update suggestion status to the appropriate status for resending
    if (partyType === "both" || partyType === "first") {
      // Resend to first party
      updatedSuggestion = await statusTransitionService.transitionStatus(
        updatedSuggestion, 
        MatchSuggestionStatus.PENDING_FIRST_PARTY,
        `${transitionNotes} - לצד ראשון`,
        {
          sendNotifications: true,
          notifyParties: ['first']
        }
      );
      
      // If this is just for the first party, update the sent time
      if (partyType === "first") {
        await prisma.matchSuggestion.update({
          where: { id: suggestionId },
          data: {
            firstPartySent: new Date(),
            lastActivity: new Date()
          }
        });
      }
    }
    
    if (partyType === "both" || partyType === "second") {
      // Resend to second party (directly or after the first)
      updatedSuggestion = await statusTransitionService.transitionStatus(
        updatedSuggestion, 
        MatchSuggestionStatus.PENDING_SECOND_PARTY,
        `${transitionNotes} - לצד שני`,
        {
          sendNotifications: true,
          notifyParties: ['second']
        }
      );
      
      // Update the sent time
      await prisma.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          secondPartySent: new Date(),
          lastActivity: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Suggestion successfully resent to ${partyType === "first" ? "first party" : partyType === "second" ? "second party" : "both parties"}`,
      suggestion: updatedSuggestion
    });
  } catch (error) {
    console.error("Error resending suggestion:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend suggestion" },
      { status: 500 }
    );
  }
}