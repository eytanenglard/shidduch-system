// src/app/api/suggestions/active/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MatchSuggestionStatus } from "@prisma/client";
import { FormattedAnswersType } from '@/lib/questionnaireFormatter';
import { formatQuestionnaireForDisplay } from '@/lib/services/questionnaireService';
import type { QuestionnaireResponse } from "@/types/suggestions";
export const dynamic = 'force-dynamic';

// =====================================================================
// כל הסטטוסים שנחשבים "אקטיביים" - מוגדרים כ-enum values
// =====================================================================
const FIRST_PARTY_ACTIVE_STATUSES: MatchSuggestionStatus[] = [
  MatchSuggestionStatus.PENDING_FIRST_PARTY,
  MatchSuggestionStatus.FIRST_PARTY_INTERESTED,
  MatchSuggestionStatus.FIRST_PARTY_APPROVED,
  MatchSuggestionStatus.PENDING_SECOND_PARTY,
  MatchSuggestionStatus.SECOND_PARTY_APPROVED,
  MatchSuggestionStatus.AWAITING_MATCHMAKER_APPROVAL,
  MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
  MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK,
  MatchSuggestionStatus.THINKING_AFTER_DATE,
  MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE,
  MatchSuggestionStatus.MEETING_PENDING,
  MatchSuggestionStatus.MEETING_SCHEDULED,
  MatchSuggestionStatus.MATCH_APPROVED,
  MatchSuggestionStatus.DATING,
  MatchSuggestionStatus.ENGAGED,
];

const SECOND_PARTY_ACTIVE_STATUSES: MatchSuggestionStatus[] = [
  MatchSuggestionStatus.PENDING_SECOND_PARTY,
  MatchSuggestionStatus.SECOND_PARTY_APPROVED,
  MatchSuggestionStatus.AWAITING_MATCHMAKER_APPROVAL,
  MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
  MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK,
  MatchSuggestionStatus.THINKING_AFTER_DATE,
  MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE,
  MatchSuggestionStatus.MEETING_PENDING,
  MatchSuggestionStatus.MEETING_SCHEDULED,
  MatchSuggestionStatus.MATCH_APPROVED,
  MatchSuggestionStatus.DATING,
  MatchSuggestionStatus.ENGAGED,
];

// --- טיפוס עזר לעיבוד השאלון ---
type ProcessedQuestionnaireResponse = Omit<QuestionnaireResponse, 'valuesAnswers' | 'personalityAnswers' | 'relationshipAnswers' | 'partnerAnswers' | 'religionAnswers'> & {
  formattedAnswers: FormattedAnswersType;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          {
            firstPartyId: session.user.id,
            status: { in: FIRST_PARTY_ACTIVE_STATUSES },
          },
          {
            secondPartyId: session.user.id,
            status: { in: SECOND_PARTY_ACTIVE_STATUSES },
          },
        ],
      },
      include: {
        statusHistory: { orderBy: { createdAt: 'desc' } },
        matchmaker: { select: { firstName: true, lastName: true } },
        firstParty: {
          include: {
            profile: true,
            images: true,
            questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        secondParty: {
          include: {
            profile: true,
            images: true,
            questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // --- עיבוד: פורמט שאלונים עם מילון עברי מלא ---
    const processedSuggestions = await Promise.all(activeSuggestions.map(async (suggestion) => {

      const formatPartyQuestionnaire = async (party: typeof suggestion.firstParty) => {
        const { questionnaireResponses, ...restOfParty } = party;

        if (questionnaireResponses && questionnaireResponses.length > 0) {
          const qr = questionnaireResponses[0];
          const formatted = await formatQuestionnaireForDisplay(qr as any, 'he', false);

          const {
            valuesAnswers,
            personalityAnswers,
            relationshipAnswers,
            partnerAnswers,
            religionAnswers,
            ...restOfFormatted
          } = formatted;

          return {
            ...restOfParty,
            questionnaireResponses: [restOfFormatted],
          };
        }

        return { ...restOfParty, questionnaireResponses: [] };
      };

      return {
        ...suggestion,
        firstParty: await formatPartyQuestionnaire(suggestion.firstParty),
        secondParty: await formatPartyQuestionnaire(suggestion.secondParty),
      };
    }));

    return NextResponse.json({
      success: true,
      suggestions: processedSuggestions,
    });

  } catch (error) {
    console.error("Error fetching active suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}