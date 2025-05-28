import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function DELETE(
  req: NextRequest, // req is not used, can be removed if not needed
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized - Invalid session" }, { status: 401 });
    }

    const suggestionId = context.params.id;

    // בדיקה שההצעה קיימת
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // ---- START OF CHANGE ----
    // הרשאות:
    // 1. אדמין יכול למחוק כל הצעה.
    // 2. שדכן יכול למחוק רק הצעה שהוא יצר.
    const userRole = session.user.role as UserRole;
    const isOwner = suggestion.matchmakerId === session.user.id;

    if (userRole === UserRole.ADMIN) {
      // Admin can delete any suggestion
    } else if (userRole === UserRole.MATCHMAKER && isOwner) {
      // Matchmaker can delete their own suggestion
    } else {
      // Any other case is forbidden
      return NextResponse.json({ error: "Forbidden - Insufficient permissions to delete this suggestion" }, { status: 403 });
    }
    // ---- END OF CHANGE ----

    // מחיקת ההצעה וכל הנתונים הקשורים אליה (ודא ש-onDelete: Cascade מוגדר בסכמה אם רלוונטי)
    // אם אין Cascade, יש למחוק רשומות קשורות ידנית קודם.
    // הסדר הנוכחי שלך נראה טוב אם אין Cascade על הכל.
    await prisma.$transaction(async (tx) => { // Changed to async for await inside
      // מחיקת היסטוריית סטטוסים
      await tx.suggestionStatusHistory.deleteMany({
        where: { suggestionId },
      });
      // מחיקת שאלות
      await tx.suggestionInquiry.deleteMany({
        where: { suggestionId },
      });
      // מחיקת פגישות (אם קיימות וקשורות ישירות)
      await tx.meeting.deleteMany({
        where: { suggestionId },
      });
      // Consider other related data like DateFeedback
      await tx.dateFeedback.deleteMany({
        where: { suggestionId },
      });

      // הסרת קשרים בטבלאות קשר רבים-לרבים (אם יש)
      // לדוגמה, אם יש קשר approvedBy, reviewedBy ב-MatchSuggestion
      await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          approvedBy: { set: [] }, // Assuming relation exists
          reviewedBy: { set: [] }, // Assuming relation exists
        }
      });
      
      // מחיקת ההצעה עצמה
      await tx.matchSuggestion.delete({
        where: { id: suggestionId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Suggestion deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting suggestion:", error);
    // Consider more specific error handling (e.g., Prisma errors)
    return NextResponse.json(
      { error: "Internal server error during suggestion deletion" },
      { status: 500 }
    );
  }
}