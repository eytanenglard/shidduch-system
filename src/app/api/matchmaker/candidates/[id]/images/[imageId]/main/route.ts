import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * מטפל בבקשת PATCH לעדכון תמונה ראשית עבור מועמד.
 * הנתיב: /api/matchmaker/candidates/[id]/images/[imageId]/main
 * [id] - מזהה המועמד (candidate)
 * [imageId] - מזהה התמונה להגדרה כתמונה ראשית
 */
export async function PATCH(
  req: NextRequest,
  // התיקון: הגדרת הטיפוס הנכון עבור הארגומנט השני.
  // Next.js מעביר את הפרמטרים הדינמיים מהנתיב בתוך אובייקט `params`.
  context: { params: { id: string; imageId: string } }
) {
  try {
    // 1. אימות משתמש מחובר
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. בדיקת הרשאות (שדכן או מנהל)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Matchmaker or Admin access required" },
        { status: 403 }
      );
    }
    
    // 3. חילוץ המזהים מהפרמטרים של הנתיב
    const { id, imageId } = context.params;

    // 4. וידוא שהמועמד קיים
    const candidate = await prisma.user.findUnique({
      where: { id },
      select: { id: true } // בחירת שדה אחד בלבד לצורך בדיקת קיום
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    // 5. וידוא שהתמונה קיימת ושייכת למועמד
    const imageToSetMain = await prisma.userImage.findFirst({
      where: {
        id: imageId,
        userId: id
      }
    });

    if (!imageToSetMain) {
      return NextResponse.json(
        { success: false, error: "Image not found" },
        { status: 404 }
      );
    }

    // 6. ביצוע העדכון בטרנזקציה כדי להבטיח אטומיות
    await prisma.$transaction([
      // שלב א': הסרת סימון 'תמונה ראשית' מכל התמונות האחרות של המועמד
      prisma.userImage.updateMany({
        where: { 
            userId: id,
            id: { not: imageId } // כל התמונות שאינן התמונה הנוכחית
        },
        data: { isMain: false }
      }),
      
      // שלב ב': הגדרת התמונה הנבחרת כתמונה ראשית
      prisma.userImage.update({
        where: { id: imageId },
        data: { isMain: true }
      })
    ]);

    // 7. עדכון חותמת הזמן 'פעילות אחרונה' בפרופיל המועמד
    await prisma.profile.update({
      where: { userId: id },
      data: { lastActive: new Date() }
    });

    // 8. החזרת תגובת הצלחה
    return NextResponse.json({
      success: true,
      message: "Main image updated successfully"
    });

  } catch (error) {
    // טיפול בשגיאות לא צפויות
    console.error("Error setting main image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to set main image" },
      { status: 500 }
    );
  }
}