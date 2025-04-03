import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, MatchSuggestionStatus } from "@prisma/client";
import { StatusTransitionService } from "@/app/components/matchmaker/new/services/suggestions/StatusTransitionService";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // וידוא משתמש מחובר
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // וידוא הרשאות שדכן
    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const suggestionId = params.id;
    const { partyType } = await req.json();

    // וידוא קיום ההצעה
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

    // וידוא שדכן בעל הרשאות לשליחת הצעות מחדש
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
    
    // עדכון סטטוס ההצעה לסטטוס המתאים לשליחה מחדש
    if (partyType === "both" || partyType === "first") {
      // שליחה מחדש לצד ראשון
      updatedSuggestion = await statusTransitionService.transitionStatus(
        updatedSuggestion, 
        MatchSuggestionStatus.PENDING_FIRST_PARTY,
        `${transitionNotes} - לצד ראשון`
      );
      
      // אם זה גם לצד שני, נחכה להשלמת השליחה הראשונה
      if (partyType === "first") {
        // עדכון זמן השליחה לצד ראשון
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
      // שליחה מחדש לצד שני (ישירות או אחרי הראשון)
      updatedSuggestion = await statusTransitionService.transitionStatus(
        updatedSuggestion, 
        MatchSuggestionStatus.PENDING_SECOND_PARTY,
        `${transitionNotes} - לצד שני`
      );
      
      // עדכון זמן השליחה לצד שני
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