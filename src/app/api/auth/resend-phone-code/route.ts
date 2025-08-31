// app/api/auth/resend-phone-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateOtp, sendOtpViaWhatsApp } from '@/lib/phoneVerificationService';
import { VerificationType, VerificationStatus } from '@prisma/client';

// --- הגדרות ---
const RESEND_RATE_LIMIT_SECONDS = 60; // זמן המתנה בשניות בין בקשות חוזרות

// --- לוגר לעזרה בדיבאגינג ---
const logger = {
    info: (message: string, meta?: Record<string, unknown>) => {
      console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, ...meta }));
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', message, ...meta }));
    },
    error: (message: string, meta?: any) => {
      let logMeta = meta || {};
      if (meta instanceof Error) {
          logMeta = { name: meta.name, message: meta.message, stack: meta.stack };
      }
      console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message, ...logMeta }));
    },
};

// --- פונקציית ה-API הראשית ---
export async function POST(req: NextRequest) {
    const rateLimitResponse = await applyRateLimit(req, { requests: 5, window: '1 h' });
    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    logger.info("Resend phone code request received");

    // 1. --- בדיקת אימות משתמש ---
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        logger.warn("Unauthorized attempt to resend code");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    logger.info("User authenticated", { userId });

    try {
        // ============================ התיקון המרכזי (1 מתוך 2) ============================
        // 2. --- קריאת השפה (locale) מפרמטר ה-URL ---
        const url = new URL(req.url);
        // הגדרת עברית כשפת ברירת מחדל אם הפרמטר לא קיים
        const locale = (url.searchParams.get('locale') || 'he') as 'he' | 'en';
        logger.info("Processing request with locale", { userId, locale });
        // =================================================================================

        // 3. --- איתור בקשת האימות האחרונה של המשתמש ---
        const lastVerification = await prisma.verification.findFirst({
            where: {
                userId: userId,
                type: VerificationType.PHONE_WHATSAPP,
                status: 'PENDING',
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!lastVerification) {
            logger.warn("No pending verification found to resend", { userId });
            return NextResponse.json({ error: 'לא נמצאה בקשת אימות פעילה. ייתכן שכבר אימתת את מספרך או שהקוד פג תוקף.' }, { status: 404 });
        }
        logger.info("Found pending verification record", { userId, verificationId: lastVerification.id });

        // 4. --- בדיקת הגבלת קצב (Rate Limiting) ---
        const now = new Date();
        const timeSinceLastAttempt = now.getTime() - lastVerification.createdAt.getTime();

        if (timeSinceLastAttempt < RESEND_RATE_LIMIT_SECONDS * 1000) {
            const timeLeft = Math.ceil((RESEND_RATE_LIMIT_SECONDS * 1000 - timeSinceLastAttempt) / 1000);
            logger.warn("Resend rate limit hit", { userId, timeLeft });
            return NextResponse.json({ error: `אנא המתן ${timeLeft} שניות לפני בקשת קוד חדש.` }, { status: 429 });
        }
        logger.info("Rate limit check passed", { userId });

        // 5. --- קביעת מספר הטלפון והשם ---
        let targetPhone = lastVerification.target;
        let userFirstName = session.user.firstName || '';

        // במקרה שמספר הטלפון לא נשמר ברשומת האימות, נשלוף אותו מהמשתמש
        if (!targetPhone) {
             logger.warn(`Target phone missing in verification record ${lastVerification.id}. Fetching from user ${userId}.`);
             const user = await prisma.user.findUnique({
                 where: { id: userId },
                 select: { phone: true, firstName: true }
             });
             if (!user?.phone) {
                logger.error(`Cannot find phone number for user ${userId} in fallback during resend.`);
                return NextResponse.json({ error: 'שגיאה: לא ניתן לאתר את מספר הטלפון לשליחת הקוד.' }, { status: 500 });
             }
             targetPhone = user.phone;
             userFirstName = user.firstName || '';
        }
        
        // 6. --- יצירת קוד חדש ותאריך תפוגה חדש ---
        const newOtpCode = generateOtp();
        const newOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // תוקף ל-10 דקות
        logger.info("Generated new OTP", { userId });

        // 7. --- עדכון רשומת האימות במסד הנתונים ---
        await prisma.verification.update({
            where: { id: lastVerification.id },
            data: {
                token: newOtpCode,
                expiresAt: newOtpExpiresAt,
                attempts: 0, // איפוס מונה הניסיונות
                createdAt: new Date() // עדכון חותמת הזמן לבדיקת ה-rate limit הבאה
            }
        });
        logger.info(`Updated verification record ${lastVerification.id} with new OTP`, { userId });

        // ============================ התיקון המרכזי (2 מתוך 2) ============================
        // 8. --- שליחת הקוד החדש, תוך העברת השפה (locale) לשירות השליחה ---
        // הערה: יש לוודא שהפונקציה `sendOtpViaWhatsApp` אכן מקבלת פרמטר רביעי של שפה
        logger.info("Attempting to send new OTP via WhatsApp", { userId, phone: targetPhone, locale });
        const otpSent = await sendOtpViaWhatsApp(
            targetPhone,
            newOtpCode,
            userFirstName,
        );
        // =================================================================================

        if (!otpSent) {
            logger.error(`Failed to resend OTP via WhatsApp for user ${userId}.`, { userId, phone: targetPhone });
            return NextResponse.json({ error: 'שליחת קוד האימות החדש באמצעות WhatsApp נכשלה. אנא נסה שוב בעוד מספר רגעים.' }, { status: 500 });
        }

        // 9. --- החזרת תשובת הצלחה ---
        logger.info("New OTP resent successfully via WhatsApp", { userId });
        return NextResponse.json({ message: 'קוד אימות חדש נשלח בהצלחה באמצעות WhatsApp.' }, { status: 200 });

    } catch (error: unknown) {
        logger.error("An error occurred during the resend code process", {
            userId: session?.user?.id,
            error: error
        });
        return NextResponse.json({ error: 'אירעה שגיאה פנימית בשרת. נסה שוב מאוחר יותר.' }, { status: 500 });
    }
}