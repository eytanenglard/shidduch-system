// src/app/api/matchmaker/suggestions/[id]/share-contact/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, MatchSuggestionStatus } from "@prisma/client";
import { StatusTransitionService } from "@/app/components/matchmaker/suggestions/services/suggestions/StatusTransitionService";

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

    // Verify matchmaker permissions for sharing contact details
    if (
      suggestion.matchmakerId !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to share contact details for this suggestion" },
        { status: 403 }
      );
    }

    // Verify suggestion is in appropriate status for sharing contact details
    if (
      suggestion.status !== MatchSuggestionStatus.FIRST_PARTY_APPROVED &&
      suggestion.status !== MatchSuggestionStatus.SECOND_PARTY_APPROVED &&
      suggestion.status !== MatchSuggestionStatus.AWAITING_MATCHMAKER_APPROVAL
    ) {
      return NextResponse.json({
        success: false,
        error: "Suggestion is not in a valid status for sharing contact details"
      }, { status: 400 });
    }

    // Update suggestion status to CONTACT_DETAILS_SHARED using the StatusTransitionService
    // This will automatically trigger notifications to both parties with contact details
    const statusTransitionService = StatusTransitionService.getInstance();
    const updatedSuggestion = await statusTransitionService.transitionStatus(
      suggestion,
      MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
      `פרטי קשר שותפו בין ${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} ל${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} ע"י ${session.user.firstName} ${session.user.lastName}`,
      {
        sendNotifications: true,
        notifyParties: ['first', 'second', 'matchmaker']
      }
    );

    return NextResponse.json({
      success: true,
      message: "Contact details shared successfully",
      suggestion: updatedSuggestion
    });
  } catch (error) {
    console.error("Error sharing contact details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to share contact details" },
      { status: 500 }
    );
  }
}