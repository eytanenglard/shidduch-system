// src/app/api/auth/verify-phone-code/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { Prisma, VerificationType, UserStatus } from '@prisma/client';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { emailService } from '@/lib/email/emailService';

const MAX_VERIFICATION_ATTEMPTS = 5;

const verifyCodeSchema = z.object({
  code: z.string()
    .length(6, { message: "קוד האימות חייב להכיל 6 ספרות" })
    .regex(/^\d+$/, { message: "פורמט קוד לא תקין, ספרות בלבד" }),
});

const logger = {
    info: (message: string, meta?: Record<string, unknown>) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, ...meta })),
    warn: (message: string, meta?: Record<string, unknown>) => console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', message, ...meta })),
    error: (message: string, meta?: Record<string, unknown>) => console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message, ...meta })),
};

export async function POST(req: NextRequest) {
  const action = "verify-phone-code";

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      logger.warn("ניסיון לאימות טלפון ללא סשן פעיל", { action });
      return NextResponse.json({ error: 'Unauthorized - נדרשת התחברות' }, { status: 401 });
    }
    const userId = session.user.id;
    logger.info("תהליך אימות טלפון החל עבור משתמש", { action, userId });

    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he';
    logger.info("שפת הממשק זוהתה", { action, userId, locale });

    const body = await req.json();
    const validation = verifyCodeSchema.safeParse(body);

    if (!validation.success) {
      logger.warn("נתונים לא תקינים בבקשה", { action, userId, errors: validation.error.flatten() });
      return NextResponse.json({ error: 'נתונים לא תקינים', details: validation.error.flatten() }, { status: 400 });
    }
    const { code } = validation.data;

    const verification = await prisma.verification.findFirst({
        where: {
            userId: userId,
            type: VerificationType.PHONE_WHATSAPP,
            status: 'PENDING',
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    if (!verification) {
      logger.warn("לא נמצאה בקשת אימות טלפון פעילה", { action, userId });
      return NextResponse.json({ error: 'לא נמצאה בקשת אימות פעילה או שהחשבון כבר אומת.' }, { status: 404 });
    }

    if (new Date() > verification.expiresAt) {
        await prisma.verification.update({
            where: { id: verification.id },
            data: { status: 'EXPIRED' }
        });
        logger.warn("ניסיון להשתמש בקוד שפג תוקפו", { action, userId, verificationId: verification.id });
        return NextResponse.json({ error: 'קוד האימות פג תוקף. אנא בקש קוד חדש.' }, { status: 410 });
    }

    if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) {
        await prisma.verification.update({
            where: { id: verification.id },
            data: { status: 'FAILED' }
        });
        logger.warn("חרגה ממספר ניסיונות האימות", { action, userId, verificationId: verification.id });
        return NextResponse.json({ error: 'חרגת ממספר ניסיונות האימות המותר. אנא בקש קוד חדש.' }, { status: 429 });
    }

    if (verification.token !== code) {
        const updatedVerification = await prisma.verification.update({
            where: { id: verification.id },
            data: { attempts: { increment: 1 } }
        });
        const attemptsLeft = MAX_VERIFICATION_ATTEMPTS - updatedVerification.attempts;
        logger.warn("הוזן קוד אימות שגוי", { action, userId, attemptsLeft });
        return NextResponse.json({ error: `קוד אימות שגוי. נותרו לך ${attemptsLeft} ניסיונות.` }, { status: 400 });
    }

    const [updatedVerification, updatedUser] = await prisma.$transaction([
        prisma.verification.update({
            where: { id: verification.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                attempts: verification.attempts + 1
             }
        }),
        prisma.user.update({
            where: { id: userId },
            data: {
                isPhoneVerified: true,
                isProfileComplete: true,
                status: UserStatus.ACTIVE,
                updatedAt: new Date(),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                language: true, 
                isPhoneVerified: true,
                isProfileComplete: true,
                status: true,
             }
        })
    ]);
    
    logger.info("אימות טלפון הושלם בהצלחה, משתמש הוגדר כפעיל", { action, userId });

    try {
        await emailService.sendWelcomeEmail({
            locale: updatedUser.language || locale,
            email: updatedUser.email,
            firstName: updatedUser.firstName || 'חבר',
            dashboardUrl: '/profile'
        });
        logger.info("מייל ברוכים הבאים נשלח בהצלחה", { action, userId, email: updatedUser.email, locale: updatedUser.language || locale });
    } catch (emailError) {
        logger.error("כשל בשליחת מייל ברוכים הבאים לאחר אימות טלפון", { action, userId, error: emailError });
    }

    return NextResponse.json({
         success: true,
         message: 'אימות הטלפון הושלם בהצלחה!',
         user: updatedUser
    }, { status: 200 });

  } catch (error) {
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