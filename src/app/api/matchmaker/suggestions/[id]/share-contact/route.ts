// src/app/api/matchmaker/suggestions/[id]/share-contact/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, MatchSuggestionStatus } from "@prisma/client";
import { statusTransitionService } from "@/components/matchmaker/suggestions/services/suggestions/StatusTransitionService";
import { EmailDictionary } from "@/types/dictionary";
import { getDictionary } from "@/lib/dictionaries";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const suggestionId = context.params.id;

    const url = new URL(req.url);
    const locale: 'he' | 'en' = (url.searchParams.get('locale') === 'en') ? 'en' : 'he';
    
    console.log(`[API /share-contact] Received request with locale: '${locale}'`);

    const dictionary = await getDictionary(locale);
    const emailDict: EmailDictionary = dictionary.email;

    if (!emailDict) {
        throw new Error(`Email dictionary for locale '${locale}' could not be loaded.`);
    }

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
    
    const updatedSuggestion = await statusTransitionService.transitionStatus(
      suggestion,
      MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
      emailDict,
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