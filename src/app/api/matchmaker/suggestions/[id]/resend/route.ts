// src/app/api/matchmaker/suggestions/[id]/resend/route.ts

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
    const { partyType } = await req.json();

    const url = new URL(req.url);
    const locale: 'he' | 'en' = (url.searchParams.get('locale') === 'en') ? 'en' : 'he';
    
    console.log(`[API /resend] Received request with locale: '${locale}'`);

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
      return NextResponse.json({ success: false, error: "You are not authorized to resend this suggestion" }, { status: 403 });
    }

    let updatedSuggestion = suggestion;
    const transitionNotes = `הצעה נשלחה מחדש ע"י ${session.user.firstName} ${session.user.lastName}`;
    
    if (partyType === "both" || partyType === "first") {
      updatedSuggestion = await statusTransitionService.transitionStatus(
        updatedSuggestion, 
        MatchSuggestionStatus.PENDING_FIRST_PARTY,
        emailDict,
        `${transitionNotes} - לצד ראשון`,
        {
          sendNotifications: true,
          notifyParties: ['first']
        }
      );
      
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
      updatedSuggestion = await statusTransitionService.transitionStatus(
        updatedSuggestion, 
        MatchSuggestionStatus.PENDING_SECOND_PARTY,
        emailDict,
        `${transitionNotes} - לצד שני`,
        {
          sendNotifications: true,
          notifyParties: ['second']
        }
      );
      
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