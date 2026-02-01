// src/app/api/mobile/notifications/register-device/route.ts
// רישום מכשיר להתראות Push
// נתיב: POST /api/mobile/notifications/register-device

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { verifyMobileToken } from "@/lib/mobile-auth";

const registerSchema = z.object({
  token: z.string().min(1, "Push token is required"),
  platform: z.enum(["ios", "android"]),
});

export async function POST(req: NextRequest) {
  try {
    // אימות
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // וולידציה
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { token: pushToken, platform } = validation.data;

    // שמירה/עדכון של ה-token
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

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[mobile/notifications/register-device] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
