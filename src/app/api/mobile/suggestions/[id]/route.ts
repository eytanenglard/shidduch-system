// src/app/api/mobile/suggestions/[id]/route.ts
// פרטי הצעת שידוך בודדת - למובייל
// UPDATED: Added questionnaire responses + rationale data for compatibility view

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions
} from "@/lib/mobile-auth";
import { formatAnswers, KEY_MAPPING } from '@/lib/questionnaireFormatter';
import type { WorldId } from "@/types/next-auth";
import type { StructuredRationale } from "@/types/structuredRationale";

function calculateAge(birthDate: Date | null | undefined): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const suggestionId = params.id;

    const auth = await verifyMobileToken(req);
    
    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }

    const userId = auth.userId;

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        status: true,
        priority: true,
        matchingReason: true,
        firstPartyNotes: true,
        secondPartyNotes: true,
        internalNotes: true,
        structuredRationale: true,
        firstPartyId: true,
        secondPartyId: true,
        createdAt: true,
        updatedAt: true,
        decisionDeadline: true,
        lastStatusChange: true,
        firstPartySent: true,
        potentialMatch: {
          select: {
            aiScore: true,
            shortReasoning: true,
            scoreBreakdown: true,
            scoreForMale: true,
            scoreForFemale: true,
          }
        },
        matchmaker: { 
          select: { 
            firstName: true, 
            lastName: true,
            phone: true,
            email: true,
          } 
        },
        firstParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            profile: {
              select: {
                birthDate: true,
                city: true,
                occupation: true,
                education: true,
                educationLevel: true,
                height: true,
                about: true,
                religiousLevel: true,
                origin: true,
                maritalStatus: true,
                profileCharacterTraits: true,
                profileHobbies: true,
                isFriendsSectionVisible: true,
                testimonials: {
                  where: { status: 'APPROVED' },
                  select: {
                    authorName: true,
                    relationship: true,
                    content: true,
                  }
                },
              }
            },
            images: {
              orderBy: { isMain: 'desc' },
              select: {
                url: true,
                isMain: true,
              }
            },
            // NEW: Include questionnaire responses
            questionnaireResponses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                valuesAnswers: true,
                personalityAnswers: true,
                relationshipAnswers: true,
                partnerAnswers: true,
                religionAnswers: true,
              }
            }
          }
        },
        secondParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            profile: {
              select: {
                birthDate: true,
                city: true,
                occupation: true,
                education: true,
                educationLevel: true,
                height: true,
                about: true,
                religiousLevel: true,
                origin: true,
                maritalStatus: true,
                profileCharacterTraits: true,
                profileHobbies: true,
                isFriendsSectionVisible: true,
                testimonials: {
                  where: { status: 'APPROVED' },
                  select: {
                    authorName: true,
                    relationship: true,
                    content: true,
                  }
                },
              }
            },
            images: {
              orderBy: { isMain: 'desc' },
              select: {
                url: true,
                isMain: true,
              }
            },
            // NEW: Include questionnaire responses
            questionnaireResponses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                valuesAnswers: true,
                personalityAnswers: true,
                relationshipAnswers: true,
                partnerAnswers: true,
                religionAnswers: true,
              }
            }
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            notes: true,
            createdAt: true,
          }
        },
      },
    });

    if (!suggestion) {
      return corsError(req, "Suggestion not found", 404);
    }

    const isFirstParty = suggestion.firstPartyId === userId;
    const isSecondParty = suggestion.secondPartyId === userId;

    if (!isFirstParty && !isSecondParty) {
      return corsError(req, "Access denied", 403);
    }

    const otherPartyRaw = isFirstParty ? suggestion.secondParty : suggestion.firstParty;
    const notes = isFirstParty ? suggestion.firstPartyNotes : suggestion.secondPartyNotes;

    // Process questionnaire responses
    let questionnaireAnswers: Record<string, any[]> | null = null;
    
    if (otherPartyRaw.questionnaireResponses && otherPartyRaw.questionnaireResponses.length > 0) {
      const qr = otherPartyRaw.questionnaireResponses[0];
      questionnaireAnswers = {};
      
      // Format answers for each world
      (Object.keys(KEY_MAPPING) as WorldId[]).forEach(worldKey => {
        const dbKey = KEY_MAPPING[worldKey];
        const answersJson = qr[dbKey as keyof typeof qr];
        if (answersJson) {
          const formatted = formatAnswers(answersJson);
          // Only include visible answers
          questionnaireAnswers![worldKey] = formatted.filter(a => a.isVisible !== false);
        }
      });
    }

    const otherParty: any = {
      id: otherPartyRaw.id,
      firstName: otherPartyRaw.firstName,
      lastName: otherPartyRaw.lastName,
      age: calculateAge(otherPartyRaw.profile?.birthDate),
      city: otherPartyRaw.profile?.city || null,
      occupation: otherPartyRaw.profile?.occupation || null,
      education: otherPartyRaw.profile?.education || null,
      educationLevel: otherPartyRaw.profile?.educationLevel || null,
      height: otherPartyRaw.profile?.height || null,
      about: otherPartyRaw.profile?.about || null,
      religiousLevel: otherPartyRaw.profile?.religiousLevel || null,
      origin: otherPartyRaw.profile?.origin || null,
      maritalStatus: otherPartyRaw.profile?.maritalStatus || null,
      characterTraits: otherPartyRaw.profile?.profileCharacterTraits || [],
      hobbies: otherPartyRaw.profile?.profileHobbies || [],
      images: otherPartyRaw.images?.map(img => img.url) || [],
      mainImage: otherPartyRaw.images?.find(img => img.isMain)?.url || otherPartyRaw.images?.[0]?.url || null,
      questionnaireAnswers,
      testimonials: (otherPartyRaw.profile?.isFriendsSectionVisible !== false)
        ? (otherPartyRaw.profile?.testimonials || [])
        : [],
    };

    const showContactDetails = suggestion.status === 'CONTACT_DETAILS_SHARED';

    if (showContactDetails) {
      otherParty.phone = otherPartyRaw.phone;
      otherParty.email = otherPartyRaw.email;
    }

const canRespond =
      (isFirstParty && suggestion.status === 'PENDING_FIRST_PARTY') ||
      (isSecondParty && suggestion.status === 'PENDING_SECOND_PARTY') ||
      (isFirstParty && suggestion.status === 'RE_OFFERED_TO_FIRST_PARTY') ||
      (isSecondParty && suggestion.status === 'SECOND_PARTY_NOT_AVAILABLE');

    // Build compatibility rationale from existing data (no new computation)
    const rationale = suggestion.structuredRationale as StructuredRationale | null;
    const potentialMatch = suggestion.potentialMatch;

    const compatibilityRationale: Record<string, any> = {};

    // Layer 1: Matchmaker's reasoning (human touch)
    const matchmakerReason = suggestion.matchingReason
      || rationale?.matchmaker?.generalReason
      || null;
    if (matchmakerReason) {
      compatibilityRationale.matchmakerReason = matchmakerReason;
    }

    // Layer 1: System/AI scanning reasoning
    const systemReasoning = rationale?.ai?.shortReasoning
      || potentialMatch?.shortReasoning
      || null;
    if (systemReasoning) {
      compatibilityRationale.systemReasoning = systemReasoning;
    }

    // Layer 2: Score breakdown by category (from scanning)
    const scoreBreakdown = rationale?.ai?.scoreBreakdown
      || (potentialMatch?.scoreBreakdown as Record<string, any> | null)
      || null;
    if (scoreBreakdown) {
      compatibilityRationale.scoreBreakdown = scoreBreakdown;
    }

    // Overall system score (from scanning, not AI analysis)
    const systemScore = rationale?.ai?.score
      ?? potentialMatch?.aiScore
      ?? null;
    if (systemScore != null) {
      compatibilityRationale.systemScore = Math.round(systemScore);
    }

    // Asymmetric scores (how much each side matches the other)
    if (potentialMatch?.scoreForMale != null && potentialMatch?.scoreForFemale != null) {
      // Determine which score is "for you" vs "for them" based on the user's gender perspective
      // scoreForMale = how well the female matches the male's preferences
      // scoreForFemale = how well the male matches the female's preferences
      compatibilityRationale.scoreForYou = Math.round(
        isFirstParty ? potentialMatch.scoreForMale! : potentialMatch.scoreForFemale!
      );
      compatibilityRationale.scoreForThem = Math.round(
        isFirstParty ? potentialMatch.scoreForFemale! : potentialMatch.scoreForMale!
      );
    }

    const responseData = {
      id: suggestion.id,
      status: suggestion.status,
      priority: suggestion.priority,
      matchingReason: suggestion.matchingReason,
      notes: notes,
      createdAt: suggestion.createdAt,
      updatedAt: suggestion.updatedAt,
      decisionDeadline: suggestion.decisionDeadline,
      lastStatusChange: suggestion.lastStatusChange,
      isFirstParty,
      canRespond,
      showContactDetails,
      compatibilityRationale: Object.keys(compatibilityRationale).length > 0
        ? compatibilityRationale
        : null,
      matchmaker: {
        firstName: suggestion.matchmaker.firstName,
        lastName: suggestion.matchmaker.lastName,
        ...(showContactDetails && {
          phone: suggestion.matchmaker.phone,
          email: suggestion.matchmaker.email,
        }),
      },
      otherParty,
      statusHistory: suggestion.statusHistory,
    };

    console.log(`[mobile/suggestions/${suggestionId}] Fetched for user ${userId}, isFirstParty: ${isFirstParty}, hasQuestionnaire: ${!!questionnaireAnswers}`);

    return corsJson(req, {
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("[mobile/suggestions/[id]] Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}