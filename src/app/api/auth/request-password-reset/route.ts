// src/app/api/auth/request-password-reset/route.ts

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';
import prisma from '@/lib/prisma';
import { VerificationType, UserStatus, VerificationStatus } from '@prisma/client';
import { VerificationService } from '@/lib/services/verificationService';
import { emailService } from '@/lib/email/emailService';
import { z } from 'zod';

const requestPasswordResetSchema = z.object({
  email: z.string().email({ message: "כתובת מייל לא תקינה" }),
});

type LogMetadata = {
  email?: string;
  userId?: string;
  verificationId?: string;
  error?: unknown;
  timestamp?: string;
  action?: string;
  status?: UserStatus | VerificationStatus;
  locale?: 'he' | 'en';
  isOAuthUser?: boolean;
  providers?: string | string[]; // ✅ הוספת providers ל-type
};

const logger = {
  info: (message: string, meta?: LogMetadata) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, ...meta })),
  warn: (message: string, meta?: LogMetadata) => console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', message, ...meta })),
  error: (message: string, meta?: LogMetadata) => console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message, ...meta })),
};

export async function POST(req: NextRequest) {
  const rateLimitResponse = await applyRateLimit(req, { requests: 5, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he';
  
  const action = "request-password-reset";
  let requestBody: { email?: string } | undefined;

  try {
    requestBody = await req.json();
    logger.info('Request password reset initiated', { action });

    const validation = requestPasswordResetSchema.safeParse(requestBody);
    if (!validation.success) {
      logger.warn('Invalid email format for password reset request', {
        action,
        error: validation.error.flatten().fieldErrors,
      });
      return NextResponse.json({ 
        success: false, 
        error: validation.error.flatten().fieldErrors.email?.[0] || "כתובת מייל לא תקינה" 
      }, { status: 400 });
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase();
    logger.info('Processing password reset request', { action, email: normalizedEmail, locale });

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        accounts: {
          select: {
            provider: true,
          }
        }
      }
    });

    const genericSuccessMessage = locale === 'he'
      ? 'אם קיימת כתובת מייל זו במערכת וניתן לאפס עבורה סיסמה, קוד אימות נשלח כעת.'
      : 'If an account with this email exists and is eligible for password reset, a code has been sent.';

    if (!user) {
      logger.info('User not found for password reset request', { action, email: normalizedEmail });
      return NextResponse.json({ success: true, message: genericSuccessMessage }, { status: 200 });
    }

    const finalLocale = user.language || locale;

    // בדיקה אם המשתמש נרשם דרך OAuth
    const hasOAuthAccount = user.accounts && user.accounts.length > 0;
    const isPasswordlessUser = !user.password;

    if (hasOAuthAccount && isPasswordlessUser) {
      const oauthProviders = user.accounts.map(acc => acc.provider);
      const providersText = oauthProviders.map(provider => {
        switch(provider) {
          case 'google': return 'Google';
          case 'facebook': return 'Facebook';
          default: return provider;
        }
      }).join(', ');

      logger.info('Password reset attempted for OAuth-only user', { 
        action, 
        email: normalizedEmail, 
        userId: user.id,
        isOAuthUser: true,
        providers: providersText // ✅ עכשיו זה תקין
      });

      const oauthMessage = finalLocale === 'he'
        ? `חשבון זה נרשם דרך ${providersText}. לא ניתן לאפס סיסמה - אנא היכנס באמצעות ${providersText}.`
        : `This account was registered via ${providersText}. Password reset is not available - please sign in using ${providersText}.`;

      return NextResponse.json({ 
        success: false, 
        error: oauthMessage,
        isOAuthAccount: true,
        providers: oauthProviders // שולחים את הספקים לקליינט
      }, { status: 400 });
    }

    if (!user.password) {
      logger.info('Password reset attempted for account without password', { 
        action, 
        email: normalizedEmail, 
        userId: user.id 
      });
      return NextResponse.json({ success: true, message: genericSuccessMessage }, { status: 200 });
    }
    
    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.INACTIVE) {
      logger.warn('Password reset attempted for blocked or inactive user', { 
        action, 
        email: normalizedEmail, 
        userId: user.id, 
        status: user.status 
      });
      return NextResponse.json({ success: true, message: genericSuccessMessage }, { status: 200 });
    }

    await prisma.verification.updateMany({
      where: {
        userId: user.id,
        type: VerificationType.PASSWORD_RESET,
        status: VerificationStatus.PENDING,
      },
      data: {
        status: VerificationStatus.EXPIRED,
      },
    });
    logger.info('Invalidated previous pending password reset OTPs', { action, userId: user.id });

    const expiresInMinutes = 15;
    const { otp: generatedOtp, verification: passwordResetVerification } = await VerificationService.createVerification(
      user.id,
      VerificationType.PASSWORD_RESET,
      user.email,
      expiresInMinutes / 60 
    );
    logger.info('New password reset OTP created', { action, userId: user.id, verificationId: passwordResetVerification.id });

    try {
      const expiresInText = finalLocale === 'he' ? `${expiresInMinutes} דקות` : `${expiresInMinutes} minutes`;

      await emailService.sendPasswordResetOtpEmail({
        locale: finalLocale,
        email: user.email,
        otp: generatedOtp,
        firstName: user.firstName,
        expiresIn: expiresInText,
      });
      logger.info('Password reset OTP email sent successfully', { action, userId: user.id, email: user.email });
    } catch (emailError) {
      logger.error('Failed to send password reset OTP email', {
        action,
        userId: user.id,
        email: user.email,
        error: emailError instanceof Error ? { name: emailError.name, message: emailError.message } : emailError,
      });
    }

    return NextResponse.json({ success: true, message: genericSuccessMessage }, { status: 200 });

  } catch (error: unknown) {
    const emailForLog = requestBody?.email;
    logger.error('Critical error in request password reset process', {
      action,
      email: emailForLog,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });

    const errorMessage = locale === 'he'
      ? 'אירעה שגיאה בתהליך. אנא נסה שנית מאוחר יותר.'
      : 'An error occurred. Please try again later.';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}