// src/app/api/mobile/suggestions/[id]/route.ts
// פרטי הצעת שידוך בודדת - למובייל

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const suggestionId = params.id;

    // שליפת ההצעה עם כל הפרטים
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
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // בדיקה שהמשתמש הוא אחד הצדדים בהצעה
    const isFirstParty = suggestion.firstPartyId === userId;
    const isSecondParty = suggestion.secondPartyId === userId;

    if (!isFirstParty && !isSecondParty) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // הצד השני
    const otherPartyRaw = isFirstParty ? suggestion.secondParty : suggestion.firstParty;
    const notes = isFirstParty ? suggestion.firstPartyNotes : suggestion.secondPartyNotes;

    // בניית אובייקט התגובה
    const otherParty = {
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

    // בדיקה אם להציג פרטי קשר (רק אם הסטטוס מאפשר)
    const showContactDetails = suggestion.status === 'CONTACT_DETAILS_SHARED';

    // הוספת פרטי קשר אם מותר
    if (showContactDetails) {
      Object.assign(otherParty, {
        phone: otherPartyRaw.phone,
        email: otherPartyRaw.email,
      });
    }

    // בדיקה האם המשתמש יכול להגיב
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
        // פרטי קשר של השדכן רק אם צריך
        ...(showContactDetails && {
          phone: suggestion.matchmaker.phone,
          email: suggestion.matchmaker.email,
        }),
      },
      otherParty,
      statusHistory: suggestion.statusHistory,
    };

    console.log(`[mobile/suggestions/${suggestionId}] Fetched for user ${userId}, isFirstParty: ${isFirstParty}`);

    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("[mobile/suggestions/[id]] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}