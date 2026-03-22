// src/app/api/suggestions/history/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { FormattedAnswersType } from '@/lib/questionnaireFormatter';
import { formatQuestionnaireForDisplay } from '@/lib/services/questionnaireService';
import type { ExtendedMatchSuggestion, PartyInfo, QuestionnaireResponse } from "@/types/suggestions";
export const dynamic = 'force-dynamic';
// --- טיפוסים חזקים ומדויקים לתהליך העיבוד ---
type ProcessedQuestionnaireResponse = Omit<QuestionnaireResponse, 'valuesAnswers' | 'personalityAnswers' | 'relationshipAnswers' | 'partnerAnswers' | 'religionAnswers'> & {
  formattedAnswers: FormattedAnswersType;
};

type ProcessedPartyInfo = Omit<PartyInfo, 'questionnaireResponses'> & {
  questionnaireResponses?: ProcessedQuestionnaireResponse[];
};

type SuggestionWithFormattedData = Omit<ExtendedMatchSuggestion, 'firstParty' | 'secondParty'> & {
  firstParty: ProcessedPartyInfo;
  secondParty: ProcessedPartyInfo;
};

// הטיפוס שמגיע מ-Prisma.
type PartyInfoFromPrisma = Omit<PartyInfo, 'questionnaireResponses'> & {
  questionnaireResponses?: QuestionnaireResponse[];
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const historySuggestions = await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          { firstPartyId: session.user.id, status: { in: ["FIRST_PARTY_DECLINED", "SECOND_PARTY_DECLINED", "MATCH_DECLINED", "CLOSED", "CANCELLED", "MARRIED", "ENGAGED"] } },
          { secondPartyId: session.user.id, status: { in: ["SECOND_PARTY_DECLINED", "MATCH_DECLINED", "CLOSED", "CANCELLED", "MARRIED", "ENGAGED"] } },
        ],
      },
      include: {
        statusHistory: { orderBy: { createdAt: 'desc' } },
        matchmaker: { select: { firstName: true, lastName: true } },
        firstParty: {
          include: { profile: true, images: true, questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
        secondParty: {
          include: { profile: true, images: true, questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const suggestionsWithFormattedQuestionnaires = await Promise.all(historySuggestions.map(async suggestion => {
        const formatPartyQuestionnaire = async (party: PartyInfoFromPrisma): Promise<ProcessedPartyInfo> => {
            const { questionnaireResponses, ...restOfParty } = party;

            if (questionnaireResponses && questionnaireResponses.length > 0) {
                const qr = questionnaireResponses[0];
                const formatted = await formatQuestionnaireForDisplay(qr as any, 'he', false, party.profile?.gender);

                const { valuesAnswers, personalityAnswers, relationshipAnswers, partnerAnswers, religionAnswers, ...restOfFormatted } = formatted;
                const processedQr: ProcessedQuestionnaireResponse = {
                    ...restOfFormatted,
                    formattedAnswers: formatted.formattedAnswers as FormattedAnswersType,
                };

                return { ...restOfParty, questionnaireResponses: [processedQr] };
            }
            return restOfParty;
        };

        return {
            ...suggestion,
            firstParty: await formatPartyQuestionnaire(suggestion.firstParty),
            secondParty: await formatPartyQuestionnaire(suggestion.secondParty),
        };
    }));

    return NextResponse.json({
      success: true,
      suggestions: suggestionsWithFormattedQuestionnaires,
    });

  } catch (error) {
    console.error("Error fetching suggestion history:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}