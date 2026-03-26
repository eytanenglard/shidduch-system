// src/app/api/mobile/auth/reset-password/route.ts
import { NextRequest } from 'next/server';
import { corsJson, corsError, corsOptions } from '@/lib/mobile-auth';
import { applyRateLimit } from '@/lib/rate-limiter';
import prisma from '@/lib/prisma';
import { VerificationType } from '@prisma/client';
import { VerificationService } from '@/lib/services/verificationService';
import { emailService } from '@/lib/email/emailService';
import { hash } from 'bcryptjs';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d+$/),
  newPassword: z.string()
    .min(8)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await applyRateLimit(req, { requests: 10, window: '15 m' });
    if (rateLimitResponse) {
      return corsError(req, 'Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
    }

    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he';

    const body = await req.json();
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      let msg = 'Invalid input';
      if (errors.email?.[0]) msg = 'Invalid email';
      else if (errors.otp?.[0]) msg = 'OTP must be 6 digits';
      else if (errors.newPassword?.[0]) msg = 'Password must be at least 8 characters with uppercase, lowercase and number';
      return corsError(req, msg, 400, 'VALIDATION_ERROR');
    }

    const { email, otp, newPassword } = validation.data;
    const normalizedEmail = email.toLowerCase();

    const verificationResult = await VerificationService.verifyCode(
      otp,
      VerificationType.PASSWORD_RESET,
      normalizedEmail,
    );

    if (!verificationResult.success || !verificationResult.userId || !verificationResult.id) {
      return corsError(
        req,
        verificationResult.message || 'Code verification failed',
        400,
        'VERIFICATION_FAILED',
      );
    }

    const { userId, id: verificationId } = verificationResult;
    const hashedPassword = await hash(newPassword, 12);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      },
      select: { email: true, firstName: true, language: true },
    });

    await VerificationService.completeVerification(verificationId);

    // Send confirmation email (best-effort)
    try {
      await emailService.sendPasswordChangedConfirmationEmail({
        locale: user.language || locale,
        email: user.email,
        firstName: user.firstName,
      });
    } catch { /* ignore email errors */ }

    const msg = (user.language || locale) === 'he'
      ? 'הסיסמה אופסה בהצלחה.'
      : 'Password has been reset successfully.';

    return corsJson(req, { success: true, message: msg });
  } catch (error) {
    console.error('[mobile/reset-password] Error:', error);

    let msg = 'An error occurred';
    let code = 'INTERNAL_ERROR';
    let status = 500;

    if (error instanceof Error) {
      const knownErrors: Record<string, { code: string; status: number }> = {
        'תוקף הקוד פג. אנא בקש קוד חדש.': { code: 'OTP_EXPIRED', status: 410 },
        'חרגת ממספר ניסיונות האימות המותר. אנא בקש קוד חדש.': { code: 'MAX_ATTEMPTS', status: 429 },
        'קוד אימות לא תקין או שלא קיימת בקשת אימות פעילה.': { code: 'INVALID_OTP', status: 400 },
        'קוד אימות שגוי.': { code: 'WRONG_OTP', status: 400 },
        'הקוד כבר נוצל.': { code: 'OTP_USED', status: 400 },
      };

      const match = knownErrors[error.message];
      if (match) {
        msg = error.message;
        code = match.code;
        status = match.status;
      }
    }

    return corsError(req, msg, status, code);
  }
}
