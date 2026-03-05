// src/app/api/suggestions/history/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatAnswers, KEY_MAPPING, FormattedAnswersType } from '@/lib/questionnaireFormatter';
import type { ExtendedMatchSuggestion, PartyInfo, QuestionnaireResponse, WorldId } from "@/types/suggestions";

export const dynamic = 'force-dynamic';

// --- טיפוסים חזקים ומדויקים לתהליך העיבוד ---
type ProcessedQuestionnaireResponse = Omit<
  QuestionnaireResponse,
  'valuesAnswers' | 'personalityAnswers' | 'relationshipAnswers' | 'partnerAnswers' | 'religionAnswers'
> & {
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
          {
            firstPartyId: session.user.id,
            status: {
              in: [
                "FIRST_PARTY_DECLINED",
                "SECOND_PARTY_DECLINED",
                "MATCH_DECLINED",
                "CLOSED",
                "CANCELLED",
                "MARRIED",
                "ENGAGED",
              ],
            },
          },
          {
            secondPartyId: session.user.id,
            status: {
              in: [
                "SECOND_PARTY_DECLINED",
                "MATCH_DECLINED",
                "CLOSED",
                "CANCELLED",
                "MARRIED",
                "ENGAGED",
              ],
            },
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
      orderBy: { updatedAt: "desc" },
    });

    // --- סינון ראשוני: הסרת suggestions עם firstParty או secondParty חסרים ---
    const validSuggestions = historySuggestions.filter(
      (suggestion) => suggestion.firstParty && suggestion.secondParty
    );

    // --- עיבוד: פורמט שאלונים ---
    const suggestionsWithFormattedQuestionnaires = validSuggestions
      .map((suggestion) => {
        const formatPartyQuestionnaire = (
          party: PartyInfoFromPrisma | null | undefined
        ): ProcessedPartyInfo | null => {
          // בדיקת null safety
          if (!party) {
            return null;
          }

          const { questionnaireResponses, ...restOfParty } = party;

          if (questionnaireResponses && questionnaireResponses.length > 0) {
            const qr = questionnaireResponses[0];
            const formattedAnswers: Partial<FormattedAnswersType> = {};

            (Object.keys(KEY_MAPPING) as WorldId[]).forEach((worldKey) => {
              const dbKey = KEY_MAPPING[worldKey];
              const answersJson = qr[dbKey];
              formattedAnswers[worldKey] = formatAnswers(answersJson);
            });

            const {
              valuesAnswers,
              personalityAnswers,
              relationshipAnswers,
              partnerAnswers,
              religionAnswers,
              ...restOfQr
            } = qr;

            const processedQr: ProcessedQuestionnaireResponse = {
              ...restOfQr,
              formattedAnswers: formattedAnswers as FormattedAnswersType,
            };

            return { ...restOfParty, questionnaireResponses: [processedQr] };
          }

          return { ...restOfParty, questionnaireResponses: [] };
        };

        const firstParty = formatPartyQuestionnaire(suggestion.firstParty);
        const secondParty = formatPartyQuestionnaire(suggestion.secondParty);

        // בדיקת בטיחות נוספת - אם אחד מהם null, לא כולל את ההצעה
        if (!firstParty || !secondParty) {
          console.warn(
            `[History Suggestions] Skipping suggestion ${suggestion.id} - missing party data`
          );
          return null;
        }

        return {
          ...suggestion,
          firstParty,
          secondParty,
        };
      })
    .filter(Boolean);

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