// src/app/api/mobile/send-phone-code/route.ts
// ==========================================
// NeshamaTech Mobile API - Send Phone Verification Code
// POST /api/mobile/send-phone-code
// Requires JWT auth. Sends OTP via WhatsApp.
// ==========================================

import { NextRequest } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';
import prisma from '@/lib/prisma';
import { VerificationType } from '@prisma/client';
import { generateOtp, sendOtpViaWhatsApp } from '@/lib/phoneVerificationService';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions
} from "@/lib/mobile-auth";

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 requests per hour (costly WhatsApp messages)
  const rateLimitResponse = await applyRateLimit(req, { requests: 5, window: '1 h' });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // --- Authenticate via JWT ---
    const auth = await verifyMobileToken(req);
    if (!auth || !auth.userId) {
      return corsError(req, 'Unauthorized', 401);
    }
    const userId = auth.userId;

    // --- Get user's phone number ---
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, firstName: true },
    });

    if (!user || !user.phone) {
      return corsError(req, 'מספר טלפון לא נמצא. אנא השלם את הפרופיל קודם.', 400);
    }

    // --- Create OTP ---
    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old pending verifications
    await prisma.verification.deleteMany({
      where: {
        userId,
        type: VerificationType.PHONE_WHATSAPP,
        status: 'PENDING',
      },
    });

    // Create new verification record
    await prisma.verification.create({
      data: {
        userId,
        type: VerificationType.PHONE_WHATSAPP,
        target: user.phone,
        token: otpCode,
        expiresAt: otpExpiresAt,
        status: 'PENDING',
      },
    });

    // --- Send via WhatsApp ---
    const sent = await sendOtpViaWhatsApp(user.phone, otpCode, user.firstName);

    if (!sent) {
      console.error(`[mobile/send-phone-code] Failed to send OTP for user ${userId}`);
      return corsError(req, 'שליחת קוד האימות בוואטסאפ נכשלה. אנא נסה שנית.', 500);
    }

    console.log(`[mobile/send-phone-code] OTP sent to ${user.phone} for user ${userId}`);

    return corsJson(req, {
      success: true,
      message: 'קוד אימות נשלח בהצלחה בוואטסאפ.',
    });

  } catch (error) {
    console.error('[mobile/send-phone-code] Error:', error);
    return corsError(req, 'שגיאה בשליחת קוד האימות.', 500);
  }
}
