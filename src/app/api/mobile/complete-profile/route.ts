// src/app/api/mobile/complete-profile/route.ts
// ==========================================
// NeshamaTech Mobile API - Complete Profile
// POST /api/mobile/complete-profile
// Requires JWT auth. Saves profile + sends WhatsApp OTP.
// UPDATED: Added termsAndPrivacyAcceptedAt support
// ==========================================

import { NextRequest } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';
import prisma from '@/lib/prisma';
import { UserStatus, VerificationType, Gender, Language } from '@prisma/client';
import { generateOtp, sendOtpViaWhatsApp } from '@/lib/phoneVerificationService';
import { hashOtp } from '@/lib/services/verificationService';
import {
  verifyMobileToken,
  formatUserForMobile,
  corsJson,
  corsError,
  corsOptions
} from "@/lib/mobile-auth";
import { mobileCompleteProfileSchema as completeProfileSchema, normalizePhone, isValidPhone } from '@/lib/validations/profileSchemas';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = await applyRateLimit(req, { requests: 10, window: '1 h' });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // --- Authenticate via JWT ---
    const auth = await verifyMobileToken(req);
    if (!auth || !auth.userId) {
      return corsError(req, 'Unauthorized', 401);
    }
    const userId = auth.userId;

    const body = await req.json();

    // --- Validate with Zod schema ---
    const validation = completeProfileSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'קלט לא תקין.';
      return corsError(req, firstError, 400);
    }

    const {
      firstName,
      lastName,
      phone,
      gender,
      birthDate,
      maritalStatus,
      city,
      origin,
      height,
      occupation,
      education,
      religiousLevel,
      religiousJourney,
      about,
      hasChildrenFromPrevious,
      language,
      engagementEmailsConsent,
      promotionalEmailsConsent,
      acceptTerms,
    } = validation.data;

    const normalizedPhone = normalizePhone(phone);
    if (!isValidPhone(normalizedPhone)) {
      return corsError(req, 'פורמט מספר טלפון לא תקין (נדרש פורמט בינלאומי E.164).', 400);
    }

    // --- Transaction: update profile + user ---
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Upsert profile
      await tx.profile.upsert({
        where: { userId },
        create: {
          userId,
          gender: gender as Gender,
          birthDate: new Date(birthDate),
          birthDateIsApproximate: false,
          maritalStatus,
          hasChildrenFromPrevious: hasChildrenFromPrevious === true,
          city,
          origin: origin || undefined,
          height: height ? parseInt(String(height)) : undefined,
          occupation: occupation || undefined,
          education: education || undefined,
          religiousLevel: religiousLevel || undefined,
          religiousJourney: (religiousJourney as any) || undefined,
          about: about || undefined,
          isProfileVisible: true,
          availabilityStatus: 'AVAILABLE',
        },
        update: {
          gender: gender as Gender,
          birthDate: new Date(birthDate),
          birthDateIsApproximate: false,
          maritalStatus,
          hasChildrenFromPrevious: hasChildrenFromPrevious === true,
          city,
          origin: origin || undefined,
          height: height ? parseInt(String(height)) : undefined,
          occupation: occupation || undefined,
          education: education || undefined,
          religiousLevel: religiousLevel || undefined,
          religiousJourney: (religiousJourney as any) || undefined,
          about: about || undefined,
          updatedAt: new Date(),
        },
      });

      // 2. Check if user already accepted terms (don't overwrite existing date)
      let termsData = {};
      if (acceptTerms) {
        const existingUser = await tx.user.findUnique({
          where: { id: userId },
          select: { termsAndPrivacyAcceptedAt: true },
        });
        if (!existingUser?.termsAndPrivacyAcceptedAt) {
          termsData = { termsAndPrivacyAcceptedAt: new Date() };
        }
      }

      // 3. Update user record
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          phone: normalizedPhone,
          isProfileComplete: true,
          language: language === 'en' ? Language.en : Language.he,
          status: UserStatus.PENDING_PHONE_VERIFICATION,
          engagementEmailsConsent,
          promotionalEmailsConsent,
          ...termsData,
          updatedAt: new Date(),
        },
      });

      return user;
    });

    // --- Send WhatsApp OTP (non-blocking) ---
    let phoneSent = false;
    try {
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

      // Create new verification
      await prisma.verification.create({
        data: {
          userId,
          type: VerificationType.PHONE_WHATSAPP,
          target: normalizedPhone,
          token: hashOtp(otpCode),
          expiresAt: otpExpiresAt,
          status: 'PENDING',
        },
      });

      phoneSent = await sendOtpViaWhatsApp(normalizedPhone, otpCode, firstName);
      if (phoneSent) {
        console.log(`[mobile/complete-profile] WhatsApp OTP sent for user ${userId}`);
      }
    } catch (otpError) {
      console.error('[mobile/complete-profile] Failed to send WhatsApp OTP:', otpError);
    }

    console.log(`[mobile/complete-profile] Profile completed for user ${userId}`);

    return corsJson(req, {
      success: true,
      message: phoneSent
        ? 'הפרופיל נשמר בהצלחה. נשלח קוד אימות בוואטסאפ.'
        : 'הפרופיל נשמר בהצלחה. הייתה בעיה בשליחת קוד אימות - תוכל לבקש קוד חדש.',
      user: formatUserForMobile(updatedUser),
      phoneSent,
    });

  } catch (error: unknown) {
    console.error('[mobile/complete-profile] Error:', error);

    if (error instanceof Error && error.message.includes('Unique constraint') ||
        (error as any)?.code === 'P2002') {
      const target = (error as any)?.meta?.target as string[] | undefined;
      if (target?.includes('phone')) {
        return corsError(req, 'מספר טלפון זה כבר רשום במערכת.', 409);
      }
    }

    return corsError(req, 'אירעה שגיאה בשמירת הפרופיל.', 500);
  }
}