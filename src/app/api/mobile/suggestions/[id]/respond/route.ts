// src/app/api/mobile/suggestions/[id]/respond/route.ts
// תגובה להצעת שידוך - למובייל

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { MatchSuggestionStatus } from "@prisma/client";

const respondSchema = z.object({
  response: z.enum(["approve", "decline"]),
  message: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // אימות Bearer token
    const auth = await verifyMobileToken(req);
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = auth.userId;
    const suggestionId = params.id;

    // וולידציה
    const body = await req.json();
    const validation = respondSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { response, message } = validation.data;

    // שליפת ההצעה
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // בדיקה שהמשתמש הוא חלק מההצעה
    const isFirstParty = suggestion.firstPartyId === userId;
    const isSecondParty = suggestion.secondPartyId === userId;

    if (!isFirstParty && !isSecondParty) {
      return NextResponse.json(
        { success: false, error: "You are not part of this suggestion" },
        { status: 403 }
      );
    }

    // בדיקת מצב נוכחי ועדכון
    let newStatus: MatchSuggestionStatus;
    let canRespond = false;

    if (isFirstParty && suggestion.status === MatchSuggestionStatus.PENDING_FIRST_PARTY) {
      canRespond = true;
      newStatus = response === "approve" 
        ? MatchSuggestionStatus.FIRST_PARTY_APPROVED 
        : MatchSuggestionStatus.FIRST_PARTY_DECLINED;
    } else if (isSecondParty && suggestion.status === MatchSuggestionStatus.PENDING_SECOND_PARTY) {
      canRespond = true;
      newStatus = response === "approve" 
        ? MatchSuggestionStatus.SECOND_PARTY_APPROVED 
        : MatchSuggestionStatus.SECOND_PARTY_DECLINED;
    }

    if (!canRespond) {
      return NextResponse.json(
        { success: false, error: "Cannot respond to this suggestion at this time" },
        { status: 400 }
      );
    }

    // עדכון ההצעה
    const updatedSuggestion = await prisma.$transaction(async (tx) => {
      const updated = await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: newStatus,
          previousStatus: suggestion.status,
          lastStatusChange: new Date(),
          lastActivity: new Date(),
          // אם first party אישר, עובר ל-pending second party
          ...(newStatus === MatchSuggestionStatus.FIRST_PARTY_APPROVED && {
            status: MatchSuggestionStatus.PENDING_SECOND_PARTY,
            secondPartySent: new Date(),
          }),
        },
      });

      // יצירת רשומת היסטוריה
      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId,
          status: newStatus,
          notes: message || `${response === "approve" ? "Approved" : "Declined"} by ${isFirstParty ? "first" : "second"} party via mobile app`,
        },
      });

      return updated;
    });

    console.log(`[mobile/suggestions/respond] User ${userId} ${response}d suggestion ${suggestionId}`);

    return NextResponse.json({
      success: true,
      suggestion: {
        id: updatedSuggestion.id,
        status: updatedSuggestion.status,
      },
    });

  } catch (error) {
    console.error("[mobile/suggestions/respond] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
