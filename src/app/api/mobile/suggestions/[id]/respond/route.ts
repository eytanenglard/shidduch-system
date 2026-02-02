// src/app/api/mobile/suggestions/[id]/respond/route.ts
// תגובה להצעת שידוך - למובייל

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyMobileToken } from "@/lib/mobile-auth";
import type { MatchSuggestionStatus } from "@prisma/client";

// תיקון: הגדרת ה-Params כ-Promise (תואם ל-Next.js 15)
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // שלב 1: חילוץ הפרמטרים עם await
    const params = await props.params;
    const suggestionId = params.id;

    // אימות Bearer token
    const auth = await verifyMobileToken(req);
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = auth.userId;

    // פענוח הבקשה
    const body = await req.json();
    const { response, reason, notes } = body as {
      response: 'approve' | 'decline';
      reason?: string;
      notes?: string;
    };

    if (!response || !['approve', 'decline'].includes(response)) {
      return NextResponse.json(
        { success: false, error: "Invalid response. Must be 'approve' or 'decline'" },
        { status: 400 }
      );
    }

    // שליפת ההצעה
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        status: true,
        firstPartyId: true,
        secondPartyId: true,
        matchmakerId: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // בדיקה שהמשתמש הוא אחד הצדדים
    const isFirstParty = suggestion.firstPartyId === userId;
    const isSecondParty = suggestion.secondPartyId === userId;

    if (!isFirstParty && !isSecondParty) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // בדיקה שזה התור של המשתמש להגיב
    const canRespond = 
      (isFirstParty && suggestion.status === 'PENDING_FIRST_PARTY') ||
      (isSecondParty && suggestion.status === 'PENDING_SECOND_PARTY');

    if (!canRespond) {
      return NextResponse.json(
        { success: false, error: "Cannot respond at this stage" },
        { status: 400 }
      );
    }

    // חישוב הסטטוס החדש
    let newStatus: MatchSuggestionStatus;
    
    if (response === 'approve') {
      if (isFirstParty) {
        newStatus = 'FIRST_PARTY_APPROVED';
      } else {
        // אם צד ב' מאשר, עוברים לשיתוף פרטים
        newStatus = 'SECOND_PARTY_APPROVED';
      }
    } else {
      // דחייה
      if (isFirstParty) {
        newStatus = 'FIRST_PARTY_DECLINED';
      } else {
        newStatus = 'SECOND_PARTY_DECLINED';
      }
    }

    // עדכון ההצעה
    const updateData: any = {
      status: newStatus,
      lastStatusChange: new Date(),
      lastActivity: new Date(),
    };

    // עדכון הערות לפי הצד
    if (isFirstParty) {
      updateData.firstPartyResponded = new Date();
      if (notes) {
        updateData.firstPartyNotes = notes;
      }
    } else {
      updateData.secondPartyResponded = new Date();
      if (notes) {
        updateData.secondPartyNotes = notes;
      }
    }

    // אם זו דחייה ויש סיבה, נשמור אותה בהערות הפנימיות
    if (response === 'decline' && reason) {
      const existingNotes = suggestion.status || ''; // שים לב: כאן אולי התכוונת לשדה notes פנימי אחר, כי status הוא enum
      // הנחה: אתה רוצה לשמור את ההיסטוריה בשדה internalNotes אם קיים, או בשדה אחר. הקוד המקורי השתמש ב-status כמחרוזת שזה עלול להיות בעייתי.
      // תיקון לוגי קטן: שימוש ב-internalNotes מדאטה קיים אם יש, אחרת מחרוזת ריקה.
      // כאן נשאר נאמן לקוד המקורי שלך לבינתיים, אך שים לב ש-suggestion.status הוא Enum.
      updateData.internalNotes = `[${new Date().toISOString()}] ${isFirstParty ? 'צד א' : 'צד ב'} דחה: ${reason}`.trim();
    }

    // עדכון בדאטהבייס
    const updatedSuggestion = await prisma.matchSuggestion.update({
      where: { id: suggestionId },
      data: updateData,
      select: {
        id: true,
        status: true,
        lastStatusChange: true,
      },
    });

    // יצירת רשומת היסטוריה
    await prisma.suggestionStatusHistory.create({
      data: {
        suggestionId: suggestionId,
        status: newStatus,
        notes: response === 'approve' 
          ? (notes || (isFirstParty ? 'צד א אישר' : 'צד ב אישר'))
          : (reason || (isFirstParty ? 'צד א דחה' : 'צד ב דחה')),
      },
    });

    // אם שני הצדדים אישרו, נעדכן לשיתוף פרטים
    if (newStatus === 'SECOND_PARTY_APPROVED') {
      // בדיקה שצד א' אישר קודם
      const firstPartyApproved = await prisma.suggestionStatusHistory.findFirst({
        where: {
          suggestionId: suggestionId,
          status: 'FIRST_PARTY_APPROVED',
        },
      });

      if (firstPartyApproved) {
        await prisma.matchSuggestion.update({
          where: { id: suggestionId },
          data: {
            status: 'CONTACT_DETAILS_SHARED',
            lastStatusChange: new Date(),
          },
        });

        await prisma.suggestionStatusHistory.create({
          data: {
            suggestionId: suggestionId,
            status: 'CONTACT_DETAILS_SHARED',
            notes: 'שני הצדדים אישרו - פרטי קשר שותפו',
          },
        });

        // TODO: שליחת התראות לשני הצדדים
      }
    }

    console.log(`[mobile/suggestions/${suggestionId}/respond] User ${userId} responded: ${response}, new status: ${newStatus}`);

    return NextResponse.json({
      success: true,
      message: response === 'approve' ? 'ההצעה אושרה בהצלחה' : 'ההצעה נדחתה',
      data: {
        id: updatedSuggestion.id,
        status: updatedSuggestion.status,
        lastStatusChange: updatedSuggestion.lastStatusChange,
      },
    });

  } catch (error) {
    console.error("[mobile/suggestions/[id]/respond] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}