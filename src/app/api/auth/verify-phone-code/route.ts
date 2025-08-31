// src/app/api/auth/verify-phone-code/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { Prisma, VerificationType, UserStatus } from '@prisma/client';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { emailService } from '@/lib/email/emailService';

// --- הגדרות ---
// מספר ניסיונות אימות מקסימלי לפני שהקוד ייכשל
const MAX_VERIFICATION_ATTEMPTS = 5;

// --- סכמת Zod לאימות גוף הבקשה ---
// מוודאת שהלקוח שולח אובייקט עם שדה 'code' תקין
const verifyCodeSchema = z.object({
  code: z.string()
    .length(6, { message: "קוד האימות חייב להכיל 6 ספרות" })
    .regex(/^\d+$/, { message: "פורמט קוד לא תקין, ספרות בלבד" }),
});


// --- לוגר פשוט לדיבאגינג ---
const logger = {
    info: (message: string, meta?: Record<string, unknown>) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, ...meta })),
    warn: (message: string, meta?: Record<string, unknown>) => console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', message, ...meta })),
    error: (message: string, meta?: Record<string, unknown>) => console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message, ...meta })),
};


// --- נקודת הקצה (Endpoint) הראשית ---
export async function POST(req: NextRequest) {
  const action = "verify-phone-code";

  try {
    // שלב 1: אימות משתמש
    // ------------------------------------
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      logger.warn("ניסיון לאימות טלפון ללא סשן פעיל", { action });
      return NextResponse.json({ error: 'Unauthorized - נדרשת התחברות' }, { status: 401 });
    }
    const userId = session.user.id;
    logger.info("תהליך אימות טלפון החל עבור משתמש", { action, userId });


    // שלב 2: קבלת שפת הממשק מהלקוח
    // ------------------------------------
    // השפה נשלחת כפרמטר ב-URL, למשל: /api/auth/verify-phone-code?locale=en
    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he'; // ברירת מחדל לעברית
    logger.info("שפת הממשק זוהתה", { action, userId, locale });


    // שלב 3: קריאת ואימות גוף הבקשה
    // ------------------------------------
    const body = await req.json();
    const validation = verifyCodeSchema.safeParse(body);

    if (!validation.success) {
      logger.warn("נתונים לא תקינים בבקשה", { action, userId, errors: validation.error.flatten() });
      return NextResponse.json({ error: 'נתונים לא תקינים', details: validation.error.flatten() }, { status: 400 });
    }
    const { code } = validation.data;


    // שלב 4: איתור בקשת האימות בבסיס הנתונים
    // ------------------------------------
    const verification = await prisma.verification.findFirst({
        where: {
            userId: userId,
            type: VerificationType.PHONE_WHATSAPP,
            status: 'PENDING',
        },
        orderBy: {
            createdAt: 'desc' // ודא שאנחנו מקבלים את הבקשה האחרונה
        }
    });

    if (!verification) {
      logger.warn("לא נמצאה בקשת אימות טלפון פעילה", { action, userId });
      return NextResponse.json({ error: 'לא נמצאה בקשת אימות פעילה או שהחשבון כבר אומת.' }, { status: 404 });
    }


    // שלב 5: בדיקת תוקף ותקינות הקוד
    // ------------------------------------
    // בדיקה 5א: האם הקוד פג תוקף?
    if (new Date() > verification.expiresAt) {
        await prisma.verification.update({
            where: { id: verification.id },
            data: { status: 'EXPIRED' }
        });
        logger.warn("ניסיון להשתמש בקוד שפג תוקפו", { action, userId, verificationId: verification.id });
        return NextResponse.json({ error: 'קוד האימות פג תוקף. אנא בקש קוד חדש.' }, { status: 410 }); // 410 Gone
    }

    // בדיקה 5ב: האם המשתמש חרג ממספר הניסיונות?
    if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) {
        await prisma.verification.update({
            where: { id: verification.id },
            data: { status: 'FAILED' }
        });
        logger.warn("חרגה ממספר ניסיונות האימות", { action, userId, verificationId: verification.id });
        return NextResponse.json({ error: 'חרגת ממספר ניסיונות האימות המותר. אנא בקש קוד חדש.' }, { status: 429 }); // 429 Too Many Requests
    }

    // בדיקה 5ג: האם הקוד שהוזן שגוי?
    if (verification.token !== code) {
        const updatedVerification = await prisma.verification.update({
            where: { id: verification.id },
            data: { attempts: { increment: 1 } }
        });
        const attemptsLeft = MAX_VERIFICATION_ATTEMPTS - updatedVerification.attempts;
        logger.warn("הוזן קוד אימות שגוי", { action, userId, attemptsLeft });
        return NextResponse.json({ error: `קוד אימות שגוי. נותרו לך ${attemptsLeft} ניסיונות.` }, { status: 400 });
    }


    // שלב 6: אימות מוצלח - עדכון בסיס הנתונים ושליחת מייל
    // ----------------------------------------------------
    // שימוש בטרנזקציה כדי להבטיח ששתי הפעולות (עדכון משתמש ועדכון אימות) יצליחו יחד או ייכשלו יחד
    const [updatedVerification, updatedUser] = await prisma.$transaction([
        // 6א: עדכון רשומת האימות לסטטוס 'COMPLETED'
        prisma.verification.update({
            where: { id: verification.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                attempts: verification.attempts + 1
             }
        }),
        // 6ב: עדכון רשומת המשתמש - הפוך אותו לפעיל!
        prisma.user.update({
            where: { id: userId },
            data: {
                isPhoneVerified: true,
                isProfileComplete: true, // לאחר אימות טלפון, הפרופיל נחשב שלם
                status: UserStatus.ACTIVE, // המשתמש הופך לפעיל
                updatedAt: new Date(),
            },
            // בחירת השדות שיוחזרו - חשוב לקבל את המייל והשם עבור שליחת המייל
            select: {
                id: true,
                email: true,
                firstName: true,
                isPhoneVerified: true,
                isProfileComplete: true,
                status: true,
             }
        })
    ]);
    
    logger.info("אימות טלפון הושלם בהצלחה, משתמש הוגדר כפעיל", { action, userId });

    // 6ג: שליחת מייל "ברוכים הבאים" - רק לאחר שהטרנזקציה הצליחה
    try {
        await emailService.sendWelcomeEmail({
            locale, // << העברת השפה הדינמית שהתקבלה מהלקוח
            email: updatedUser.email,
            firstName: updatedUser.firstName || 'חבר',
            dashboardUrl: '/profile'
        });
        logger.info("מייל ברוכים הבאים נשלח בהצלחה", { action, userId, email: updatedUser.email, locale });
    } catch (emailError) {
        // כישלון בשליחת המייל לא צריך להכשיל את כל הבקשה. המשתמש עדיין מאומת.
        // חשוב לרשום את השגיאה למעקב.
        logger.error("כשל בשליחת מייל ברוכים הבאים לאחר אימות טלפון", { action, userId, error: emailError });
    }


    // שלב 7: החזרת תשובת הצלחה ללקוח
    // ------------------------------------
    return NextResponse.json({
         success: true,
         message: 'אימות הטלפון הושלם בהצלחה!',
         user: updatedUser // החזרת פרטי המשתמש המעודכנים לעדכון הסשן בצד הלקוח
    }, { status: 200 });

  } catch (error) {
    // --- טיפול כללי בשגיאות לא צפויות ---
    const userId = (await getServerSession(authOptions))?.user?.id || 'unknown';
    logger.error("שגיאה קריטית בתהליך אימות הטלפון", { action, userId, error });

    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'נתונים לא תקינים בבקשה', details: error.flatten() }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return NextResponse.json({ error: 'שגיאת מסד נתונים בתהליך האימות' }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'אירעה שגיאה פנימית בשרת. אנא נסה שנית מאוחר יותר.' }, { status: 500 });
  }
}