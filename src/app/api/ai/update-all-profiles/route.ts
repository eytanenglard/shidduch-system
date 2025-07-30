// File: src/app/api/ai/update-all-profiles/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { updateUserAiProfile } from '@/lib/services/profileAiService';

/**
 * פונקציית עזר שמריצה את תהליך העדכון ברקע
 * ומדפיסה לוג מפורט בסיומו.
 * @param userIds - מערך מזהי המשתמשים לעדכון
 * @param adminId - מזהה האדמין שהפעיל את התהליך
 */
async function runBulkUpdateAndLog(userIds: string[], adminId: string) {
  const totalUsers = userIds.length;
  // הודעת התחלה ברורה לתהליך הרקע
 
  try {
    // נשתמש ב-Promise.allSettled כדי להמתין לסיום כל העדכונים, גם אם חלקם נכשלים
    const results = await Promise.allSettled(
      userIds.map(userId => updateUserAiProfile(userId))
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = totalUsers - successCount;
    
    // איסוף מזהי המשתמשים שנכשלו (אם יש כאלה)
    const failedUserIds = results
      .map((result, index) => ({ result, userId: userIds[index] }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ userId }) => userId);

    // הדפסת סיכום מפורט
      if (failedCount > 0) {
      console.log(`  Failed User IDs: ${failedUserIds.join(', ')}`);
    }
    console.log(`======================================================================\n\n`);

  } catch (error) {
    // במקרה של שגיאה קריטית בתהליך הרקע עצמו
    console.error('[AI Bulk Update - BG] A critical error occurred in the background process:', error);
  }
}

export async function POST() {
  try {
    // 1. Authentication and Authorization (ADMIN ONLY)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Unauthorized: Admin access required." }, { status: 403 });
    }
    const adminId = session.user.id;

    // כאן הלוג המקורי נשאר, כדי שתראה שה-API הופעל
    console.log(`[AI Bulk Update] API endpoint hit by admin: ${adminId}`);

    // 2. Fetch all active user IDs that have a profile
    const usersToUpdate = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        profile: {
          isNot: null,
        },
      },
      select: {
        id: true,
      },
    });

    const userIds = usersToUpdate.map(user => user.id);
    const totalUsers = userIds.length;

    if (totalUsers === 0) {
      return NextResponse.json({ success: true, message: "No active users with profiles found to update." });
    }

    // 3. Trigger background updates without waiting for them to complete
    //    The process will run and log its final summary independently.
    runBulkUpdateAndLog(userIds, adminId).catch(err => {
        console.error(`[AI Bulk Update] Failed to kick off background logging process:`, err);
    });

    const message = `AI profile update process has been initiated for ${totalUsers} users. The process will run in the background. Check server logs for completion status.`;
    console.log(`[AI Bulk Update] Immediate API response sent. ${message}`);

    // 4. Return an immediate success response
    return NextResponse.json({ success: true, message });

  } catch (error) {
    console.error('[AI Bulk Update] A critical error occurred in the API endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: "Internal server error.", details: errorMessage }, { status: 500 });
  }
}