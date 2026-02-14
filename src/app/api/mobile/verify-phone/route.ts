// src/app/api/mobile/verify-phone/route.ts
// ==========================================
// NeshamaTech Mobile API - Verify Phone OTP
// POST /api/mobile/verify-phone
// Requires JWT auth. Verifies WhatsApp OTP.
// Activates user account on success.
// ==========================================

import { NextRequest } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';
import prisma from '@/lib/prisma';
import { UserStatus, VerificationType } from '@prisma/client';
import {
  verifyMobileToken,
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
  // Rate limit: 15 attempts per 15 minutes
  const rateLimitResponse = await applyRateLimit(req, { requests: 15, window: '15 m' });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // --- Authenticate via JWT ---
    const auth = await verifyMobileToken(req);
    if (!auth || !auth.userId) {
      return corsError(req, 'Unauthorized', 401);
    }
    const userId = auth.userId;

    const { code } = await req.json();

    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      return corsError(req, 'פורמט קוד לא תקין. הקוד צריך להכיל 6 ספרות.', 400);
    }

    // --- Find pending phone verification ---
    const verification = await prisma.verification.findFirst({
      where: {
        userId,
        type: VerificationType.PHONE_WHATSAPP,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return corsError(req, 'לא נמצא קוד אימות פעיל. אנא בקש קוד חדש.', 400);
    }

    // --- Verify code ---
    if (verification.token !== code) {
      return corsError(req, 'קוד אימות שגוי.', 400);
    }

    // --- Mark verification as used + activate user ---
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Mark verification as verified
      await tx.verification.update({
        where: { id: verification.id },
        data: { status: 'VERIFIED', verifiedAt: new Date() },
      });

      // Activate user
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          isPhoneVerified: true,
          status: UserStatus.ACTIVE,
          updatedAt: new Date(),
        },
      });

      return user;
    });

    // --- Issue fresh JWT token (with updated status) ---
    const { token, expiresAt } = createMobileToken(updatedUser);

    console.log(`[mobile/verify-phone] Phone verified, user ${userId} activated`);

    return corsJson(req, {
      success: true,
      message: 'מספר הטלפון אומת בהצלחה! החשבון פעיל.',
      user: formatUserForMobile(updatedUser),
      tokens: {
        accessToken: token,
        expiresAt,
      },
    });

  } catch (error) {
    console.error('[mobile/verify-phone] Error:', error);
    return corsError(req, 'אירעה שגיאה באימות מספר הטלפון.', 500);
  }
}
