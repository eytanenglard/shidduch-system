// src/app/api/mobile/suggestions/history/route.ts
// היסטוריית הצעות שידוך - למובייל

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

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    
    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }

    const userId = auth.userId;

    const historySuggestions = await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          { 
            firstPartyId: userId, 
            status: { 
              in: ["FIRST_PARTY_DECLINED", "SECOND_PARTY_DECLINED", "MATCH_DECLINED", "CLOSED", "CANCELLED", "MARRIED", "ENGAGED"] 
            } 
          },
          { 
            secondPartyId: userId, 
            status: { 
              in: ["SECOND_PARTY_DECLINED", "MATCH_DECLINED", "CLOSED", "CANCELLED", "MARRIED", "ENGAGED"] 
            } 
          },
        ],
      },
      include: {
        matchmaker: { 
          select: { 
            firstName: true, 
            lastName: true 
          } 
        },
        firstParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                birthDate: true,
                city: true,
                occupation: true,
              }
            },
            images: {
              where: { isMain: true },
              take: 1,
              select: { url: true }
            }
          }
        },
        secondParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                birthDate: true,
                city: true,
                occupation: true,
              }
            },
            images: {
              where: { isMain: true },
              take: 1,
              select: { url: true }
            }
          }
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const suggestions = historySuggestions.map(suggestion => {
      const isFirstParty = suggestion.firstPartyId === userId;
      const otherParty = isFirstParty ? suggestion.secondParty : suggestion.firstParty;
      
      return {
        id: suggestion.id,
        status: suggestion.status,
        matchmaker: suggestion.matchmaker,
        createdAt: suggestion.createdAt,
        updatedAt: suggestion.updatedAt,
        closedAt: suggestion.closedAt,
        isFirstParty,
        otherParty: {
          id: otherParty.id,
          firstName: otherParty.firstName,
          lastName: otherParty.lastName,
          age: calculateAge(otherParty.profile?.birthDate),
          city: otherParty.profile?.city,
          occupation: otherParty.profile?.occupation,
          image: otherParty.images?.[0]?.url || null,
        }
      };
    });

    console.log(`[mobile/suggestions/history] Found ${suggestions.length} history suggestions for user ${userId}`);

    return corsJson(req, {
      success: true,
      suggestions,
    });

  } catch (error) {
    console.error("[mobile/suggestions/history] Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}