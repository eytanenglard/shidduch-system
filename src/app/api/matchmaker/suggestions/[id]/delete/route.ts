// src/app/api/matchmaker/suggestions/[id]/delete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // וידוא שמשתמש מחובר
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // וידוא הרשאות שדכן או אדמין
    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const suggestionId = params.id;

    // וידוא קיום ההצעה
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        matchmaker: {
          select: { id: true }
        }
      }
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // בדיקת הרשאות ספציפיות - רק השדכן שיצר את ההצעה או אדמין יכולים למחוק
    if (suggestion.matchmaker.id !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to delete this suggestion" },
        { status: 403 }
      );
    }

    // מחיקת רכיבים קשורים בנפרד במקום בטרנזקציה
    // 1. מחיקת רשומות היסטוריה
    await prisma.suggestionStatusHistory.deleteMany({
      where: { suggestionId }
    });

    // 2. מחיקת משוב פגישות אם קיים
    await prisma.dateFeedback.deleteMany({
      where: { suggestionId }
    });

    // 3. מחיקת פגישות קשורות (אם יש)
    await prisma.meeting.deleteMany({
      where: { suggestionId }
    });

    // 4. מחיקת שאלות/פניות אם קיימות
    await prisma.suggestionInquiry.deleteMany({
      where: { suggestionId }
    });

    // 5. הסרת קשרים בטבלאות קשר רבים-לרבים (אם יש)
    await prisma.matchSuggestion.update({
      where: { id: suggestionId },
      data: {
        approvedBy: {
          set: []
        },
        reviewedBy: {
          set: []
        }
      }
    });

    // 6. מחיקת ההצעה עצמה
    await prisma.matchSuggestion.delete({
      where: { id: suggestionId }
    });

    return NextResponse.json({
      success: true,
      message: "Suggestion deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting suggestion:", error);
    
    // החזרת פרטי שגיאה אם קיימים
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete suggestion", 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}