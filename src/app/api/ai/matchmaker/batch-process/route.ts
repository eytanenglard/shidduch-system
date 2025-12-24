import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import profileAiService from '@/lib/services/profileAiService';
import aiService from '@/lib/services/aiService';

export const maxDuration = 60; // זמן ריצה מקסימלי (אם השרת תומך)
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. בדיקת הרשאות (שדכן או אדמין)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { action, batchSize = 5 } = await req.json();

    // ---------------------------------------------------------
    // פעולה 1: RESET_FLAGS
    // סימון כל המועמדים הפעילים כ"נדרשים לעדכון"
    // אנחנו מסמנים את כולם, הסינון האמיתי יקרה בזמן העיבוד כדי לחסוך ביצועים
    // ---------------------------------------------------------
    if (action === 'RESET_FLAGS') {
      const updateResult = await prisma.profile.updateMany({
        where: {
          user: {
            role: 'CANDIDATE',
            // מסננים רק יוזרים פעילים או בתהליך אימות (לא חסומים)
            status: { in: ['ACTIVE', 'PENDING_EMAIL_VERIFICATION', 'PENDING_PHONE_VERIFICATION'] }
          }
        },
        data: { needsAiProfileUpdate: true }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Flags reset successfully', 
        count: updateResult.count 
      });
    }

    // ---------------------------------------------------------
    // פעולה 2: PROCESS_BATCH
    // שליפה ועיבוד של קבוצת משתמשים
    // ---------------------------------------------------------
    if (action === 'PROCESS_BATCH') {
      // 1. שליפת מועמדים שצריכים עדכון
      const candidatesToProcess = await prisma.user.findMany({
        where: {
          role: 'CANDIDATE',
          status: { notIn: ['BLOCKED', 'INACTIVE'] },
          profile: {
            needsAiProfileUpdate: true
          }
        },
        take: batchSize,
        // שליפת המידע הרלוונטי לבדיקת "האם יש דאטה"
        include: {
          profile: {
            select: { id: true, about: true, needsAiProfileUpdate: true }
          },
          questionnaireResponses: {
            select: { id: true } // מספיק לדעת אם קיים ID כדי לדעת שיש שאלון
          }
        }
      });

      // בדיקה כמה נשארו סה"כ (לצורך ה-Progress Bar)
      const remainingCount = await prisma.user.count({
        where: {
          role: 'CANDIDATE',
          status: { notIn: ['BLOCKED', 'INACTIVE'] },
          profile: { needsAiProfileUpdate: true }
        }
      });

      // אם אין יותר מועמדים לעדכון - סיימנו
      if (candidatesToProcess.length === 0) {
        return NextResponse.json({ success: true, processed: 0, remaining: 0, completed: true });
      }

      console.log(`[Batch AI] Processing batch of ${candidatesToProcess.length} candidates...`);

      // 2. עיבוד במקביל
      const results = await Promise.all(
        candidatesToProcess.map(async (user) => {
          try {
            // --- שלב הסינון החכם ---
            // נבדוק האם ליוזר יש מידע רלוונטי ל-AI
            
            const hasAbout = user.profile?.about && user.profile.about.trim().length > 10; // לפחות 10 תווים
            const hasQuestionnaire = user.questionnaireResponses && user.questionnaireResponses.length > 0;

            // אם אין שום מידע - מדלגים (אבל מכבים את הדגל כדי לא לחזור אליו)
            if (!hasAbout && !hasQuestionnaire) {
              await prisma.profile.update({
                where: { userId: user.id },
                data: { needsAiProfileUpdate: false }
              });
              return { id: user.id, status: 'skipped_no_data' };
            }

            // --- יש מידע? ממשיכים ל-AI ---

            // 1. יצירת פרופיל נרטיבי (הפונקציה הזו כבר יודעת לקחת שאלונים ו-about)
            const narrative = await profileAiService.generateNarrativeProfile(user.id);
            
            // הגנה נוספת למקרה שהנרטיב יצא ריק למרות הבדיקה
            if (!narrative || narrative.length < 20) {
                await prisma.profile.update({
                    where: { userId: user.id },
                    data: { needsAiProfileUpdate: false }
                });
                return { id: user.id, status: 'skipped_empty_narrative' };
            }

            // 2. יצירת הדוח ב-AI
            const summary = await aiService.generateProfileSummary(narrative);
            
            if (!summary) throw new Error("AI Summary failed");

            // 3. שמירה בדאטה בייס וכיבוי הדגל
            await prisma.profile.update({
              where: { userId: user.id },
              data: {
                aiProfileSummary: summary as any, // המרת JSON לפורמט של פריזמה
                needsAiProfileUpdate: false,
                // אופציונלי: עדכון מונה הפעמים שהופק דוח (אם הוספת את השדה מהמודל)
                // neshamaInsightGeneratedCount: { increment: 1 },
                // neshamaInsightLastGeneratedAt: new Date()
              }
            });

            return { id: user.id, status: 'success' };

          } catch (error) {
            console.error(`[Batch AI] Failed for user ${user.id}:`, error);
            // במקרה שגיאה טכנית ב-AI, נכבה את הדגל כדי לא לתקוע את התהליך הכללי
            await prisma.profile.update({
                where: { userId: user.id },
                data: { needsAiProfileUpdate: false }
            });
            return { id: user.id, status: 'error' };
          }
        })
      );

      const successful = results.filter(r => r.status === 'success').length;
      const skipped = results.filter(r => r.status.startsWith('skipped')).length;

      return NextResponse.json({
        success: true,
        processed: candidatesToProcess.length, // סך הכל שעברו בבאץ'
        successful, // כמה נוצרו בפועל
        skipped,    // כמה דולגו כי היו ריקים
        remaining: Math.max(0, remainingCount - candidatesToProcess.length),
        completed: (remainingCount - candidatesToProcess.length) <= 0
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error('[Batch Process] Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}