// src/app/api/matchmaker/suggestions/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MatchSuggestionStatus, UserRole } from "@prisma/client";
import { SuggestionService } from "@/components/matchmaker/suggestions/services/suggestions/SuggestionService";
import prisma from "@/lib/prisma"; // הוספת ייבוא Prisma

// פונקציית עזר לחישוב קטגוריה (הועתקה מהלוגיקה של הסטטוס)
const getSuggestionCategory = (status: MatchSuggestionStatus) => {
  switch (status) {
    case "DRAFT":
    case "AWAITING_MATCHMAKER_APPROVAL":
    case "PENDING_FIRST_PARTY":
    case "PENDING_SECOND_PARTY":
      return "PENDING";
    
    case "FIRST_PARTY_DECLINED":
    case "SECOND_PARTY_DECLINED":
    case "MATCH_DECLINED":
    case "ENDED_AFTER_FIRST_DATE":
    case "ENGAGED":
    case "MARRIED":
    case "EXPIRED":
    case "CLOSED":
    case "CANCELLED":
      return "HISTORY";
    
    default:
      return "ACTIVE";
  }
};

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
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
    
    const params = await props.params;
    const suggestionId = params.id;
    const data = await req.json();
    
    // =========================================================================
    // תיקון: טיפול בעדכון סטטוס אם נשלח בבקשה זו
    // =========================================================================
    if (data.status) {
      const currentSuggestion = await prisma.matchSuggestion.findUnique({
        where: { id: suggestionId },
        select: { status: true }
      });

      // מעדכנים סטטוס רק אם הוא שונה מהנוכחי
      if (currentSuggestion && currentSuggestion.status !== data.status) {
        await prisma.$transaction(async (tx) => {
          const newStatus = data.status as MatchSuggestionStatus;
          
          await tx.matchSuggestion.update({
            where: { id: suggestionId },
            data: {
              status: newStatus,
              previousStatus: currentSuggestion.status,
              lastStatusChange: new Date(),
              lastActivity: new Date(),
              category: getSuggestionCategory(newStatus),
              // עדכון שדות רלוונטיים לפי הסטטוס החדש
              ...(newStatus === MatchSuggestionStatus.CLOSED ? { closedAt: new Date() } : {}),
              ...(newStatus === MatchSuggestionStatus.PENDING_FIRST_PARTY ? { firstPartySent: new Date() } : {}),
              ...(newStatus === MatchSuggestionStatus.PENDING_SECOND_PARTY ? { secondPartySent: new Date() } : {}),
            },
          });

          // יצירת רשומת היסטוריה
          await tx.suggestionStatusHistory.create({
            data: {
              suggestionId,
              status: newStatus,
              notes: data.internalNotes || `סטטוס עודכן כחלק מעריכת הצעה על ידי ${session.user.firstName} ${session.user.lastName}`,
            },
          });
        });
      }
    }
    // =========================================================================

    const suggestionService = SuggestionService.getInstance();
    
    try {
      // המשך עדכון שאר הפרטים (הערות, עדיפות וכו') דרך השירות הקיים
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