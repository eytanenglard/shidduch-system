// src/app/api/mobile/settings/route.ts
// ==========================================
// NeshamaTech Mobile - User Settings API
// Combines language + consent settings in one endpoint
// ==========================================

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Language } from "@prisma/client";
import { z } from "zod";
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";

// ==========================================
// Validation Schemas
// ==========================================

const updateLanguageSchema = z.object({
  type: z.literal("language"),
  language: z.nativeEnum(Language, {
    errorMap: () => ({ message: "ערך השפה חייב להיות 'he' או 'en'." }),
  }),
});

const updateConsentSchema = z.object({
  type: z.literal("consent"),
  consentType: z.enum(["engagement", "promotional"], {
    required_error:
      "Consent type is required ('engagement' or 'promotional').",
  }),
  consentValue: z.boolean({
    required_error: "Consent value (true/false) is required.",
  }),
});

const updateSettingsSchema = z.discriminatedUnion("type", [
  updateLanguageSchema,
  updateConsentSchema,
]);

// ==========================================
// GET - Get current user settings
// ==========================================

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        language: true,
        engagementEmailsConsent: true,
        promotionalEmailsConsent: true,
        isVerified: true,
        isPhoneVerified: true,
        status: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return corsError(req, "User not found", 404);
    }

    return corsJson(req, {
      success: true,
      settings: {
        language: user.language,
        engagementEmailsConsent: user.engagementEmailsConsent,
        promotionalEmailsConsent: user.promotionalEmailsConsent,
        isVerified: user.isVerified,
        isPhoneVerified: user.isPhoneVerified,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("[mobile/settings] GET Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}

// ==========================================
// PUT - Update settings (language or consent)
// ==========================================

export async function PUT(req: NextRequest) {
  try {
    // 1. אימות
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }

    // 2. ולידציה
    const body = await req.json();
    const validationResult = updateSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      console.error(
        "[mobile/settings] Validation failed:",
        validationResult.error.flatten()
      );
      return corsError(req, "Invalid input", 400);
    }

    const data = validationResult.data;

    // 3. עדכון לפי סוג
    if (data.type === "language") {
      const updatedUser = await prisma.user.update({
        where: { id: auth.userId },
        data: { language: data.language },
        select: { language: true },
      });

      console.log(
        `[mobile/settings] ✅ Language updated to ${updatedUser.language} for user ${auth.userId}`
      );

      return corsJson(req, {
        success: true,
        message: "Language updated successfully.",
        language: updatedUser.language,
      });
    }

    if (data.type === "consent") {
      const updateData =
        data.consentType === "engagement"
          ? { engagementEmailsConsent: data.consentValue }
          : { promotionalEmailsConsent: data.consentValue };

      await prisma.user.update({
        where: { id: auth.userId },
        data: updateData,
      });

      console.log(
        `[mobile/settings] ✅ ${data.consentType} consent updated to ${data.consentValue} for user ${auth.userId}`
      );

      return corsJson(req, {
        success: true,
        message: "Consent preferences updated successfully.",
      });
    }

    return corsError(req, "Unknown setting type", 400);
  } catch (error) {
    console.error("[mobile/settings] PUT Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return corsError(req, errorMessage, 500);
  }
}