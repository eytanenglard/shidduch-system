// src/app/api/mobile/notifications/unregister-device/route.ts
// הסרת מכשיר מהתראות
// נתיב: POST /api/mobile/notifications/unregister-device

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { 
  corsJson,
  corsError,
  corsOptions
} from "@/lib/mobile-auth";

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return corsError(req, "Token is required", 400);
    }

    await prisma.deviceToken.deleteMany({
      where: { token },
    });

    console.log(`[mobile/notifications] Device token removed`);

    return corsJson(req, { success: true });

  } catch (error) {
    console.error("[mobile/notifications/unregister-device] Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}