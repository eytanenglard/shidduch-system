import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, Prisma } from "@prisma/client";
import aiService from '@/lib/services/aiService';
import profileAiService from '@/lib/services/profileAiService';

export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

/**
 * פונקציית הרקע שמבצעת את העבודה
 */
async function runBackfillProcess(usersToUpdate: { id: string, profileId: string }[]) {
  console.log(`🚀 [Backfill AI Summary] Starting background process for ${usersToUpdate.length} users...`);
  
  let successCount = 0;
  let failCount = 0;

  for (const user of usersToUpdate) {
    try {
      // 1. יצירת הפרופיל הנרטיבי
      const narrative = await profileAiService.generateNarrativeProfile(user.id);
      
      if (!narrative) {
        console.warn(`⚠️ [Backfill] Failed to generate narrative for User ID: ${user.id}`);
        failCount++;
        continue;
      }

      // 2. שליחה ל-AI
      const summaryResult = await aiService.generateProfileSummary(narrative);

      if (!summaryResult) {
        console.warn(`⚠️ [Backfill] AI returned null for User ID: ${user.id}`);
        failCount++;
        continue;
      }

      // 3. עדכון הדאטה-בייס (עם תיקון הטיפוסים)
      await prisma.profile.update({
        where: { id: user.profileId },
        data: {
          // תיקון: המרה כפולה כדי לרצות את TypeScript ו-Prisma
          aiProfileSummary: summaryResult as unknown as Prisma.InputJsonValue
        }
      });

      console.log(`✅ [Backfill] Updated summary for User ID: ${user.id}`);
      successCount++;

      // השהייה למניעת חסימה מגוגל
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ [Backfill] Error processing User ID: ${user.id}`, error);
      failCount++;
    }
  }

  console.log(`\n🏁 [Backfill AI Summary] Process Completed.`);
  console.log(`Total: ${usersToUpdate.length} | Success: ${successCount} | Failed: ${failCount}`);
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    console.log(`[Backfill API] Searching for users...`);

    // תיקון השאילתה: במקום להסתבך עם טיפוסי Json בתוך ה-Where,
    // נשלוף את המועמדים הרלוונטיים ונסנן בקוד (JS).
    const users = await prisma.user.findMany({
      where: {
        role: 'CANDIDATE',
        isProfileComplete: true,
        profile: {
          isNot: null // מוודא שיש פרופיל
        }
      },
      select: {
        id: true,
        profile: {
          select: { 
            id: true,
            aiProfileSummary: true // שולפים את השדה כדי לבדוק אותו
          }
        }
      }
    });

    // סינון ב-JS: רק מי שאין לו aiProfileSummary (או שהוא null/ריק)
    // הטיפוסים פה בטוחים יותר מאשר בשאילתת Prisma מורכבת
    const targets = users
      .filter(u => !u.profile?.aiProfileSummary) 
      .map(u => ({ 
        id: u.id, 
        profileId: u.profile!.id // ה-! בטוח כאן כי סיננו ב-where למעלה
      }));

    if (targets.length === 0) {
      return NextResponse.json({ success: true, message: "✅ כולם מעודכנים! לא נמצאו משתמשים לעדכון." });
    }

    // הפעלת התהליך ברקע
    runBackfillProcess(targets).catch(err => {
      console.error(`[Backfill API] Critical background error:`, err);
    });

    return NextResponse.json({ 
      success: true, 
      message: `נמצאו ${targets.length} משתמשים לעדכון. התהליך התחיל ברקע.` 
    });

  } catch (error) {
    console.error('[Backfill API] Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}