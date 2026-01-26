// src/app/api/matchmaker/suggestions/[id]/share-contact/route.ts

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
      return NextResponse.json({ success: false, error: "You are not authorized to share contact details for this suggestion" }, { status: 403 });
    }
    
    if (suggestion.status !== MatchSuggestionStatus.SECOND_PARTY_APPROVED) {
      return NextResponse.json({
        success: false,
        error: "Cannot share contacts until both parties have approved the suggestion."
      }, { status: 400 });
    }

    // חילוץ שפות
    const languagePrefs = {
        firstParty: (suggestion.firstParty as any).language || 'he',
        secondParty: (suggestion.secondParty as any).language || 'he',
        matchmaker: (suggestion.matchmaker as any).language || 'he',
    };
    
    const updatedSuggestion = await statusTransitionService.transitionStatus(
      suggestion,
      MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
      dictionaries, // העברת המילונים
      `פרטי קשר שותפו בין ${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} ל${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} ע"י ${session.user.firstName} ${session.user.lastName}`,
      {
        sendNotifications: true,
        notifyParties: ['first', 'second', 'matchmaker']
      },
      languagePrefs // העברת השפות
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