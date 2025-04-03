import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { SuggestionService } from "@/app/components/matchmaker/suggestions/services/suggestions/SuggestionService";

export async function PATCH(
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
    const data = await req.json();
    
    const suggestionService = SuggestionService.getInstance();
    
    try {
      // שימוש בשירות עדכון הצעה
      const updatedSuggestion = await suggestionService.updateSuggestion(
        suggestionId,
        session.user.id,
        {
          id: suggestionId,
          priority: data.priority,
          notes: {
            internal: data.internalNotes,
            forFirstParty: data.firstPartyNotes,
            forSecondParty: data.secondPartyNotes,
            matchingReason: data.matchingReason,
            followUpNotes: data.followUpNotes
          },
          decisionDeadline: data.decisionDeadline ? new Date(data.decisionDeadline) : undefined,
          responseDeadline: data.responseDeadline ? new Date(data.responseDeadline) : undefined
        }
      );
      
      return NextResponse.json({
        success: true,
        data: updatedSuggestion
      });
      
    } catch (serviceError: unknown) {
        console.error("Error from suggestion service:", serviceError);
        
        if (serviceError instanceof Error) {
          return NextResponse.json(
            { success: false, error: serviceError.message || "Failed to update suggestion" },
            { status: serviceError.message.includes("Unauthorized") ? 403 : 400 }
          );
        }
        
        // במקרה של שגיאה שאינה מסוג Error
        return NextResponse.json(
          { success: false, error: "Failed to update suggestion" },
          { status: 400 }
        );
      }
  } catch (error) {
    console.error("Error updating suggestion:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update suggestion" },
      { status: 500 }
    );
  }
}