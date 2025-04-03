import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { statusTransitionService } from "@/app/components/matchmaker/suggestions/services/suggestions/StatusTransitionService";

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // חילוץ הפרמטרים באופן אסינכרוני
    const params = await context.params;
    const suggestionId = params.id;

    // בדיקת אותנטיקציה
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // חילוץ נתונים מה-body
    const body = await req.json();
    const { status, notes } = body;

    // שליפת ההצעה הנוכחית עם כל היחסים הנדרשים
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: {
          include: { profile: true }
        },
        secondParty: {
          include: { profile: true }
        },
        matchmaker: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // וידוא הרשאות המשתמש
    if (suggestion.firstPartyId !== session.user.id && 
        suggestion.secondPartyId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this suggestion" },
        { status: 403 }
      );
    }

    let updatedSuggestion;
    try {
      // עדכון סטטוס ההצעה
      updatedSuggestion = await statusTransitionService.transitionStatus(
        suggestion,
        status,
        notes
      );

      // אם הסטטוס הוא FIRST_PARTY_APPROVED, מעבר אוטומטי ל-PENDING_SECOND_PARTY
      if (status === "FIRST_PARTY_APPROVED") {
        updatedSuggestion = await statusTransitionService.transitionStatus(
          updatedSuggestion,
          "PENDING_SECOND_PARTY",
          "Automatic transition after first party approval"
        );
      } else if (status === "SECOND_PARTY_APPROVED") {
        updatedSuggestion = await statusTransitionService.transitionStatus(
          updatedSuggestion,
          "CONTACT_DETAILS_SHARED",
          "Automatic transition after second party approval"
        );
      }

      return NextResponse.json({
        success: true,
        suggestion: updatedSuggestion,
      });

    } catch (transitionError) {
      console.error("Error in status transition:", transitionError);
      
      // אם היה שגיאה בתהליך המעבר, נחזיר שגיאה מפורטת
      return NextResponse.json({
        error: "Failed to update suggestion status",
        details: transitionError instanceof Error ? transitionError.message : "Unknown error",
      }, { 
        status: 500 
      });
    }

  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}