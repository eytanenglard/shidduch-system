// src/app/api/mobile/notifications/register-device/route.ts
// רישום מכשיר להתראות Push
// נתיב: POST /api/mobile/notifications/register-device

import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { 
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions
} from "@/lib/mobile-auth";

const registerSchema = z.object({
  token: z.string().min(1, "Push token is required"),
  platform: z.enum(["ios", "android"]),
});

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }

    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return corsJson(req, { 
        success: false, 
        error: "Invalid input", 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const { token: pushToken, platform } = validation.data;

    await prisma.deviceToken.upsert({
      where: { token: pushToken },
      update: {
        userId: auth.userId,
        platform,
        updatedAt: new Date(),
      },
      create: {
        userId: auth.userId,
        token: pushToken,
        platform,
      },
    });

    console.log(`[mobile/notifications] Device registered for user ${auth.userId}, platform: ${platform}`);

    return corsJson(req, { success: true });

  } catch (error) {
    console.error("[mobile/notifications/register-device] Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}