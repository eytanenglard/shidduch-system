// src/app/api/auth/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';
import prisma from '@/lib/prisma';
import { VerificationType } from '@prisma/client';
import { VerificationService } from '@/lib/services/verificationService';
import { emailService } from '@/lib/email/emailService';
import { hash } from 'bcryptjs';
import { z } from 'zod';

// Zod schema for validating the request body with detailed messages
const resetPasswordSchema = z.object({
  email: z.string().email({ message: "כתובת מייל לא תקינה" }),
  otp: z.string()
    .length(6, { message: "קוד האימות חייב להכיל 6 ספרות" })
    .regex(/^\d+$/, { message: "קוד אימות יכול להכיל ספרות בלבד" }),
  newPassword: z.string()
    .min(8, { message: "הסיסמה חייבת להכיל לפחות 8 תווים" })
    .regex(/[a-z]/, { message: "הסיסמה חייבת להכיל לפחות אות קטנה אחת באנגלית" })
    .regex(/[A-Z]/, { message: "הסיסמה חייבת להכיל לפחות אות גדולה אחת באנגלית" })
    .regex(/[0-9]/, { message: "הסיסמה חייבת להכיל לפחות ספרה אחת" }),
});

// Helper for consistent logging
type LogMetadata = {
  email?: string;
  userId?: string;
  verificationId?: string;
  error?: unknown;
  timestamp?: string;
  action?: string;
  locale?: 'he' | 'en';
};

const logger = {
  info: (message: string, meta?: LogMetadata) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, ...meta })),
  warn: (message: string, meta?: LogMetadata) => console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', message, ...meta })),
  error: (message: string, meta?: LogMetadata) => console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message, ...meta })),
};

export async function POST(req: NextRequest) {
  const action = "reset-password-with-otp";
  let requestBody: { email?: string } | undefined;

  try {
    // 1. Apply Rate Limiting (prevents brute-force attacks on OTP)
    const rateLimitResponse = await applyRateLimit(req, { requests: 10, window: '15 m' });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Get Locale from URL for translation
    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he'; // Default to Hebrew

    // 3. Parse and Validate Request Body
    requestBody = await req.json();
    logger.info('Reset password with OTP process initiated', { action, locale });

    const validation = resetPasswordSchema.safeParse(requestBody);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      let errorMessage = "נתונים לא תקינים.";
      if (errors.email?.[0]) errorMessage = errors.email[0];
      else if (errors.otp?.[0]) errorMessage = errors.otp[0];
      else if (errors.newPassword?.[0]) errorMessage = errors.newPassword[0];

      logger.warn('Invalid input for password reset', { action, error: errors });
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    const { email, otp, newPassword } = validation.data;
    const normalizedEmail = email.toLowerCase();

    // 4. Verify the OTP using the centralized VerificationService
    logger.info('Attempting to verify OTP for password reset', { action, email: normalizedEmail });
    
    // This service will throw an error if the OTP is invalid, expired, or has too many attempts.
    const verificationResult = await VerificationService.verifyCode(
      otp,
      VerificationType.PASSWORD_RESET,
      normalizedEmail
    );

    // Ensure the result from the service contains the necessary data
    if (!verificationResult.success || !verificationResult.userId || !verificationResult.id) {
      logger.error('OTP verification failed unexpectedly or did not return required data', {
        action,
        email: normalizedEmail,
        error: verificationResult.message,
      });
      throw new Error(verificationResult.message || 'שגיאה באימות הקוד.');
    }

    const { userId, id: verificationId } = verificationResult;
    logger.info('OTP verified successfully', { action, userId, verificationId });

    // 5. Hash the new password
    const hashedPassword = await hash(newPassword, 12);
    logger.info('New password hashed', { action, userId });

    // 6. Update user's password and mark OTP as used
    // These are done sequentially. If marking as completed fails, it's not critical as the token will expire.
    
    // Update the user's password
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
      select: { email: true, firstName: true } // Select data needed for confirmation email
    });
    logger.info('User password updated in database', { action, userId });

    // Mark the verification record as COMPLETED
    await VerificationService.completeVerification(verificationId);
    logger.info('Verification record marked as completed', { action, verificationId });

    // 7. Send password change confirmation email (non-critical step)
    if (user) {
      try {
        // *** CRITICAL FIX: Pass the locale to the email service ***
        await emailService.sendPasswordChangedConfirmationEmail({
          locale, // Pass the determined locale
          email: user.email,
          firstName: user.firstName,
        });
        logger.info('Password change confirmation email sent', { action, userId, locale });
      } catch (emailError) {
        // Log the error but do not fail the request, as the password has been successfully changed.
        logger.error('Failed to send password change confirmation email', {
          action,
          userId,
          error: emailError instanceof Error ? { name: emailError.name, message: emailError.message } : emailError,
        });
      }
    }

    // 8. Return success response
    const successMessage = locale === 'he'
      ? 'הסיסמה אופסה בהצלחה. כעת תוכל להתחבר עם הסיסמה החדשה.'
      : 'Password has been reset successfully. You can now log in with your new password.';
      
    return NextResponse.json({ success: true, message: successMessage }, { status: 200 });

  } catch (error: unknown) {
    // 9. Handle all errors gracefully
    const emailForLog = requestBody?.email;
    logger.error('Critical error in reset password with OTP process', {
      action,
      email: emailForLog,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });

    let errorMessage = 'אירעה שגיאה באיפוס הסיסמה.';
    let errorStatus = 500;

    // Map specific known errors from VerificationService to user-friendly messages and statuses
    if (error instanceof Error) {
      const knownClientErrors = [
        'הקוד כבר נוצל.',
        'תוקף הקוד פג. אנא בקש קוד חדש.',
        'קוד אימות לא תקין או שלא קיימת בקשת אימות פעילה.',
        'קוד אימות שגוי.',
        'חרגת ממספר ניסיונות האימות המותר. אנא בקש קוד חדש.',
      ];
      if (knownClientErrors.includes(error.message)) {
        errorMessage = error.message;
        errorStatus = 400; // Bad Request
        if (error.message.includes("פג תוקפו")) errorStatus = 410; // Gone
        if (error.message.includes("חרגת ממספר ניסיונות")) errorStatus = 429; // Too Many Requests
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: errorStatus }
    );
  }
}