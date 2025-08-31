// src/app/api/auth/request-password-reset/route.ts

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';
import prisma from '@/lib/prisma';
import { VerificationType, UserStatus, VerificationStatus } from '@prisma/client';
import { VerificationService } from '@/lib/services/verificationService';
import { emailService } from '@/lib/email/emailService';
import { z } from 'zod';

// Zod schema for validating the request body
const requestPasswordResetSchema = z.object({
  email: z.string().email({ message: "כתובת מייל לא תקינה" }),
});

// Helper for logging (consistent with your existing logs)
type LogMetadata = {
  email?: string;
  userId?: string;
  verificationId?: string;
  error?: unknown;
  timestamp?: string;
  action?: string;
  status?: UserStatus | VerificationStatus;
  locale?: 'he' | 'en'; // <<<<<<<<<<<< התיקון: הוספת המאפיין החסר
};

const logger = {
  info: (message: string, meta?: LogMetadata) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, ...meta })),
  warn: (message: string, meta?: LogMetadata) => console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', message, ...meta })),
  error: (message: string, meta?: LogMetadata) => console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message, ...meta })),
};

export async function POST(req: NextRequest) {
  // 1. Apply Rate Limiting (prevents email spam)
  const rateLimitResponse = await applyRateLimit(req, { requests: 5, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // 2. Get Locale from URL for translation
  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he'; // Default to Hebrew
  
  const action = "request-password-reset";
  let requestBody: { email?: string } | undefined;

  try {
    // 3. Parse and Validate Request Body
    requestBody = await req.json();
    logger.info('Request password reset initiated', { action });

    const validation = requestPasswordResetSchema.safeParse(requestBody);
    if (!validation.success) {
      logger.warn('Invalid email format for password reset request', {
        action,
        error: validation.error.flatten().fieldErrors,
      });
      return NextResponse.json({ success: false, error: validation.error.flatten().fieldErrors.email?.[0] || "כתובת מייל לא תקינה" }, { status: 400 });
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase();
    // הקריאה הזו תקינה עכשיו
    logger.info('Processing password reset request', { action, email: normalizedEmail, locale });

    // 4. Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // SECURITY: Always return a generic success message to prevent user enumeration attacks.
    const genericSuccessMessage = locale === 'he'
      ? 'אם קיימת כתובת מייל זו במערכת וניתן לאפס עבורה סיסמה, קוד אימות נשלח כעת.'
      : 'If an account with this email exists and is eligible for password reset, a code has been sent.';

    // 5. Handle cases where no email should be sent, but still return success to the client
    if (!user) {
      logger.info('User not found for password reset request', { action, email: normalizedEmail });
      return NextResponse.json({ success: true, message: genericSuccessMessage }, { status: 200 });
    }

    if (!user.password) {
      logger.info('Password reset attempted for account without a password (e.g., OAuth user)', { action, email: normalizedEmail, userId: user.id });
      return NextResponse.json({ success: true, message: genericSuccessMessage }, { status: 200 });
    }
    
    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.INACTIVE) {
        logger.warn('Password reset attempted for blocked or inactive user', { action, email: normalizedEmail, userId: user.id, status: user.status });
        return NextResponse.json({ success: true, message: genericSuccessMessage }, { status: 200 });
    }

    // 6. Invalidate previous pending password reset OTPs for this user
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

    // 7. Create a new OTP using the Verification Service
    const expiresInMinutes = 15;
    const { otp: generatedOtp, verification: passwordResetVerification } = await VerificationService.createVerification(
      user.id,
      VerificationType.PASSWORD_RESET,
      user.email,
      expiresInMinutes / 60 // Service expects hours
    );
    logger.info('New password reset OTP created', { action, userId: user.id, verificationId: passwordResetVerification.id });

    // 8. Send the password reset email using the updated Email Service
    try {
      const expiresInText = locale === 'he' ? `${expiresInMinutes} דקות` : `${expiresInMinutes} minutes`;

      await emailService.sendPasswordResetOtpEmail({
        locale,
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

    // 9. Return the generic success response
    return NextResponse.json({ success: true, message: genericSuccessMessage }, { status: 200 });

  } catch (error: unknown) {
    // 10. Handle unexpected errors
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