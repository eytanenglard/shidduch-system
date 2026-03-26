// src/app/api/mobile/auth/request-password-reset/route.ts
import { NextRequest } from 'next/server';
import { corsJson, corsError, corsOptions } from '@/lib/mobile-auth';
import { applyRateLimit } from '@/lib/rate-limiter';
import prisma from '@/lib/prisma';
import { VerificationType, UserStatus, VerificationStatus } from '@prisma/client';
import { VerificationService } from '@/lib/services/verificationService';
import { emailService } from '@/lib/email/emailService';
import { z } from 'zod';

const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await applyRateLimit(req, { requests: 5, window: '1 h' });
    if (rateLimitResponse) {
      return corsError(req, 'Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
    }

    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he';

    const body = await req.json();
    const validation = requestPasswordResetSchema.safeParse(body);
    if (!validation.success) {
      return corsError(req, 'Invalid email address', 400, 'VALIDATION_ERROR');
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase();

    const genericMessage = locale === 'he'
      ? 'אם קיימת כתובת מייל זו במערכת, קוד אימות נשלח כעת.'
      : 'If an account with this email exists, a code has been sent.';

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { accounts: { select: { provider: true } } },
    });

    if (!user) {
      return corsJson(req, { success: true, message: genericMessage });
    }

    const finalLocale = user.language || locale;

    // OAuth-only check
    const hasOAuth = user.accounts && user.accounts.length > 0;
    if (hasOAuth && !user.password) {
      const providers = user.accounts.map(a => a.provider);
      return corsError(
        req,
        locale === 'he'
          ? `חשבון זה נרשם דרך ${providers.join(', ')}. אנא היכנס באמצעות הספק המקורי.`
          : `This account was registered via ${providers.join(', ')}. Please sign in using that provider.`,
        400,
        'OAUTH_ACCOUNT'
      );
    }

    if (!user.password) {
      return corsJson(req, { success: true, message: genericMessage });
    }

    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.INACTIVE) {
      return corsJson(req, { success: true, message: genericMessage });
    }

    // Account lockout check
    const recentFailed = await prisma.verification.count({
      where: {
        userId: user.id,
        type: VerificationType.PASSWORD_RESET,
        status: { in: ['FAILED', 'EXPIRED'] },
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
    });

    if (recentFailed >= 5) {
      return corsJson(req, { success: true, message: genericMessage });
    }

    // Invalidate previous OTPs
    await prisma.verification.updateMany({
      where: {
        userId: user.id,
        type: VerificationType.PASSWORD_RESET,
        status: VerificationStatus.PENDING,
      },
      data: { status: VerificationStatus.EXPIRED },
    });

    const expiresInMinutes = 15;
    const { otp, verification } = await VerificationService.createVerification(
      user.id,
      VerificationType.PASSWORD_RESET,
      user.email,
      expiresInMinutes / 60,
    );

    try {
      await emailService.sendPasswordResetOtpEmail({
        locale: finalLocale,
        email: user.email,
        otp,
        firstName: user.firstName,
        expiresIn: finalLocale === 'he' ? `${expiresInMinutes} דקות` : `${expiresInMinutes} minutes`,
      });
    } catch (emailError) {
      console.error('[mobile/request-password-reset] Failed to send email:', emailError);
    }

    return corsJson(req, { success: true, message: genericMessage });
  } catch (error) {
    console.error('[mobile/request-password-reset] Error:', error);
    return corsError(req, 'An error occurred', 500, 'INTERNAL_ERROR');
  }
}
