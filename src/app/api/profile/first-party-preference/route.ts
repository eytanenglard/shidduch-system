// src/app/api/mobile/profile/first-party-preference/route.ts
// ==========================================
// NeshamaTech Mobile - First Party Preference API
// GET:   קבלת ההעדפה הנוכחית
// PATCH: עדכון ההעדפה
// ==========================================

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// GET /api/mobile/profile/first-party-preference
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: auth.userId },
      select: { wantsToBeFirstParty: true },
    });

    if (!profile) {
      return corsError(req, "Profile not found", 404);
    }

    return corsJson(req, {
      success: true,
      wantsToBeFirstParty: profile.wantsToBeFirstParty,
    });
  } catch (error) {
    console.error("[mobile/profile/first-party-preference] GET Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}

// ==========================================
// PATCH /api/mobile/profile/first-party-preference
// ==========================================
export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }

    let body: { wantsToBeFirstParty?: boolean };
    try {
      body = await req.json();
    } catch {
      return corsError(req, "Invalid JSON body", 400);
    }

    if (typeof body.wantsToBeFirstParty !== "boolean") {
      return corsError(req, "wantsToBeFirstParty must be a boolean", 400);
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId: auth.userId },
      data: { wantsToBeFirstParty: body.wantsToBeFirstParty },
      select: { wantsToBeFirstParty: true },
    });

    console.log(
      `[mobile/profile/first-party-preference] Updated for user ${auth.userId}: ${body.wantsToBeFirstParty}`
    );

    return corsJson(req, {
      success: true,
      wantsToBeFirstParty: updatedProfile.wantsToBeFirstParty,
    });
  } catch (error) {
    console.error("[mobile/profile/first-party-preference] PATCH Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}