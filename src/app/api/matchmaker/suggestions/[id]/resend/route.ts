// src/app/api/matchmaker/suggestions/[id]/resend/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, MatchSuggestionStatus } from "@prisma/client";
import { statusTransitionService } from "@/components/matchmaker/suggestions/services/suggestions/StatusTransitionService";
import { getDictionary } from "@/lib/dictionaries";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const params = await props.params;
    const suggestionId = params.id;
    const { partyType } = await req.json();

    // ========================= טעינת המילונים =========================
    const [dictHe, dictEn] = await Promise.all([
      getDictionary('he'),
      getDictionary('en')
    ]);

    const dictionaries = {
      he: dictHe.email,
      en: dictEn.email
    };
    // =================================================================

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true
      },
    });

    if (!suggestion) {
      return NextResponse.json({ success: false, error: "Suggestion not found" }, { status: 404 });
    }

    if (suggestion.matchmakerId !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "You are not authorized to resend this suggestion" }, { status: 403 });
    }

    // חילוץ שפות
    const languagePrefs = {
        firstParty: (suggestion.firstParty as any).language || 'he',
        secondParty: (suggestion.secondParty as any).language || 'he',
        matchmaker: (suggestion.matchmaker as any).language || 'he',
    };

    let updatedSuggestion = suggestion;
    const transitionNotes = `הצעה נשלחה מחדש ע"י ${session.user.firstName} ${session.user.lastName}`;
    
    if (partyType === "both" || partyType === "first") {
      updatedSuggestion = await statusTransitionService.transitionStatus(
        updatedSuggestion, 
        MatchSuggestionStatus.PENDING_FIRST_PARTY,
        dictionaries, // העברת המילונים
        `${transitionNotes} - לצד ראשון`,
        {
          sendNotifications: true,
          notifyParties: ['first']
        },
        languagePrefs // העברת השפות
      );
      
      if (partyType === "first") {
        await prisma.matchSuggestion.update({
          where: { id: suggestionId },
          data: { firstPartySent: new Date(), lastActivity: new Date() }
        });
      }
    }
    
    if (partyType === "both" || partyType === "second") {
      updatedSuggestion = await statusTransitionService.transitionStatus(
        updatedSuggestion, 
        MatchSuggestionStatus.PENDING_SECOND_PARTY,
        dictionaries, // העברת המילונים
        `${transitionNotes} - לצד שני`,
        {
          sendNotifications: true,
          notifyParties: ['second']
        },
        languagePrefs // העברת השפות
      );
      
      await prisma.matchSuggestion.update({
        where: { id: suggestionId },
        data: { secondPartySent: new Date(), lastActivity: new Date() }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Suggestion successfully resent`,
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