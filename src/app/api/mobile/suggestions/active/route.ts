// src/app/api/mobile/suggestions/active/route.ts
// הצעות שידוך פעילות - למובייל

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyMobileToken } from "@/lib/mobile-auth";

// פונקציה לחישוב גיל
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

export async function GET(req: NextRequest) {
  try {
    // אימות Bearer token
    const auth = await verifyMobileToken(req);
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = auth.userId;

    // שליפת הצעות פעילות
    const activeSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          { 
            firstPartyId: userId, 
            status: { 
              in: ["PENDING_FIRST_PARTY", "FIRST_PARTY_APPROVED", "PENDING_SECOND_PARTY", "SECOND_PARTY_APPROVED", "CONTACT_DETAILS_SHARED"] 
            } 
          },
          { 
            secondPartyId: userId, 
            status: { 
              in: ["PENDING_SECOND_PARTY", "SECOND_PARTY_APPROVED", "CONTACT_DETAILS_SHARED"] 
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
                birthDate: true,  // ✅ שונה מ-age
                city: true,
                occupation: true,
                height: true,
                about: true,
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
                birthDate: true,  // ✅ שונה מ-age
                city: true,
                occupation: true,
                height: true,
                about: true,
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
      orderBy: { createdAt: "desc" },
    });

    // עיבוד התוצאות - הצגת הצד השני למשתמש
    const suggestions = activeSuggestions.map(suggestion => {
      const isFirstParty = suggestion.firstPartyId === userId;
      const otherParty = isFirstParty ? suggestion.secondParty : suggestion.firstParty;
      const notes = isFirstParty ? suggestion.firstPartyNotes : suggestion.secondPartyNotes;
      
      return {
        id: suggestion.id,
        status: suggestion.status,
        priority: suggestion.priority,
        matchingReason: suggestion.matchingReason,
        notes: notes,
        matchmaker: suggestion.matchmaker,
        createdAt: suggestion.createdAt,
        decisionDeadline: suggestion.decisionDeadline,
        isFirstParty,
        otherParty: {
          id: otherParty.id,
          firstName: otherParty.firstName,
          lastName: otherParty.lastName,
          age: calculateAge(otherParty.profile?.birthDate),  // ✅ חישוב גיל
          city: otherParty.profile?.city,
          occupation: otherParty.profile?.occupation,
          height: otherParty.profile?.height,
          about: otherParty.profile?.about,
          image: otherParty.images?.[0]?.url || null,
        }
      };
    });

    console.log(`[mobile/suggestions/active] Found ${suggestions.length} active suggestions for user ${userId}`);

    return NextResponse.json({
      success: true,
      suggestions,
    });

  } catch (error) {
    console.error("[mobile/suggestions/active] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}