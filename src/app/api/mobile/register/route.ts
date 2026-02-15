// src/app/api/mobile/register/route.ts
// ==========================================
// NeshamaTech Mobile API - Email Registration
// POST /api/mobile/register
// ==========================================

import { NextRequest } from "next/server";
import { UserRole, UserStatus, Prisma, VerificationType, UserSource, Gender } from '@prisma/client';
import { hash } from 'bcryptjs';
import { emailService } from '@/lib/email/emailService';
import { VerificationService } from '@/lib/services/verificationService';
import { applyRateLimit } from '@/lib/rate-limiter';
import prisma from '@/lib/prisma';
import { corsJson, corsError, corsOptions } from "@/lib/mobile-auth";

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  // Rate limit: 10 registrations per IP per hour
  const rateLimitResponse = await applyRateLimit(req, { requests: 10, window: '1 h' });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const { email, password, firstName, lastName, language = 'he' } = body;

    // --- Validation ---
    if (!email || !password || !firstName || !lastName) {
      return corsError(req, 'חסרים פרטים חובה (אימייל, סיסמה, שם פרטי, שם משפחה).', 400);
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return corsError(req, 'כתובת אימייל לא תקינה.', 400);
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return corsError(req, 'הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר.', 400);
    }

    const normalizedEmail = email.toLowerCase();

    // --- Check if user already exists ---
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return corsJson(req, {
        success: false,
        error: 'משתמש עם כתובת אימייל זו כבר קיים במערכת.',
        errorCode: 'EMAIL_EXISTS',
      }, { status: 409 });
    }

    // --- Hash password ---
    const hashedPassword = await hash(password, 12);

    // --- Create user + skeleton profile in transaction ---
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          firstName,
          lastName,
          language: language === 'en' ? 'en' : 'he',
          role: UserRole.CANDIDATE,
          status: UserStatus.PENDING_EMAIL_VERIFICATION,
          isVerified: false,
          isProfileComplete: false,
          isPhoneVerified: false,
          source: UserSource.REGISTRATION,
          termsAndPrivacyAcceptedAt: new Date(),
          engagementEmailsConsent: false,
          promotionalEmailsConsent: false,
          profile: {
            create: {
              availabilityStatus: 'AVAILABLE',
              isProfileVisible: false,
              gender: Gender.FEMALE, // ערך זמני - יוחלף ע"י המשתמש
              birthDate: new Date('2000-01-01T00:00:00.000Z'), // ערך זמני
              birthDateIsApproximate: true,
            }
          }
        },
      });

      // Create email verification OTP
      const { verification, otp } = await VerificationService.createVerification(
        user.id,
        VerificationType.EMAIL,
        user.email,
        1, // 1 hour expiry
        tx
      );

      return { user, otp };
    });

    // --- Send verification email (non-blocking error) ---
    const locale = language === 'en' ? 'en' : 'he';
    let emailSent = false;
    try {
      await emailService.sendVerificationEmail({
        locale,
        email: result.user.email,
        verificationCode: result.otp,
        firstName: result.user.firstName,
        expiresIn: locale === 'he' ? 'שעה אחת' : '1 hour',
      });
      emailSent = true;
    } catch (emailError) {
      console.error('[mobile/register] Failed to send verification email:', emailError);
    }

    console.log(`[mobile/register] User ${result.user.email} registered successfully`);

    return corsJson(req, {
      success: true,
      message: emailSent
        ? 'החשבון נוצר בהצלחה. נשלח קוד אימות לאימייל שלך.'
        : 'החשבון נוצר בהצלחה. הייתה בעיה בשליחת קוד האימות - תוכל לבקש קוד חדש.',
      userId: result.user.id,
      email: result.user.email,
      emailSent,
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('[mobile/register] Registration failed:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes('email')) {
          return corsJson(req, {
            success: false,
            error: 'משתמש עם כתובת אימייל זו כבר קיים במערכת.',
            errorCode: 'EMAIL_EXISTS',
          }, { status: 409 });
        }
      }
      if (['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code)) {
        return corsError(req, 'שגיאת חיבור לשרת. אנא נסה שנית.', 503);
      }
    }

    if (error instanceof Error) {
      // Known validation errors
      const validationErrors = [
        'חסרים פרטים חובה',
        'כתובת אימייל לא תקינה',
        'הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר',
      ];
      if (validationErrors.includes(error.message)) {
        return corsError(req, error.message, 400);
      }
    }

    return corsError(req, 'אירעה שגיאה בלתי צפויה. אנא נסה שנית.', 500);
  }
}