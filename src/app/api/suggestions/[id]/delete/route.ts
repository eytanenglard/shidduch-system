import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // וידוא שהמשתמש הוא שדכן
    if (session.user.role !== UserRole.MATCHMAKER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const suggestionId = context.params.id;

    // בדיקה שההצעה קיימת
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // וידוא שהשדכן הוא בעל ההצעה
    if (suggestion.matchmakerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // מחיקת ההצעה וכל הנתונים הקשורים אליה
    await prisma.$transaction([
      // מחיקת היסטוריית סטטוסים
      prisma.suggestionStatusHistory.deleteMany({
        where: { suggestionId },
      }),
      // מחיקת שאלות
      prisma.suggestionInquiry.deleteMany({
        where: { suggestionId },
      }),
      // מחיקת ההצעה עצמה
      prisma.matchSuggestion.delete({
        where: { id: suggestionId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Suggestion deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting suggestion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}