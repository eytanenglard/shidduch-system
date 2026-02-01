// src/app/api/mobile/suggestions/[id]/route.ts
// פרטי הצעת שידוך - למובייל

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyMobileToken } from "@/lib/mobile-auth";

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
          } 
        },
        firstParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            profile: {
              select: {
                age: true,
                city: true,
                occupation: true,
                height: true,
                about: true,
                education: true,
                religiousLevel: true,
                familyBackground: true,
              }
            },
            images: {
              select: { 
                id: true,
                url: true, 
                isMain: true 
              },
              orderBy: { isMain: 'desc' }
            }
          }
        },
        secondParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            profile: {
              select: {
                age: true,
                city: true,
                occupation: true,
                height: true,
                about: true,
                education: true,
                religiousLevel: true,
                familyBackground: true,
              }
            },
            images: {
              select: { 
                id: true,
                url: true, 
                isMain: true 
              },
              orderBy: { isMain: 'desc' }
            }
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // בדיקה שהמשתמש הוא חלק מההצעה
    const isFirstParty = suggestion.firstPartyId === userId;
    const isSecondParty = suggestion.secondPartyId === userId;

    if (!isFirstParty && !isSecondParty) {
      return NextResponse.json(
        { success: false, error: "You are not part of this suggestion" },
        { status: 403 }
      );
    }

    // הצד השני
    const otherParty = isFirstParty ? suggestion.secondParty : suggestion.firstParty;
    const notes = isFirstParty ? suggestion.firstPartyNotes : suggestion.secondPartyNotes;

    // בדיקה אם צריך להציג פרטי קשר
    const showContactDetails = [
      "CONTACT_DETAILS_SHARED",
      "MEETING_PENDING",
      "MEETING_SCHEDULED",
      "DATING",
      "ENGAGED",
      "MARRIED",
    ].includes(suggestion.status);

    const response = {
      id: suggestion.id,
      status: suggestion.status,
      priority: suggestion.priority,
      matchingReason: suggestion.matchingReason,
      notes,
      matchmaker: {
        firstName: suggestion.matchmaker.firstName,
        lastName: suggestion.matchmaker.lastName,
        // הצג טלפון של שדכן תמיד
        phone: suggestion.matchmaker.phone,
      },
      createdAt: suggestion.createdAt,
      decisionDeadline: suggestion.decisionDeadline,
      isFirstParty,
      canRespond: (isFirstParty && suggestion.status === "PENDING_FIRST_PARTY") ||
                  (isSecondParty && suggestion.status === "PENDING_SECOND_PARTY"),
      otherParty: {
        id: otherParty.id,
        firstName: otherParty.firstName,
        lastName: otherParty.lastName,
        age: otherParty.profile?.age,
        city: otherParty.profile?.city,
        occupation: otherParty.profile?.occupation,
        height: otherParty.profile?.height,
        about: otherParty.profile?.about,
        education: otherParty.profile?.education,
        religiousLevel: otherParty.profile?.religiousLevel,
        familyBackground: otherParty.profile?.familyBackground,
        images: otherParty.images,
        // פרטי קשר רק אם משותפים
        ...(showContactDetails && {
          phone: otherParty.phone,
        }),
      },
      statusHistory: suggestion.statusHistory,
    };

    console.log(`[mobile/suggestions/detail] User ${userId} viewed suggestion ${suggestionId}`);

    return NextResponse.json({
      success: true,
      suggestion: response,
    });

  } catch (error) {
    console.error("[mobile/suggestions/detail] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
