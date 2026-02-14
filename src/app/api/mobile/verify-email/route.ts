// src/app/api/mobile/verify-email/route.ts
// ==========================================
// NeshamaTech Mobile API - Verify Email OTP
// POST /api/mobile/verify-email
// Returns JWT token on success (logs user in)
// ==========================================

import { NextRequest } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';
import { VerificationService } from '@/lib/services/verificationService';
import { VerificationType } from '@prisma/client';
import prisma from '@/lib/prisma';
import {
  createMobileToken,
  formatUserForMobile,
  corsJson,
  corsError,
  corsOptions
} from "@/lib/mobile-auth";

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  // Rate limit: 15 attempts per 15 minutes (prevents brute-force)
  const rateLimitResponse = await applyRateLimit(req, { requests: 15, window: '15 m' });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return corsError(req, 'חסרים פרטי אימייל או קוד.', 400);
    }

    // Validate OTP format
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return corsError(req, 'פורמט קוד לא תקין. הקוד צריך להכיל 6 ספרות.', 400);
    }

    // Verify the code using existing VerificationService
    const verificationResult = await VerificationService.verifyCode(
      code,
      VerificationType.EMAIL,
      email.toLowerCase()
    );

    if (!verificationResult.userId) {
      return corsError(req, 'שגיאה פנימית: לא נמצא משתמש משויך לאימות.', 500);
    }

    const userId = verificationResult.userId;

    // Get the full user record
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return corsError(req, 'המשתמש לא נמצא.', 404);
    }

    // Create JWT token for mobile session
    const { token, expiresAt } = createMobileToken(user);

    console.log(`[mobile/verify-email] Email verified for user ${user.email}, JWT issued`);

    return corsJson(req, {
      success: true,
      message: 'כתובת האימייל אומתה בהצלחה!',
      user: formatUserForMobile(user),
      tokens: {
        accessToken: token,
        expiresAt,
      },
    });

  } catch (error: unknown) {
    console.error('[mobile/verify-email] Verification failed:', error);

    if (error instanceof Error) {
      const knownErrors = [
        'הקוד כבר נוצל.',
        'תוקף הקוד פג. אנא בקש קוד חדש.',
        'קוד אימות לא תקין או שלא קיימת בקשת אימות פעילה.',
        'קוד אימות שגוי.',
      ];
      if (knownErrors.includes(error.message)) {
        return corsError(req, error.message, 400);
      }
    }

    return corsError(req, 'אירעה שגיאה באימות הקוד.', 500);
  }
}
