// src/app/api/mobile/suggestions/[id]/route.ts
// פרטי הצעת שידוך בודדת - למובייל

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { 
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions
} from "@/lib/mobile-auth";

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
      include: {
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
              }
            },
            images: {
              orderBy: { isMain: 'desc' },
              select: { 
                url: true,
                isMain: true,
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
              }
            },
            images: {
              orderBy: { isMain: 'desc' },
              select: { 
                url: true,
                isMain: true,
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
    };

    const showContactDetails = suggestion.status === 'CONTACT_DETAILS_SHARED';

    if (showContactDetails) {
      otherParty.phone = otherPartyRaw.phone;
      otherParty.email = otherPartyRaw.email;
    }

    const canRespond = 
      (isFirstParty && suggestion.status === 'PENDING_FIRST_PARTY') ||
      (isSecondParty && suggestion.status === 'PENDING_SECOND_PARTY');

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

    console.log(`[mobile/suggestions/${suggestionId}] Fetched for user ${userId}, isFirstParty: ${isFirstParty}`);

    return corsJson(req, {
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("[mobile/suggestions/[id]] Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}